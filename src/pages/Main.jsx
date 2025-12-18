import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { Image } from 'ol/layer';
import { ImageStatic } from 'ol/source';
import { transform } from 'ol/proj';

import MapContext from '@/components/map/MapContext';
import { createWindOverlay } from '@/components/wind/wind-overlay';

const getWindLengthByZoom = zoom => {
  if (zoom >= 12) return 30;
  if (zoom >= 11) return 25;
  if (zoom >= 10) return 20;
  if (zoom >= 9) return 15;
  return 5;
};

function Main({ mapId, SetMap }) {
  const map = useContext(MapContext);
  const windOverlayRef = useRef([]);
  const [windData, setWindData] = useState([]);
  const [extent, setExtent] = useState(null);

  useEffect(() => {
    if (!map.ol_uid) return;
    if (SetMap) SetMap(map);

    map.on('singleclick', singleclick);

    return () => {
      map.un('singleclick', singleclick);
    };
  }, [map, map.ol_uid]);

  /* 바람 데이터 가져오기 */
  useEffect(() => {
    const fetchWind = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_WIND_API_URL}/api/utm`
      );
      setWindData(res.data.arrowData);
    };
    fetchWind();
  }, []);

  /* windData 기준 extent 계산 */
  useEffect(() => {
    if (windData.length > 0) {
      const latitudes = windData.map(item => item.lat);
      const longitudes = windData.map(item => item.lon);

      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLon = Math.min(...longitudes);
      const maxLon = Math.max(...longitudes);

      // 좌표 변환(EPSG:32652 → EPSG:3857)
      const transformedMin = transform(
        [minLon, minLat],
        'EPSG:32652',
        'EPSG:3857'
      );
      const transformedMax = transform(
        [maxLon, maxLat],
        'EPSG:32652',
        'EPSG:3857'
      );

      setExtent([
        transformedMin[0],
        transformedMin[1],
        transformedMax[0],
        transformedMax[1],
      ]);
    }
  }, [windData]);

  /* 이미지 레이어 추가 */
  useEffect(() => {
    if (!map?.ol_uid || !extent) return;

    // 등농도
    const rConcImageLayer = new Image({
      name: 'rConcImage',
      visible: true,
      source: new ImageStatic({
        url: `/img/model/25061/2024/11/17/00/00/10001_H1.5_rConc_202411170000.Main.Trans.PNG`,
        imageExtent: extent,
        crossOrigin: 'anonymous',
      }),
      zIndex: 1,
      opacity: 0.5,
    });

    // 바람장
    const rWindImageLayer = new Image({
      name: 'rWindImage',
      visible: true,
      source: new ImageStatic({
        url: `/img/model/25061/2024/11/17/00/00/10001_H1.5_rWind_202411170000.Main.Trans.PNG`,
        imageExtent: extent,
        crossOrigin: 'anonymous',
      }),
      zIndex: 2,
      opacity: 0.7,
    });

    map.addLayer(rConcImageLayer);
    map.addLayer(rWindImageLayer);
  }, [map, extent]);

  /* wind overlay(wind animation) 추가 */
  useEffect(() => {
    if (!map?.ol_uid || windData.length === 0) return;

    windOverlayRef.current.forEach(o => map.removeOverlay(o));
    windOverlayRef.current = [];

    windData.forEach(item => {
      windOverlayRef.current.push(createWindOverlay(map, item));
    });
  }, [map, windData]);

  /* 줌 레벨에 따른 바람 길이 조정 */
  useEffect(() => {
    if (!map?.ol_uid) return;

    const view = map.getView();

    const updateWindLength = () => {
      const zoom = view.getZoom();
      const length = getWindLengthByZoom(zoom);

      windOverlayRef.current.forEach(overlay => {
        if (!overlay._windEl || !overlay._windSpan) return;

        overlay._windEl.style.height = `${length}px`;
        overlay._windSpan.style.height = `${length}px`;
      });
    };

    map.on('moveend', updateWindLength);

    updateWindLength();

    return () => map.un('moveend', updateWindLength);
  }, [map]);

  const singleclick = e => {
    console.log(e.coordinate);
  };

  return <MapDiv id={mapId} />;
}

export default Main;

const MapDiv = styled.div`
  width: 100%;
  height: 940px;
  position: relative;
`;
const PopupContainer = styled.div`
  position: relative;
  // min-width: 0px;
  // min-height: 0px;
  top: 28px;
  left: -50px;
  padding: 10px;
  border: 1px solid #cccccc;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);

  &:after,
  &:before {
    //말풍선 및 삼각형
    position: absolute;
    width: 0;
    height: 0;
    bottom: 100%;
    border: solid transparent;
    content: ' ';
    pointer-event: none;
  }
  &:after {
    left: 48px;
    margin-left: -10px;
    border-bottom-color: #ffffff;
    border-width: 10px;
  }
  &:before {
    left: 48px;
    margin-left: -11px;
    border-bottom-color: #cccccc;
    border-width: 11px;
  }
`;
const PopupWrap = styled.div`
  width: 100%;
  // font
  //   font-family: 나눔바른고딕;
  font-size: 15px;
  line-height: 18px;
  color: #000000;
  white-space: pre-line;
`;
