import { useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, RegularShape, Stroke, Style } from 'ol/style';

import MapContext from '@/components/map/MapContext';
import { createWindOverlay } from '@/components/wind/wind-overlay';
import { Point, Polygon } from 'ol/geom';
import { Feature } from 'ol';
import { transform } from 'ol/proj';

function Lcc({ mapId, SetMap }) {
  const map = useContext(MapContext);

  const sourceCoordsRef = useRef(new VectorSource({ wrapX: false }));
  const sourceCoords = sourceCoordsRef.current;
  const layerCoordsRef = useRef(
    new VectorLayer({
      source: sourceCoords,
      id: 'coords',
      opacity: 0.7,
    })
  );

  const sourceArrowsRef = useRef(new VectorSource({ wrapX: false }));
  const sourceArrows = sourceArrowsRef.current;
  const layerArrowsRef = useRef(
    new VectorLayer({
      source: sourceArrows,
      id: 'arrows',
      opacity: 0.7,
    })
  );

  const shaft = new RegularShape({
    points: 2,
    radius: 5,
    stroke: new Stroke({
      width: 2,
      color: 'black',
    }),
    rotateWithView: true,
  });

  const head = new RegularShape({
    points: 3,
    radius: 5,
    fill: new Fill({
      color: 'black',
    }),
    rotateWithView: true,
  });

  const styles = [new Style({ image: shaft }), new Style({ image: head })];

  const windOverlayRef = useRef([]);
  const [windData, setWindData] = useState([]);

  const [layerVisible, setLayerVisible] = useState({
    coords: true,
    arrows: true,
    windAnimation: true,
  });

  useEffect(() => {
    if (!map.ol_uid) return;
    if (SetMap) SetMap(map);

    map.addLayer(layerCoordsRef.current);
    map.addLayer(layerArrowsRef.current);

    getLccData();

    map.on('singleclick', handleSingleClick);
  }, [map, map.ol_uid]);

  const handleSingleClick = e => {
    console.log(e.coordinate);
    console.log(transform(e.coordinate, 'EPSG:3857', 'LCC'));
  };

  useEffect(() => {
    if (!layerCoordsRef.current) return;
    layerCoordsRef.current.setVisible(layerVisible.coords);
  }, [layerVisible.coords]);

  useEffect(() => {
    if (!layerArrowsRef.current) return;
    layerArrowsRef.current.setVisible(layerVisible.arrows);
  }, [layerVisible.arrows]);

  const setPolygonFeatureStyle = f => {
    const value = f.get('value');

    const style = rgbs['O3'].find(s => value >= s.min && value < s.max);
    if (style) {
      f.setStyle(
        new Style({
          fill: new Fill({
            // color: style.color,
            color: style.color.replace(
              /rgba\(([^,]+), ([^,]+), ([^,]+), ([^,]+)\)/,
              (match, r, g, b, a) => `rgba(${r}, ${g}, ${b}, 0.3)`
            ),
          }),
        })
      );
    }
  };

  const getLccData = async () => {
    sourceArrows.clear();
    layerArrowsRef.current.getSource().clear();
    sourceCoords.clear();
    layerCoordsRef.current.getSource().clear();

    document.body.style.cursor = 'progress';

    await axios
      .post(`${import.meta.env.VITE_WIND_API_URL}/api/lcc`, {
        bgPoll: 'O3',
        arrowGap: 3,
      })
      .then(res => res.data)
      .then(data => {
        // console.log(data);

        if (!data.polygonData) return;

        // 좌표 데이터 Polygon Feature 생성
        const polygonFeatures = data.polygonData.map(item => {
          const feature = new Feature({
            geometry: new Polygon([
              [
                [item.lon - 4500, item.lat + 4500],
                [item.lon - 4500, item.lat - 4500],
                [item.lon + 4500, item.lat - 4500],
                [item.lon + 4500, item.lat + 4500],
                [item.lon - 4500, item.lat + 4500],
                // [item.lon - 13500, item.lat + 13500],
                // [item.lon - 13500, item.lat - 13500],
                // [item.lon + 13500, item.lat - 13500],
                // [item.lon + 13500, item.lat + 13500],
                // [item.lon - 13500, item.lat + 13500],
              ],
            ]),
            value: item.value,
          });
          return feature;
        });

        polygonFeatures.forEach(f => setPolygonFeatureStyle(f));
        sourceCoords.addFeatures(polygonFeatures);

        if (!data.arrowData) return;

        setWindData(data.arrowData);

        // 바람 화살표
        const arrowFeatures = data.arrowData.map(item => {
          const feature = new Feature({
            geometry: new Point([item.lon, item.lat]),
            wd: item.wd,
            ws: item.ws,
          });
          return feature;
        });
        sourceArrows.addFeatures(arrowFeatures);

        layerArrowsRef.current.setStyle(f => {
          const wd = f.get('wd');
          const ws = f.get('ws');
          const angle = ((wd - 180) * Math.PI) / 180;
          const scale = ws / 10;
          shaft.setScale([1, scale]);
          shaft.setRotation(angle);
          head.setDisplacement([
            0,
            head.getRadius() / 2 + shaft.getRadius() * scale,
          ]);
          head.setRotation(angle);
          return styles;
        });
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        alert('데이터를 가져오는 데 실패했습니다. 나중에 다시 시도해주세요.');
      });

    document.body.style.cursor = 'default';
  };

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

  return (
    <MapDiv id={mapId}>
      <Panel>
        <label>
          <input
            type="checkbox"
            checked={layerVisible.coords}
            onChange={e =>
              setLayerVisible(v => ({ ...v, coords: e.target.checked }))
            }
          />
          <span>물질 히트맵</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={layerVisible.arrows}
            onChange={e =>
              setLayerVisible(v => ({ ...v, arrows: e.target.checked }))
            }
          />
          <span>바람 화살표</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={layerVisible.windAnimation}
            onChange={e =>
              setLayerVisible(v => ({
                ...v,
                windAnimation: e.target.checked,
              }))
            }
          />
          <span>바람 애니메이션</span>
        </label>
      </Panel>
    </MapDiv>
  );
}

