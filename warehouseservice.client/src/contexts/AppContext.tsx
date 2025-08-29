// eslint-disable-next-line no-unused-vars
import React, { useState, createContext, useContext } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import type { RawShipment } from '../types/shipments';
import type { Delivery } from '../components/LoadingManifest';
//import type { Session, AppContextType } from './AppContext';
//import { AppContext } from './AppContext';

// 1. define the type for the 'session' object...
export interface Session {
    id: number;
    username: string;
    company: string;
    mfstdate?: string;
    powerunit?: string;
    packageList?: RawShipment[];
    //valid: boolean;
};

export interface LoadingSession {
    mfstdate: string;
    powerunit: string;
    activeDelivery?: Delivery;
}

// 2. define the shape of the context value...
export interface AppContextType {
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    collapsed: boolean;
    setCollapsed: Dispatch<SetStateAction<boolean>>;
    session: Session;
    setSession: Dispatch<SetStateAction<Session>>;
    loadingSession: LoadingSession;
    setLoadingSession: Dispatch<SetStateAction<LoadingSession>>;
};

// 3. create the context...
// provide a default value matching AppContextType shape...
// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext<AppContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within on AppProvider');
    }
    return context;
}

// 4. define the props for the AppProvider component...
// tells TS the component expects a 'children' prop...
interface AppProviderProps {
    children: ReactNode;
};

// 5. create the provider component with specified props...
export function AppProvider({ children }: AppProviderProps) {
    // global states...
    const [loading,setLoading] = useState<boolean>(true);
    const [collapsed,setCollapsed] = useState<boolean>(false);
    const [session,setSession] = useState<Session>({
        id: -1,
        username: "",
        company: "",
        mfstdate: undefined,
        powerunit: undefined,
        packageList: undefined
    });
    const [loadingSession, setLoadingSession] = useState<LoadingSession>({
        mfstdate: "",
        powerunit: "",
        activeDelivery: undefined,
    });

    // context value object contains global states and functions to pass...
    const contextValue: AppContextType = {
        loading, setLoading,
        collapsed, setCollapsed,
        session, setSession,
        loadingSession, setLoadingSession,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}

