import { useEffect, useState } from 'react';
import { Map as OlMap, View } from 'ol';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { defaults as defaultControls } from 'ol/control';
import {
  DblClickDragZoom,
  defaults as defaultInteractions,
} from 'ol/interaction';
import { Tile } from 'ol/layer';
import { OSM, XYZ } from 'ol/source';
import styled from 'styled-components';
import MapContext from './MapContext';

const MapProvider = ({ id, defaultMode = 'Base', children }) => {
  const [mapObj, setMapObj] = useState({});

  proj4.defs(
    'EPSG:32652',
    '+proj=utm +zone=52 +ellps=WGS84 +datum=WGS84 +units=m +no_defs',
  );
  register(proj4);

  useEffect(() => {
    const center = [538363, 3989913];

    const osmLayer = new Tile({
      name: 'OSM',
      source: new OSM({
        tilePixelRatio: 5,
      }),
    });

    const vworldBaseLayer = new Tile({
      name: 'Base',
      source: new XYZ({
        url: `http://api.vworld.kr/req/wmts/1.0.0/${
          import.meta.env.VITE_APP_VWORLD_API_KEY
        }/Base/{z}/{y}/{x}.png`,
      }),
    });

    const vworldSatelliteLayer = new Tile({
      name: 'Satellite',
      source: new XYZ({
        url: `http://api.vworld.kr/req/wmts/1.0.0/${
          import.meta.env.VITE_APP_VWORLD_API_KEY
        }/Satellite/{z}/{y}/{x}.jpeg`,
      }),
    });

    const view = new View({
      projection: 'EPSG:32652',
      center: center,
      zoom: 12.5,
      maxZoom: 14,
      minZoom: 8,
      units: 'm',
    });

    const map = new OlMap({
      controls: defaultControls({ zoom: false, rotate: false }),
      interactions: defaultInteractions().extend([new DblClickDragZoom()]),
      layers: [
        // osmLayer,
        vworldBaseLayer,
        // vworldSatelliteLayer
      ],
      view,
      target: id,
    });

    setMapObj(map);

    return () => map.setTarget(undefined);
  }, [id]);

  return (
    <MapContext.Provider value={mapObj}>
      <MapDiv>{children}</MapDiv>
    </MapContext.Provider>
  );
};

export default MapProvider;

const MapDiv = styled.div`
  .ol-overlaycontainer-stopevent {
    padding: 5px;
  }
`;
