// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, AppContextType } from './AppContext';
import { AppContext } from './AppContext';

// see AppContext.ts for interfaces/context exports...
// 1. define the type for the 'session' object...
// 2. define the shape of the context value...
// 3. create the context...

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
    });

    // context value object contains global states and functions to pass...
    const contextValue: AppContextType = {
        loading, setLoading,
        collapsed, setCollapsed,
        session, setSession,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
}