export default Lcc;

const rgbs = {
  O3: [
    {
      min: 0.0,
      max: 0.01,
      color: 'rgba(135, 192, 232, 1)',
    },
    {
      min: 0.01,
      max: 0.02,
      color: 'rgba(76, 162, 244, 1)',
    },
    {
      min: 0.02,
      max: 0.03,
      color: 'rgba(53, 150, 249, 1)',
    },
    {
      min: 0.03,
      max: 0.04,
      color: 'rgba(99, 254, 99, 1)',
    },
    {
      min: 0.04,
      max: 0.05,
      color: 'rgba(0, 234, 0, 1)',
    },
    {
      min: 0.05,
      max: 0.06,
      color: 'rgba(0, 216, 0, 1)',
    },
    {
      min: 0.06,
      max: 0.07,
      color: 'rgba(0, 177, 0, 1)',
    },
    {
      min: 0.07,
      max: 0.08,
      color: 'rgba(0, 138, 0, 1)',
    },
    {
      min: 0.08,
      max: 0.09,
      color: 'rgba(0, 117, 0, 1)',
    },
    {
      min: 0.09,
      max: 0.1,
      color: 'rgba(224, 224, 0, 1)',
    },
    {
      min: 0.1,
      max: 0.11,
      color: 'rgba(193, 193, 0, 1)',
    },
    {
      min: 0.11,
      max: 0.12,
      color: 'rgba(177, 177, 0, 1)',
    },
    {
      min: 0.12,
      max: 0.13,
      color: 'rgba(146, 146, 0, 1)',
    },
    {
      min: 0.13,
      max: 0.14,
      color: 'rgba(115, 115, 0, 1)',
    },
    {
      min: 0.14,
      max: 0.15,
      color: 'rgba(100, 100, 0, 1)',
    },
    {
      min: 0.15,
      max: 0.16,
      color: 'rgba(255, 150, 150, 1)',
    },
    {
      min: 0.16,
      max: 0.17,
      color: 'rgba(255, 120, 120, 1)',
    },
    {
      min: 0.17,
      max: 0.18,
      color: 'rgba(255, 90, 90, 1)',
    },
    {
      min: 0.18,
      max: 0.19,
      color: 'rgba(255, 60, 60, 1)',
    },
    {
      min: 0.19,
      max: Infinity,
      color: 'rgba(255, 0, 0, 1)',
    },
  ],
  PM10: [
    {
      min: 0,
      max: 6,
      color: 'rgba(135, 192, 232, 1)',
    },
    {
      min: 6,
      max: 18,
      color: 'rgba(76, 162, 244, 1)',
    },
    {
      min: 18,
      max: 31,
      color: 'rgba(53, 150, 249, 1)',
    },
    {
      min: 31,
      max: 40,
      color: 'rgba(99, 254, 99, 1)',
    },
    {
      min: 40,
      max: 48,
      color: 'rgba(0, 234, 0, 1)',
    },
    {
      min: 48,
      max: 56,
      color: 'rgba(0, 216, 0, 1)',
    },
    {
      min: 56,
      max: 64,
      color: 'rgba(0, 177, 0, 1)',
    },
    {
      min: 64,
      max: 72,
      color: 'rgba(0, 138, 0, 1)',
    },
    {
      min: 72,
      max: 81,
      color: 'rgba(0, 117, 0, 1)',
    },
    {
      min: 81,
      max: 93,
      color: 'rgba(224, 224, 0, 1)',
    },
    {
      min: 93,
      max: 105,
      color: 'rgba(193, 193, 0, 1)',
    },
    {
      min: 105,
      max: 117,
      color: 'rgba(177, 177, 0, 1)',
    },
    {
      min: 117,
      max: 130,
      color: 'rgba(146, 146, 0, 1)',
    },
    {
      min: 130,
      max: 142,
      color: 'rgba(115, 115, 0, 1)',
    },
    {
      min: 142,
      max: 151,
      color: 'rgba(100, 100, 0, 1)',
    },
    {
      min: 151,
      max: 191,
      color: 'rgba(255, 150, 150, 1)',
    },
    {
      min: 191,
      max: 231,
      color: 'rgba(255, 120, 120, 1)',
    },
    {
      min: 231,
      max: 271,
      color: 'rgba(255, 90, 90, 1)',
    },
    {
      min: 271,
      max: 320,
      color: 'rgba(255, 60, 60, 1)',
    },
    {
      min: 320,
      max: Infinity,
      color: 'rgba(255, 0, 0, 1)',
    },
  ],
  'PM2.5': [
    {
      min: 0,
      max: 5,
      color: 'rgba(135, 192, 232, 1)',
    },
    {
      min: 5,
      max: 10,
      color: 'rgba(76, 162, 244, 1)',
    },
    {
      min: 10,
      max: 16,
      color: 'rgba(53, 150, 249, 1)',
    },
    {
      min: 16,
      max: 19,
      color: 'rgba(99, 254, 99, 1)',
    },
    {
      min: 19,
      max: 22,
      color: 'rgba(0, 234, 0, 1)',
    },
    {
      min: 22,
      max: 26,
      color: 'rgba(0, 216, 0, 1)',
    },
    {
      min: 26,
      max: 30,
      color: 'rgba(0, 177, 0, 1)',
    },
    {
      min: 30,
      max: 33,
      color: 'rgba(0, 138, 0, 1)',
    },
    {
      min: 33,
      max: 36,
      color: 'rgba(0, 117, 0, 1)',
    },
    {
      min: 36,
      max: 42,
      color: 'rgba(224, 224, 0, 1)',
    },
    {
      min: 42,
      max: 48,
      color: 'rgba(193, 193, 0, 1)',
    },
    {
      min: 48,
      max: 55,
      color: 'rgba(177, 177, 0, 1)',
    },
    {
      min: 55,
      max: 62,
      color: 'rgba(146, 146, 0, 1)',
    },
    {
      min: 62,
      max: 69,
      color: 'rgba(115, 115, 0, 1)',
    },
    {
      min: 69,
      max: 76,
      color: 'rgba(100, 100, 0, 1)',
    },
    {
      min: 76,
      max: 107,
      color: 'rgba(255, 150, 150, 1)',
    },
    {
      min: 107,
      max: 138,
      color: 'rgba(255, 120, 120, 1)',
    },
    {
      min: 138,
      max: 169,
      color: 'rgba(255, 90, 90, 1)',
    },
    {
      min: 169,
      max: 200,
      color: 'rgba(255, 60, 60, 1)',
    },
    {
      min: 200,
      max: Infinity,
      color: 'rgba(255, 0, 0, 1)',
    },
  ],
};

const MapDiv = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
`;
const Panel = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;

  background: rgba(255, 255, 255, 0.85);
  padding: 10px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);

  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
    user-select: none;
  }
`;
