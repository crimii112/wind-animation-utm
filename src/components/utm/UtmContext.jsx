import { createContext, useCallback, useState } from 'react';

export const UtmContext = createContext();

export const UtmProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    dateTime: new Date(2026, 0, 15, 0, 0, 0),
  });

  const [style, setStyle] = useState({
    concImageOpacity: 0.5,
    windImageOpacity: 0.7,
    windColor: '#1480FE',
  });

  const [layerVisible, setLayerVisible] = useState({
    concImage: true,
    windImage: true,
    windAnimation: true,
  });

  const updateSettings = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  });

  const updateStyle = useCallback((key, value) => {
    setStyle(prev => ({ ...prev, [key]: value }));
  });

  const toggleLayer = useCallback((key, checked) => {
    setLayerVisible(prev => ({ ...prev, [key]: checked }));
  });

  const value = {
    settings,
    updateSettings,
    style,
    updateStyle,
    layerVisible,
    toggleLayer,
  };

  return <UtmContext.Provider value={value}>{children}</UtmContext.Provider>;
};
