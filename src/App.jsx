import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import Main from '@/pages/Main';
import MapProvider from '@/components/map/MapProvider';

function App() {
  return (
    <BrowserRouter>
      <div className="">
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex flex-col w-screen h-screen">
                <MapProvider id="webglTest">
                  <Main mapId="webglTest" />
                </MapProvider>
              </div>
            }
          />
        </Routes>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </div>
    </BrowserRouter>
  );
}

export default App;
