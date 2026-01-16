import { BrowserRouter, Route, Routes } from 'react-router-dom';

import MapProvider from '@/components/map/MapProvider';
import Utm from '@/pages/Utm';

function App() {
  return (
    <BrowserRouter>
      <div className="">
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex flex-col w-screen h-screen">
                <MapProvider id="UtmOverlayTest">
                  <Utm mapId="UtmOverlayTest" />
                </MapProvider>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
