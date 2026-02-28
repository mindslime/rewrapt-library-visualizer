"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
    isDemoMode: boolean;
    enableDemoMode: () => void;
    disableDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
    const [isDemoMode, setIsDemoMode] = useState(false);

    // Load initial state from localStorage on mount
    React.useEffect(() => {
        const stored = localStorage.getItem('rewrapped_demo_mode');
        if (stored === 'true') {
            setIsDemoMode(true);
        }
    }, []);

    const enableDemoMode = () => {
        setIsDemoMode(true);
        localStorage.setItem('rewrapped_demo_mode', 'true');
    };

    const disableDemoMode = () => {
        setIsDemoMode(false);
        localStorage.removeItem('rewrapped_demo_mode');
    };

    return (
        <DemoContext.Provider value={{ isDemoMode, enableDemoMode, disableDemoMode }}>
            {children}
        </DemoContext.Provider>
    );
}

export function useDemoMode() {
    const context = useContext(DemoContext);
    if (context === undefined) {
        throw new Error('useDemoMode must be used within a DemoProvider');
    }
    return context;
}
