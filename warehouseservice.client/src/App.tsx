//import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import WarehouseLanding from './components/WarehouseLanding.tsx';
import './App.css';

import { AppProvider } from './contexts/AppContext.tsx';

function App() {
    return (
        <div className="App">
            <AppProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={ <WarehouseLanding /> } />
                    </Routes>
                </BrowserRouter>
            </AppProvider>
        </div>
    );
}

export default App;