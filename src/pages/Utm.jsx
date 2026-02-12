import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

import { ImageStatic } from 'ol/source';

import MapContext from '@/components/map/MapContext';
import { useWebViewBridge } from '@/hooks/useWebViewBridge';
import UtmMapControlPanel from '@/components/ui/utm-map-control-panel';
import WindParticle from '@/components/wind/wind-particle';
import { createUtmLayers } from '@/components/utm/utm.layers';
import { UtmContext } from '@/components/utm/UtmContext';

function Utm({ mapId, SetMap }) {
  const isWebView = typeof window !== 'undefined' && window.IS_WEBVIEW === true;

  const map = useContext(MapContext);
  const { settings, updateSettings, style, layerVisible, toggleLayer } =
    useContext(UtmContext);

  const dateTime = settings.dateTime;

  const [windData, setWindData] = useState([]);
  const [extent, setExtent] = useState(null);

  const layersRef = useRef(createUtmLayers());
  const windParticlesRef = useRef([]);

  const formatDateTime = date => {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');

    return {
      yyyy,
      MM,
      dd,
      HH,
      path: `${yyyy}/${MM}/${dd}/${HH}/00`,
      vecFile: `r_${yyyy}_M${MM}_D${dd}_${HH}00(UTC+0900)_L00_1HR.vec`,
    };
  };

  useEffect(() => {
    if (!map.ol_uid) return;
    if (SetMap) SetMap(map);

    const { layerWindAnimation, layerConcImage, layerWindImage } =
      layersRef.current;

    map.addLayer(layerWindAnimation);
    map.addLayer(layerConcImage);
    map.addLayer(layerWindImage);

    map.on('singleclick', handleSingleClick);

    return () => {
      map.removeLayer(layerWindAnimation);
      map.removeLayer(layerConcImage);
      map.removeLayer(layerWindImage);

      map.un('singleclick', handleSingleClick);
    };
  }, [map, map.ol_uid]);

  const handleSingleClick = e => {
    console.log(e.coordinate);
    // console.log(transform(e.coordinate, 'EPSG:3857', 'LCC'));
  };

  useEffect(() => {
    if (!map?.ol_uid) return;

    const { layerConcImage, layerWindImage, layerWindAnimation } =
      layersRef.current;

    layerConcImage.setVisible(layerVisible.concImage);
    layerWindImage.setVisible(layerVisible.windImage);
    layerWindAnimation.setVisible(layerVisible.windAnimation);
  }, [map?.ol_uid, layerVisible]);

  useEffect(() => {
    layersRef.current.layerConcImage.setOpacity(style.concImageOpacity);
  }, [style.concImageOpacity]);

  useEffect(() => {
    layersRef.current.layerWindImage.setOpacity(style.windImageOpacity);
  }, [style.windImageOpacity]);

  /* 바람 데이터 가져오기 */
  useEffect(() => {
    const getWindData = async () => {
      const { yyyy, MM, dd, HH } = formatDateTime(dateTime);

      const { data } = await axios.post(
        `${import.meta.env.VITE_WIND_API_URL}/api/utm/wind`,
        {
          yyyy,
          MM,
          dd,
          HH,
        },
      );

      setWindData(data.windData);
      setExtent(data.extent);
    };

    getWindData();
  }, [dateTime]);

  /* 이미지 데이터 추가 */
  useEffect(() => {
    if (!map?.ol_uid || !extent) return;

    let concUrl;
    let windUrl;

    const loadImage = async (imgType, layer) => {
      const { yyyy, MM, dd, HH } = formatDateTime(dateTime);

      const { data } = await axios.post(
        `${import.meta.env.VITE_WIND_API_URL}/api/utm/img`,
        {
          imgType,
          yyyy,
          MM,
          dd,
          HH,
        },
        { responseType: 'blob' },
      );

      const objectUrl = URL.createObjectURL(data);

      if (imgType === 'conc') concUrl = objectUrl;
      if (imgType === 'wind') windUrl = objectUrl;

      layer.setSource(
        new ImageStatic({
          url: objectUrl,
          imageExtent: extent,
        }),
      );
    };

    const { layerConcImage, layerWindImage } = layersRef.current;

    loadImage('conc', layerConcImage);
    loadImage('wind', layerWindImage);

    return () => {
      if (concUrl) URL.revokeObjectURL(concUrl);
      if (windUrl) URL.revokeObjectURL(windUrl);
    };
  }, [map?.ol_uid, extent, dateTime]);

  /* 바람장 애니메이션 추가 */
  useEffect(() => {
    windParticlesRef.current = windData.map(
      item => new WindParticle(item, style.windColor),
    );
  }, [windData, style.windColor]);

  useEffect(() => {
    if (!map?.ol_uid) return;
    if (!layerVisible.windAnimation) return;

    const { layerWindAnimation } = layersRef.current;
    let rafId;

    const animate = () => {
      layerWindAnimation.changed();
      rafId = requestAnimationFrame(animate);
    };

    const handlePostRender = e => {
      if (windParticlesRef.current.length === 0) return;

      const ctx = e.context;
      const pixelRatio = e.frameState.pixelRatio;

      ctx.save();
      ctx.scale(pixelRatio, pixelRatio);

      windParticlesRef.current.forEach(p => {
        p.update();
        p.draw(ctx, map);
      });

      ctx.restore();
    };

    layerWindAnimation.on('postrender', handlePostRender);
    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      layerWindAnimation.un('postrender', handlePostRender);
    };
  }, [map, layerVisible.windAnimation]);

  useWebViewBridge({ updateSettings, toggleLayer });

  return <MapDiv id={mapId}>{!isWebView && <UtmMapControlPanel />}</MapDiv>;
}

export default Utm;

const MapDiv = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
`;
