import { useContext, useEffect, useMemo, useRef, useState } from 'react';
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

  const imageLayersRef = useRef({
    conc: null,
    wind: null,
  });

  const [layerVisible, setLayerVisible] = useState({
    concImage: true,
    windImage: true,
    windAnimation: true,
  });

  const [dateTime, setDateTime] = useState(
    () => new Date(2025, 8, 19, 0, 0, 0) // 2025-09-19 00:00:00
  );
  const formatLocalDate = date => {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd}`;
  };
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

    map.on('singleclick', singleclick);

    return () => {
      map.un('singleclick', singleclick);
    };
  }, [map, map.ol_uid]);

  /* 바람 데이터 가져오기 */
  useEffect(() => {
    const fetchWind = async () => {
      const { path, vecFile } = formatDateTime(dateTime);

      const res = await axios.get(`/img/model/25061/${path}/${vecFile}`);

      const arrowData = res.data
        .split('\n')
        .slice(1)
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            lat: parseFloat(parts[1]) * 1000,
            lon: parseFloat(parts[0]) * 1000,
            wd: Math.abs(parseFloat(parts[3])),
            ws: parseFloat(parts[4]),
          };
        });

      setWindData(arrowData);
    };

    fetchWind();
  }, [dateTime]);

  /* windData 기준 extent 계산 */
  const extent = useMemo(() => {
    if (windData.length === 0) return null;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLon = Infinity;
    let maxLon = -Infinity;

    for (const { lat, lon } of windData) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }

    // 좌표 변환(EPSG:32652 → EPSG:3857)
    const [minX, minY] = transform([minLon, minLat], 'EPSG:32652', 'EPSG:3857');
    const [maxX, maxY] = transform([maxLon, maxLat], 'EPSG:32652', 'EPSG:3857');

    return [minX, minY, maxX, maxY];
  }, [windData]);

  /* 이미지 레이어 추가 */
  useEffect(() => {
    if (!map?.ol_uid || !extent) return;

    const { yyyy, MM, dd, HH } = formatDateTime(dateTime);

    const rConcUrl = `/img/model/25061/${yyyy}/${MM}/${dd}/${HH}/00/10001_H1.5_rConc_${yyyy}${MM}${dd}${HH}00.Main.Trans.PNG`;
    const rWindUrl = `/img/model/25061/${yyyy}/${MM}/${dd}/${HH}/00/10001_H1.5_rWind_${yyyy}${MM}${dd}${HH}00.Main.Trans.PNG`;

    if (!imageLayersRef.current.conc) {
      // 등농도
      const rConcImageLayer = new Image({
        name: 'rConcImage',
        visible: layerVisible.concImage,
        source: new ImageStatic({
          url: rConcUrl,
          imageExtent: extent,
          crossOrigin: 'anonymous',
        }),
        zIndex: 1,
        opacity: 0.5,
      });

      // 바람장
      const rWindImageLayer = new Image({
        name: 'rWindImage',
        visible: layerVisible.windImage,
        source: new ImageStatic({
          url: rWindUrl,
          imageExtent: extent,
          crossOrigin: 'anonymous',
        }),
        zIndex: 2,
        opacity: 0.7,
      });

      map.addLayer(rConcImageLayer);
      map.addLayer(rWindImageLayer);

      imageLayersRef.current.conc = rConcImageLayer;
      imageLayersRef.current.wind = rWindImageLayer;
    } else {
      // 등농도
      if (imageLayersRef.current.conc) {
        imageLayersRef.current.conc.setSource(
          new ImageStatic({
            url: rConcUrl,
            imageExtent: extent,
            crossOrigin: 'anonymous',
          })
        );
      }

      // 바람장
      if (imageLayersRef.current.wind) {
        imageLayersRef.current.wind.setSource(
          new ImageStatic({
            url: rWindUrl,
            imageExtent: extent,
            crossOrigin: 'anonymous',
          })
        );
      }
    }
  }, [map, extent, dateTime]);

  /* 이미지 on/off 토글 연결 */
  useEffect(() => {
    if (!imageLayersRef.current.conc) return;

    imageLayersRef.current.conc.setVisible(layerVisible.concImage);
    imageLayersRef.current.wind.setVisible(layerVisible.windImage);
  }, [layerVisible.concImage, layerVisible.windImage]);

  /* wind overlay(wind animation) 추가 */
  useEffect(() => {
    if (!map?.ol_uid) return;

    windOverlayRef.current.forEach(o => map.removeOverlay(o));
    windOverlayRef.current = [];

    if (!layerVisible.windAnimation || windData.length === 0) return;

    windData.forEach(item => {
      windOverlayRef.current.push(createWindOverlay(map, item));
    });
  }, [map, windData, layerVisible.windAnimation]);

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

  return (
    <MapDiv id={mapId}>
      <ToggleBox>
        <TimeBox>
          <button
            onClick={() =>
              setDateTime(d => new Date(d.getTime() - 60 * 60 * 1000))
            }
          >
            ◀
          </button>

          <input
            type="date"
            value={formatLocalDate(dateTime)}
            onChange={e => {
              const [y, m, d] = e.target.value.split('-');
              setDateTime(prev => {
                const n = new Date(prev);
                n.setFullYear(y, m - 1, d);
                return n;
              });
            }}
          />

          <select
            value={dateTime.getHours()}
            onChange={e =>
              setDateTime(prev => {
                const n = new Date(prev);
                n.setHours(Number(e.target.value));
                return n;
              })
            }
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, '0')}
              </option>
            ))}
          </select>

          <button
            onClick={() =>
              setDateTime(d => new Date(d.getTime() + 60 * 60 * 1000))
            }
          >
            ▶
          </button>
        </TimeBox>
        <label>
          <input
            type="checkbox"
            checked={layerVisible.concImage}
            onChange={e =>
              setLayerVisible(v => ({ ...v, concImage: e.target.checked }))
            }
          />
          <span>등농도 이미지</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={layerVisible.windImage}
            onChange={e =>
              setLayerVisible(v => ({ ...v, windImage: e.target.checked }))
            }
          />
          <span>바람장 이미지</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={layerVisible.windAnimation}
            onChange={e =>
              setLayerVisible(v => ({ ...v, windAnimation: e.target.checked }))
            }
          />
          <span>바람 애니메이션</span>
        </label>
      </ToggleBox>
    </MapDiv>
  );
}

export default Main;

const MapDiv = styled.div`
  width: 100%;
  height: 940px;
  position: relative;
`;

const ToggleBox = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: rgba(255, 255, 255, 0.8);
  padding: 10px 12px;
  border-radius: 6px;
  z-index: 1000;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);

  label {
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;
const TimeBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  button {
    padding: 2px 6px;
    cursor: pointer;
  }

  input,
  select {
    font-size: 12px;
    background: white;
    padding: 2px 4px;
    font-size: 13px;
    border: 1px solid lightgray;
  }
  select {
    padding: 3px 4px;
  }
`;
