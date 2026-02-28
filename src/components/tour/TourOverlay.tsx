"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOUR_STEPS, TourStep } from '@/data/tour-steps';
import { useFTUE } from '@/hooks/useFTUE';

interface ElementRect {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
}

export function TourOverlay() {
    const { isClient, isTourActive, currentStepIndex, hasSeenTour, skipTour, nextStep, prevStep } = useFTUE();
    const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
    const [windowWidth, setWindowWidth] = useState<number>(0);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    const step: TourStep | undefined = TOUR_STEPS[currentStepIndex];

    // Try to find the target element to position the spotlight and tooltip
    const updateTargetRect = useCallback(() => {
        if (!step) return;

        if (step.target === 'body') {
            setTargetRect(null); // No specific target, center tooltip
            return;
        }

        if (step.id === 'artist-node') {
            // Since nodes are rendered on a canvas, there is no discrete DOM element for a node.
            // We will position the tooltip near the center of the canvas where a prominent node would be
            const canvasEl = document.querySelector('[data-tour="map-canvas"]');
            if (canvasEl) {
                const rect = canvasEl.getBoundingClientRect();
                setTargetRect({
                    top: rect.top + (rect.height / 2) - 40,
                    left: rect.left + (rect.width / 2) - 40,
                    width: 80,
                    height: 80,
                    bottom: rect.top + (rect.height / 2) + 40,
                    right: rect.left + (rect.width / 2) + 40,
                });
                return;
            }
        }

        const el = document.querySelector(step.target);
        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                bottom: rect.bottom,
                right: rect.right,
            });
        } else {
            // Element not found on screen (might happen if D3 map isn't rendered yet during a view swap).
            // We consciously DO NOT setTargetRect(null) here.
            // Retaining the previous targetRect prevents the modal from executing a wild 
            // "stretch to center" animation while waiting for the 300ms fallback timeout to catch the new element.
        }
    }, [step]);

    // Handle initial client setup
    useEffect(() => {
        if (!isClient) return;
        setWindowWidth(document.documentElement.clientWidth);
        setIsMobile(window.innerWidth < 768);
    }, [isClient]);

    // Handle Resize and Scroll events
    useEffect(() => {
        if (!isClient || !isTourActive) return;

        const handleResize = () => {
            setWindowWidth(document.documentElement.clientWidth);
            setIsMobile(window.innerWidth < 768);
            updateTargetRect();
        };

        const handleScroll = () => {
            updateTargetRect();
        };

        window.addEventListener('resize', handleResize);
        // Use capture phase for scroll to catch scrolling on inner containers
        window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, { capture: true });
        };
    }, [isClient, isTourActive, updateTargetRect]);

    // Handle step or state changes
    useEffect(() => {
        if (isTourActive) {
            // First try to update immediately for fluid "one-step" animation transitions
            updateTargetRect();

            // Then add a slight delay/retry for dynamic elements like D3 nodes or pending renders
            const timer = setTimeout(() => {
                updateTargetRect();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isTourActive, currentStepIndex, step, updateTargetRect]);
    if (!isClient || !isTourActive || !step) return null;

    const isWelcomeStep = step.target === 'body';
    const isBottomSheet = isMobile && !isWelcomeStep;

    // Calculate tooltip placement for desktop or centered modals
    let tooltipTop = '50%';
    let tooltipLeft = '50%';
    let tooltipTransform = '';

    if (isWelcomeStep || step.isCentered || !targetRect) {
        // Pixel-perfect centering for welcome, explicitly centered steps, or when target is missing
        const tooltipWidth = 340;
        const estimatedHeight = 240;
        tooltipLeft = `${(windowWidth / 2) - (tooltipWidth / 2)}px`;
        tooltipTop = `${(window.innerHeight / 2) - (estimatedHeight / 2)}px`;
        tooltipTransform = '';
    } else if (!isBottomSheet && targetRect) {
        // Basic logic: Try putting it below the element. If too low, put it above.
        const spaceBelow = window.innerHeight - targetRect.bottom;
        const spaceAbove = targetRect.top;
        const padding = 20;
        const estimatedTooltipHeight = 240;
        let tooltipTopPx = 0;

        // Bounding logic without relying on CSS transforms for X-axis
        const tooltipWidth = 340;
        let requestedCenterLeft = targetRect.left + (targetRect.width / 2);

        // The leftmost edge the tooltip is allowed to be
        const minLeftEdge = padding;
        // The rightmost edge the tooltip is allowed to be
        const maxLeftEdge = windowWidth - tooltipWidth - padding;

        // Calculate where the left edge of the tooltip SHOULD be to center it on the button
        let computedLeftEdge = requestedCenterLeft - (tooltipWidth / 2);

        // Clamp the left edge firmly between the min and max bounds
        computedLeftEdge = Math.max(minLeftEdge, Math.min(maxLeftEdge, computedLeftEdge));
        tooltipLeft = `${computedLeftEdge}px`;

        if (step.id === 'playlists-section') {
            // Anchor inside the top edge of the playlist box - moved 10px higher than before
            tooltipTopPx = targetRect.top + 10;
        } else if (spaceBelow >= spaceAbove && spaceBelow > 200) {
            // Put below
            tooltipTopPx = targetRect.bottom + padding;
        } else {
            // Put above
            tooltipTopPx = targetRect.top - estimatedTooltipHeight - padding;
        }

        // --- NEW: Vertical Clamping ---
        const minTopEdge = padding;
        const maxTopEdge = window.innerHeight - estimatedTooltipHeight - padding;
        tooltipTopPx = Math.max(minTopEdge, Math.min(maxTopEdge, tooltipTopPx));

        tooltipTop = `${tooltipTopPx}px`;
    }

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            <AnimatePresence>
                {/* 4-Pane Window Cutout logic */}
                {targetRect && !isWelcomeStep && !step.noOverlay && (
                    <>
                        {/* Top Plane */}
                        <motion.div
                            layout
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed top-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-[9997] pointer-events-auto"
                            style={{ height: Math.max(0, targetRect.top - 10) }}
                        />
                        {/* Bottom Plane */}
                        <motion.div
                            layout
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-[9997] pointer-events-auto"
                            style={{ top: targetRect.bottom + 10 }}
                        />
                        {/* Left Plane */}
                        <motion.div
                            layout
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed left-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-[9997] pointer-events-auto"
                            style={{
                                top: targetRect.top - 10,
                                height: targetRect.height + 20,
                                width: Math.max(0, targetRect.left - 10)
                            }}
                        />
                        {/* Right Plane */}
                        <motion.div
                            layout
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed right-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-[9997] pointer-events-auto"
                            style={{
                                top: targetRect.top - 10,
                                height: targetRect.height + 20,
                                left: targetRect.right + 10
                            }}
                        />
                    </>
                )}

                {/* Full-screen background for Welcome Step OR fallback if active target missing */}
                {!step.noOverlay && (isWelcomeStep || !targetRect) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm z-[9997] pointer-events-auto"
                    />
                )}

                {/* Glowing Border around cutout (only if overlay is active) */}
                {targetRect && !isWelcomeStep && !step.noOverlay && (
                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute rounded-2xl border-2 border-white/20 pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.1)] z-[9998]"
                        style={{
                            top: targetRect.top - 10,
                            left: targetRect.left - 10,
                            width: targetRect.width + 20,
                            height: targetRect.height + 20,
                        }}
                    />
                )}

                {/* Click Blocker hole if action or interaction is not required/allowed yet (and overlay is active) */}
                {targetRect && !step.noOverlay && !isWelcomeStep && (!step.requiresAction && !step.allowInteraction) && (
                    <div className="absolute pointer-events-auto z-[9998]"
                        style={{
                            top: targetRect.top - 10,
                            left: targetRect.left - 10,
                            width: targetRect.width + 20,
                            height: targetRect.height + 20,
                        }}
                    />
                )}

                {/* The Floating Tooltip Card */}
                <motion.div
                    layout
                    initial={{ opacity: 0, y: isBottomSheet ? 50 : 20, scale: isWelcomeStep ? 0.95 : 1 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: isWelcomeStep ? 0.95 : 1 }}
                    className={`absolute pointer-events-auto bg-[#1d1d1f]/60 backdrop-blur-2xl border border-white/[0.15] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] ring-1 ring-white/5 p-6 flex flex-col gap-4 z-[10000] ${isWelcomeStep
                        ? 'w-[calc(100%-40px)] max-w-[340px] rounded-3xl' // Removed tailwind centering classes
                        : isBottomSheet
                            ? 'bottom-0 left-0 right-0 w-full rounded-t-3xl border-b-0 pb-8'
                            : 'w-[calc(100%-40px)] max-w-[340px] rounded-3xl' // Desktop targeted
                        }`}
                    style={isBottomSheet ? {} : {
                        top: tooltipTop,
                        left: tooltipLeft,
                        transform: tooltipTransform || undefined,
                    }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            {step.title}
                        </h3>
                        <span className="text-xs font-medium text-white/40 bg-white/5 px-2 py-1 rounded-full whitespace-nowrap">
                            {currentStepIndex + 1} / {TOUR_STEPS.length}
                        </span>
                    </div>

                    {/* Description */}
                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                        {step.description.split('\n').map((line, i) => (
                            <div key={i} className={line.startsWith('Note:') ? 'text-xs text-gray-500 mt-1' : ''}>
                                {line}
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
                        <button
                            onClick={skipTour}
                            className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Skip Tour
                        </button>

                        <div className="flex gap-2 items-center">
                            {currentStepIndex > 0 && (
                                <button
                                    onClick={prevStep}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    Prev
                                </button>
                            )}

                            {step.requiresAction ? (
                                <span className="text-sm font-medium text-green-400 animate-pulse px-2">
                                    Waiting for you...
                                </span>
                            ) : (
                                <button
                                    onClick={() => nextStep(TOUR_STEPS.length)}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-black bg-white hover:bg-gray-200 transition-colors"
                                >
                                    {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
