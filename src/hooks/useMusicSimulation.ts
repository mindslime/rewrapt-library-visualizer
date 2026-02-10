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
    // Track the "virtual" size of the canvas (Infinite Canvas)
    const [simulationBounds, setSimulationBounds] = useState({ width: width, height: height });

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
    const mobileFactor = 1.8;
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
    let rawSizeFactor = idealRadius / minDim;

    // 5. Build Safety Clamps
    // Never smaller than 35% (70% width) - Ensures visibility
    // Never larger than 60% (off screen)
    const minSizeClamp = 0.35;

    // AUTO-ZOOM: If the natural size is too small, we scale the bubbles UP to fit the min container.
    // This prevents "tiny dots in a tiny ring".
    let autoZoom = 1.0;
    if (rawSizeFactor < minSizeClamp && rawSizeFactor > 0.001) {
        autoZoom = minSizeClamp / rawSizeFactor;
    }

    const sizeFactor = Math.max(minSizeClamp, Math.min(0.60, rawSizeFactor));

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
        ? minDim * 0.90
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
        // Window-Relative Unit
        // If window is 1000px, unit is 1. If 500px, unit is 0.5.
        // This allows bubbles to scale with the window size.
        const baseUnit = Math.min(width, height) / 1000;
        const isMobile = width < 600;

        // 1. Prepare Nodes
        const newNodes: SimulationNode[] = data.map(d => {
            // FORCE RESET IN CLUSTER MODE:
            // If we are in CLUSTER mode, we want a fresh "Big Bang" explosion from the center.
            // We ignore any existing nodes (even if IDs match) to ensure they spawn at spawnX/Y.
            const existing = mode === 'CLUSTER' ? undefined : nodesRef.current.find(n => n.id === d.id);

            // Base size: sqrt(count) for area.
            // Middle ground multiplier (4.5).
            // e.g. Count 100 -> 10. * 4.5 = 45 units.

            // CLUSTER MODE BOOST (Dynamic based on count):
            // Iteration 5: User wants them bigger and closer.
            // Uniform boost to make them clearly visible.
            // Iteration 9: Mobile Optimization (2.0x vs 3.0x)
            // Iteration 11: Max Density (2.5x vs 4.0x) - Bigger!
            // Iteration 18: Dynamic Sizing based on Screen Size
            // Scale multiplier from 2.5 (small screen) to 6.0 (large screen)
            // Base unit is 1000px.
            const minDim = Math.min(width, height);
            let clusterMultiplier = 4.0 * (minDim / 800);
            clusterMultiplier = Math.max(2.5, Math.min(6.0, clusterMultiplier));

            const modeMultiplier = mode === 'CLUSTER' ? clusterMultiplier : 1.0;

            let radius = (Math.sqrt(d.count) * 4.5 * baseUnit + 2 * baseUnit) * dynamicScale * modeMultiplier;
            radius *= autoZoom; // Apply auto-zoom

            // Cap it relative to container 
            // Cap at 35% for Cluster (Desktop) to allow 3 large bubbles to share the screen
            // Allow 45% on Mobile (Vertical stacking / taller aspect ratio)
            const capRatio = mode === 'CLUSTER' ? (isMobile ? 0.45 : 0.35) : 0.40;
            radius = Math.min(radius, containerRadius * capRatio);

            // Sanity check min radius (very small, just to avoid 0)
            radius = Math.max(2, radius);

            // Extracts pre-calc position from transform
            const p = (d as any).pillarPos || { x: 0, y: 0 };

            // FIX STRAGGLERS: In CLUSTER mode, force everyone to spawn at the center.
            // This ensures the "Big Bang" expansion includes everyone.
            // In GLOBAL mode, they spawn at their pillar positions.
            const spawnX = mode === 'CLUSTER' ? center.x : center.x + (p.x * attractionRadius);
            const spawnY = mode === 'CLUSTER' ? center.y : center.y + (p.y * attractionRadius);

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

        // 3. INFINITE CANVAS CALCULATION
        // Calculate how much space we *actually* need.
        // If the bubbles need more room than the screen provided, we expand the bounds.
        let virtualWidth = width;
        let virtualHeight = height;

        if (mode === 'CLUSTER') {
            // Sum of bubble areas + padding
            const padding = 2;
            const totalArea = newNodes.reduce((acc, node) => {
                const r = node.radius + (padding * baseUnit);
                return acc + (Math.PI * r * r);
            }, 0);

            // Packing Factor: Circles don't pack perfectly.
            // Iteration 21: Relax padding for small clusters (large bubbles) to avoid edge collision
            // Small clusters (<20): 1.25x (More room for big bubbles)
            // Large clusters: 1.1x (Standard tight fit)
            // Iteration 22: ZOOM OUT (User Request)
            // We drastically increase packing factor to 1.5x - 1.8x.
            // This makes the "world" bigger, so the auto-zoom zooms OUT.
            // Result: Bubbles look smaller, and have huge margins to float in without hitting edges.
            const packingFactor = newNodes.length < 20 ? 1.8 : 1.5;
            const requiredArea = totalArea * packingFactor;

            // Aspect Ratio Lock (Screen Shape)
            const aspectRatio = width / height;

            // h * (h * ar) = area  =>  h = sqrt(area / ar)
            let vH = Math.sqrt(requiredArea / aspectRatio);
            let vW = vH * aspectRatio;

            // Ensure we never shrink smaller than the actual viewport
            if (vW < width) {
                vW = width;
                vH = height;
            }

            virtualWidth = vW;
            virtualHeight = vH;
        }

        // Update bounds state for external consumers (like Zoom constraints)
        setSimulationBounds({ width: virtualWidth, height: virtualHeight });

        // 2. Setup Force Simulation
        if (simulationRef.current) simulationRef.current.stop();

        // Dynamic Padding based on Count
        // Iteration 7: Restrict high padding to CLUSTER mode.
        // Cluster = 10 (Avoid overlap), Global = 4 (Tight packing for pillars)
        // Iteration 9: Mobile Optimization (Cluster = 5 for tighter packing)
        // Iteration 11: Max Density (Cluster = 2 for tightest packing)
        let clusterPadding = mode === 'CLUSTER' ? 2 : 4;

        // Iteration 10: Dynamic Gravity for Infinite Canvas
        // If we have a large cluster (>25) and are in Cluster mode,
        // we cut gravity to effectively zero (0.005).
        // This allows the bubbles to drift out to the virtual boundaries (Infinite Canvas).
        // For small clusters, we keep them cohesive (0.15).
        // Iteration 12: Increased Gravity (0.02) to prevent excessive spreading
        // Iteration 16: Max Screen Fill - Disable gravity for ALL clusters to let them expand to edges
        // Iteration 19: Gravity Restored (0.15) to pull bubbles into a cohesive mass.
        // We rely on Tight Bounds + Auto-Zoom to fill the screen, rather than Repulsion.
        const centerStrength = mode === 'GLOBAL' ? 0.1 : 0.15;

        simulationRef.current = d3.forceSimulation<SimulationNode>(newNodes)
            .alpha(1)
            .alphaDecay(0.02) // Slower decay = Longer simulation time to pull in stragglers
            .velocityDecay(0.6)
            .force("collide", d3.forceCollide()
                .radius((d: any) => d.radius + (clusterPadding * baseUnit))
                .strength(1.0) // Maximum stiffness
                .iterations(20) // Extreme iterations to resolve stressful overlap
            )
            .force("pillar_x", d3.forceX((d: any) => {
                if (mode === 'GLOBAL') {
                    if (isNaN(d.targetX)) return center.x;
                    return center.x + (d.targetX * attractionRadius);
                }
                return center.x;
            }).strength(centerStrength))

            .force("pillar_y", d3.forceY((d: any) => {
                if (mode === 'GLOBAL') {
                    if (isNaN(d.targetY)) return center.y;
                    return center.y + (d.targetY * attractionRadius);
                }
                return center.y;
            }).strength(centerStrength))

            .force("charge", d3.forceManyBody().strength(-10 * baseUnit))
            .force("enclosure", () => {
                const limit = containerRadius;

                // Virtual Bounds for Infinite Canvas
                const halfW = virtualWidth / 2;
                const halfH = virtualHeight / 2;
                const minX = center.x - halfW;
                const maxX = center.x + halfW;
                const minY = center.y - halfH;
                const maxY = center.y + halfH;

                nodesRef.current.forEach(node => {
                    if (!node.x || !node.y || isNaN(node.x) || isNaN(node.y)) return;

                    if (mode === 'CLUSTER') {
                        // SOFT WALLS (Anti-Vibration)
                        // Instead of hard resetting position (which causes jitter when fighting collision forces),
                        // we apply a strong velocity correction ("Restoring Force") when out of bounds.
                        const r = node.currentRadius;
                        const wallStiffness = 0.5; // How strongly we push back (0.0 - 1.0)

                        // Left
                        if (node.x < minX + r) {
                            const penetration = (minX + r) - node.x;
                            node.vx = (node.vx || 0) + (penetration * wallStiffness);
                        }
                        // Right
                        else if (node.x > maxX - r) {
                            const penetration = node.x - (maxX - r);
                            node.vx = (node.vx || 0) - (penetration * wallStiffness);
                        }

                        // Top
                        if (node.y < minY + r) {
                            const penetration = (minY + r) - node.y;
                            node.vy = (node.vy || 0) + (penetration * wallStiffness);
                        }
                        // Bottom
                        else if (node.y > maxY - r) {
                            const penetration = node.y - (maxY - r);
                            node.vy = (node.vy || 0) - (penetration * wallStiffness);
                        }

                        // HARD CLAMP SAFETY NET
                        // If they get BLASTED way out (e.g. > 10% past limit), hard clamp them to save the sim.
                        const safetyMargin = minDim * 0.1;

                        if (node.x < minX - safetyMargin) { node.x = minX + r; node.vx = 0; }
                        if (node.x > maxX + safetyMargin) { node.x = maxX - r; node.vx = 0; }
                        if (node.y < minY - safetyMargin) { node.y = minY + r; node.vy = 0; }
                        if (node.y > maxY + safetyMargin) { node.y = maxY - r; node.vy = 0; }

                    } else {
                        // CIRCULAR BOUNDARY for Global Mode
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
                    }
                });
            });

        if (mode === 'CLUSTER') {
            if (mode === 'CLUSTER') {
                // Standard Repulsion (1.0x) - let Gravity do the work of cohesion
                simulationRef.current.force("charge", d3.forceManyBody().strength(d => -((d as any).radius) * 1.0));
            }
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
        containerRadius, // Export this!
        simulationBounds // Export virtual bounds
    };
}
