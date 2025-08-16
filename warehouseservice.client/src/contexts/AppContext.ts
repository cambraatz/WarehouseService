import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';

// 1. define the type for the 'session' object...
export interface Session {
    id: number;
    username: string;
    company: string;
    //valid: boolean;
};

// 2. define the shape of the context value...
export interface AppContextType {
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    collapsed: boolean;
    setCollapsed: Dispatch<SetStateAction<boolean>>;
    session: Session;
    setSession: Dispatch<SetStateAction<Session>>;
};

// 3. create the context...
// provide a default value matching AppContextType shape...
export const AppContext = createContext<AppContextType | undefined>(undefined);