import { useEffect } from 'react';

export function useWebViewBridge({ updateSettings, toggleLayer }) {
  useEffect(() => {
    if (!window.chrome?.webview) return;

    const handler = e => {
      const msg = e.data;
      console.log(msg);

      if (msg.type === 'SET_DATETIME') {
        const [y, m, d] = msg.date.split('-');

        const newDate = new Date();
        newDate.setFullYear(Number(y), Number(m) - 1, Number(d));
        newDate.setHours(Number(msg.hour), 0, 0, 0);

        updateSettings('dateTime', newDate);
      }

      if (msg.type === 'TOGGLE_LAYER') {
        toggleLayer(msg.layer, msg.visible);
      }
    };

    window.chrome.webview.addEventListener('message', handler);

    return () => {
      window.chrome.webview.removeEventListener('message', handler);
    };
  }, []);
}
