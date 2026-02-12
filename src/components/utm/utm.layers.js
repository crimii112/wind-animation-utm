import { Image } from 'ol/layer';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export function createUtmLayers() {
  // 바람장 애니메이션
  const layerWindAnimation = new VectorLayer({
    id: 'windAnimation',
    source: new VectorSource(),
    style: null,
    updateWhileAnimating: true,
    zIndex: 10,
  });

  // 등농도 이미지
  const layerConcImage = new Image({
    id: 'rConcImage',
    zIndex: 1,
    opacity: 0.5,
  });

  // 바람장 이미지
  const layerWindImage = new Image({
    id: 'rWindImage',
    zIndex: 2,
    opacity: 0.7,
  });

  return {
    layerWindAnimation,
    layerConcImage,
    layerWindImage,
  };
}
