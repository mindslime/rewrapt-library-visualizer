"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// The key used in localStorage to track if the tour was completed/skipped
const FTUE_STORAGE_KEY = 'rewrapped_has_seen_tour';

interface FTUEContextType {
    isClient: boolean;
    hasSeenTour: boolean;
    isTourActive: boolean;
    currentStepIndex: number;
    startTour: () => void;
    skipTour: () => void;
    nextStep: (maxSteps: number) => void;
    prevStep: () => void;
    setIsReady: (ready: boolean) => void;
    pauseTour: () => void;
    resumeTour: (stepIndex?: number) => void;
}

const FTUEContext = createContext<FTUEContextType | undefined>(undefined);

export function FTUEProvider({ children }: { children: ReactNode }) {
    const [hasSeenTour, setHasSeenTour] = useState<boolean>(true); // Default to true to prevent flash of tour
    const [isTourActive, setIsTourActive] = useState<boolean>(false);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [isClient, setIsClient] = useState<boolean>(false);
    const [isReady, setIsReady] = useState<boolean>(false);

    useEffect(() => {
        setIsClient(true);
        if (!isReady) return;

        // On mount (or when ready), check if they've seen the tour
        const storedValue = localStorage.getItem(FTUE_STORAGE_KEY);
        if (!storedValue) {
            setHasSeenTour(false);
            // Wait a moment before starting the tour to let the app load data
            const timer = setTimeout(() => {
                setIsTourActive(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isReady]);

    const startTour = useCallback(() => {
        setHasSeenTour(false);
        setIsTourActive(true);
        setCurrentStepIndex(0);
    }, []);

    const completeTour = useCallback(() => {
        localStorage.setItem(FTUE_STORAGE_KEY, 'true');
        setHasSeenTour(true);
        setIsTourActive(false);
    }, []);

    const skipTour = useCallback(() => {
        localStorage.setItem(FTUE_STORAGE_KEY, 'true');
        setHasSeenTour(true);
        setIsTourActive(false);
    }, []);

    const nextStep = useCallback((maxSteps: number) => {
        setCurrentStepIndex((prev) => {
            if (prev >= maxSteps - 1) {
                completeTour();
                return prev;
            }
            return prev + 1;
        });
    }, [completeTour]);

    const prevStep = useCallback(() => {
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
    }, []);

    const pauseTour = useCallback(() => {
        setIsTourActive(false);
    }, []);

    const resumeTour = useCallback((stepIndex?: number) => {
        if (stepIndex !== undefined) {
            setCurrentStepIndex(stepIndex);
        }
        setIsTourActive(true);
    }, []);

    return (
        <FTUEContext.Provider value={{
            isClient,
            hasSeenTour,
            isTourActive,
            currentStepIndex,
            startTour,
            skipTour,
            nextStep,
            prevStep,
            setIsReady,
            pauseTour,
            resumeTour
        }
        }>
            {children}
        </FTUEContext.Provider>
    );
}

export function useFTUE() {
    const context = useContext(FTUEContext);
    if (context === undefined) {
        throw new Error('useFTUE must be used within an FTUEProvider');
    }
    return context;
}
