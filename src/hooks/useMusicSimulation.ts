import { useRef, useEffect, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { GenreNode } from '@/types/spotify';
import { PILLAR_COORDINATES } from '@/utils/spotifyTransform';

export interface SimulationNode extends d3.SimulationNodeDatum {
    id: string;
    name: string;
    count: number;
    radius: number;
    color: string;
    targetX?: number; // Normalized -1 to 1
    targetY?: number; // Normalized -1 to 1

    // Original data ref
    data: GenreNode;

    // Animation state
    currentRadius: number;
    currentScale?: number;
}

interface UseMusicSimulationProps {
    data: GenreNode[];
    width: number;
    height: number;
    mode: 'GLOBAL' | 'CLUSTER'; // Global = All Genres, Cluster = Specific Genre exploded
}

export function useMusicSimulation({ data, width, height, mode }: UseMusicSimulationProps) {
    const simulationRef = useRef<d3.Simulation<SimulationNode, undefined> | null>(null);
    const nodesRef = useRef<SimulationNode[]>([]);

    // Dynamic Container Radius Calculation
    // Small playlist = Smaller ring to keep density high.
    // Large library = Larger ring to reduce crowding.
    const minDim = Math.min(width, height);

    // DENSITY-BASED SIZING ALGORITHM (Iteration 6)
    // Goal: Size the ring so that bubbles fill it nicely, regardless of count.

    // 1. Calculate the "Visual Mass" of the data
    // We sum the theoretically required diameter for all bubbles.
    // Base unit matches the bubble size calculation below
    const baseUnit = minDim / 1000;

    // Calculate a theoretical dynamic scale for sizing estimation
    const count = data.length;
    let scalingFactor = 1.0;
    if (count < 40) {
        scalingFactor = 1.0 + (3.5 * (1 - (count / 40)));
    } else {
        scalingFactor = Math.max(0.4, 6.0 / Math.sqrt(count + 6));
    }

    // Sum of Diameters: The linear space needed if laid out in a line
    // Bubble Radius ~= (sqrt(count) * 4.5 * baseUnit) * scale
    // We ignore the constant factor (+ 2 * baseUnit) for the broad estimation
    const totalBubbleDiameter = data.reduce((acc, d) => {
        const radius = (Math.sqrt(d.count) * 4.5 * baseUnit) * scalingFactor;
        return acc + (radius * 2);
    }, 0);

    // 2. Determine Optimal Circumference
    // We want the bubbles to occupy roughly 40-50% of the ring's perimeter for a "breathing" look.
    // If we pack them 100%, they touch. 

    // RESPONSIVE SPACING FACTOR (Iteration 7)
    // Mobile (Small Screen) = 2.5 (Loose, user likes this)
    // Desktop (Large Screen) = 1.8 (Tight, to prevent huge gaps)
    // We interpolate linearly between 350px and 1200px.
    const mobileDim = 350;
    const desktopDim = 1200;
    const mobileFactor = 2.5;
    const desktopFactor = 1.8;

    let spacingFactor = mobileFactor;

    if (minDim >= desktopDim) {
        spacingFactor = desktopFactor;
    } else if (minDim > mobileDim) {
        // Linear Interpolation: 
        // progress 0 (350px) -> 1 (1200px)
        const progress = (minDim - mobileDim) / (desktopDim - mobileDim);
        spacingFactor = mobileFactor - (progress * (mobileFactor - desktopFactor));
    }

    const idealCircumference = totalBubbleDiameter * spacingFactor;

    // 3. Derive Ideal Radius (C = 2 * PI * r  =>  r = C / 2PI)
    const idealRadius = idealCircumference / (2 * Math.PI);

    // 4. Convert to Factor (0.0 to 1.0 of minDim)
    let sizeFactor = idealRadius / minDim;

    // 5. Build Safety Clamps
    // Never smaller than 25% (too crushed)
    // Never larger than 60% (off screen)
    sizeFactor = Math.max(0.25, Math.min(0.60, sizeFactor));

    // Debugging visual tuning
    useEffect(() => {
        console.log('[MusicSimulation] Density Tuning:', {
            count,
            scalingFactor,
            totalBubbleDiameter,
            idealCircumference,
            idealRadius,
            spacingFactor,
            calculatedSizeFactor: sizeFactor,
            clampedSizeFactor: Math.max(0.25, Math.min(0.60, sizeFactor)),
            minDim
        });
    }, [count, scalingFactor, totalBubbleDiameter, idealCircumference, idealRadius, spacingFactor, sizeFactor, minDim]);

    // CLUSTER MODE: Always use Max Radius to fill the screen
    const containerRadius = mode === 'CLUSTER'
        ? minDim * 0.60
        : minDim * sizeFactor;

    // Attraction Radius scales with Container
    const attractionRadius = containerRadius * 0.95; // 95% of container (closer to the Rim)

    const center = { x: width / 2, y: height / 2 };

    // Initialize / Update Simulation
    useEffect(() => {
        // Validation: Need dimensions and data
        if (!width || !height || width <= 0 || height <= 0 || data.length === 0) return;

        // Dynamic Bubble Scaling (Tuned - Iteration 5)
        // Tune: Extend the "Big Bubble" logic to 40 genres.
        // We fade the boost from 4.5x (at 1 genre) down to ~1.0x (at 40 genres).
        let dynamicScale = 1.0;
        if (count < 40) {
            // Linear drop from 4.5 to 1.0 over 40 items
            const boost = 3.5 * (1 - (count / 40));
            dynamicScale = 1.0 + boost;
        } else {
            dynamicScale = Math.max(0.4, 6.0 / Math.sqrt(count + 6));
        }

        // Window-Relative Unit
        // If window is 1000px, unit is 1. If 500px, unit is 0.5.
        // This allows bubbles to scale with the window size.
        const baseUnit = Math.min(width, height) / 1000;

        // 1. Prepare Nodes
        const newNodes: SimulationNode[] = data.map(d => {
            const existing = nodesRef.current.find(n => n.id === d.id);

            // Base size: sqrt(count) for area.
            // Middle ground multiplier (4.5).
            // e.g. Count 100 -> 10. * 4.5 = 45 units.

            // CLUSTER MODE BOOST:
            // If in cluster mode, we want bigger bubbles to fill the view.
            const modeMultiplier = mode === 'CLUSTER' ? 2.5 : 1.0;

            let radius = (Math.sqrt(d.count) * 4.5 * baseUnit + 2 * baseUnit) * dynamicScale * modeMultiplier;

            // Cap it relative to container 
            // Relax cap for Cluster mode (50% vs 40%)
            const capRatio = mode === 'CLUSTER' ? 0.50 : 0.40;
            radius = Math.min(radius, containerRadius * capRatio);

            // Sanity check min radius (very small, just to avoid 0)
            radius = Math.max(2, radius);

            // Extracts pre-calc position from transform
            const p = (d as any).pillarPos || { x: 0, y: 0 };
            const spawnX = center.x + (p.x * attractionRadius);
            const spawnY = center.y + (p.y * attractionRadius);

            return {
                ...existing,
                id: d.id,
                name: d.name,
                count: d.count,
                radius: radius,
                color: (d as any).color || '#ffffff',
                targetX: p.x,
                targetY: p.y,
                data: d,
                currentRadius: existing ? existing.currentRadius : 0,
                x: existing && !isNaN(existing.x!) ? existing.x : spawnX + (Math.random() - 0.5) * 50,
                y: existing && !isNaN(existing.y!) ? existing.y : spawnY + (Math.random() - 0.5) * 50,
            };
        });

        nodesRef.current = newNodes;

        // 2. Setup Force Simulation
        if (simulationRef.current) simulationRef.current.stop();

        simulationRef.current = d3.forceSimulation<SimulationNode>(newNodes)
            .alpha(1)
            .alphaDecay(0.04)
            .velocityDecay(0.6)
            .force("collide", d3.forceCollide()
                .radius((d: any) => d.radius + 4) // Added more padding
                .strength(1.0) // Maximum stiffness
                .iterations(6) // More iterations to resolve overlap
            )
            .force("pillar_x", d3.forceX((d: any) => {
                if (mode === 'GLOBAL') {
                    if (isNaN(d.targetX)) return center.x;
                    return center.x + (d.targetX * attractionRadius);
                }
                return center.x;
            }).strength(mode === 'GLOBAL' ? 0.1 : 0.15)) // Relaxed strength so collision wins

            .force("pillar_y", d3.forceY((d: any) => {
                if (mode === 'GLOBAL') {
                    if (isNaN(d.targetY)) return center.y;
                    return center.y + (d.targetY * attractionRadius);
                }
                return center.y;
            }).strength(mode === 'GLOBAL' ? 0.1 : 0.15))

            .force("charge", d3.forceManyBody().strength(-10))
            .force("enclosure", () => {
                const limit = containerRadius;

                nodesRef.current.forEach(node => {
                    if (!node.x || !node.y || isNaN(node.x) || isNaN(node.y)) return;
                    const dx = node.x - center.x;
                    const dy = node.y - center.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const nodeReach = dist + node.currentRadius;

                    if (nodeReach > limit) {
                        const angle = Math.atan2(dy, dx);
                        const allowedDist = Math.max(0, limit - node.currentRadius);

                        node.x = center.x + Math.cos(angle) * allowedDist;
                        node.y = center.y + Math.sin(angle) * allowedDist;

                        node.vx = (node.vx || 0) * 0.1;
                        node.vy = (node.vy || 0) * 0.1;
                    }
                });
            });

        if (mode === 'CLUSTER') {
            simulationRef.current.force("charge", d3.forceManyBody().strength(d => -((d as any).radius) * 2));
        }

        simulationRef.current.restart();

        return () => {
            simulationRef.current?.stop();
        };

    }, [data, width, height, mode]); // Re-run if container size changes (which depends on width/height/data)

    return {
        simulation: simulationRef.current,
        nodes: nodesRef.current,
        simulationRef,
        nodesRef,
        containerRadius // Export this!
    };
}
