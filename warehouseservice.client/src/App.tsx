//import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import WarehouseLanding from './components/WarehouseLanding.tsx';
import DeliveryValidation from './components/DeliveryValidation.tsx';
import DeliveryManifest from './components/DeliveryManifest.tsx';
import LoadingManifest from './components/LoadingManifest.tsx';
import UnloadingPage from './components/UnloadingPage.tsx';
import UnloadingListPage from './components/UnloadingListPage.tsx';
import './App.css';

import { AppProvider } from './contexts/AppContext.tsx';


const NotFound: React.FC = () => { return <h1>404 - Not Found</h1> };

function App() {
    return (
        <div className="App">
            <AppProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={ <WarehouseLanding /> } />
                        <Route path="/unload" element={ <UnloadingPage /> } />
                        <Route path="/unload/:bolnum" element={ <UnloadingListPage /> } />
                        <Route path="/load" element={ <DeliveryValidation /> } />
                        <Route path="/load/manifest" element={ <DeliveryManifest /> } />
                        <Route path="/load/trailer/:proNum" element={ <LoadingManifest /> } />
                        <Route path="*" element={ <NotFound /> } />
                    </Routes>
                </BrowserRouter>
            </AppProvider>
        </div>
    );
}

export default App;