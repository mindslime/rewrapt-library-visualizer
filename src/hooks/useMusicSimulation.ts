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
    // Large library = Max ring to fit everything.
    const minDim = Math.min(width, height);
    const maxR = minDim * 0.45;
    const minR = minDim * 0.25;

    // Scale from 0 to 200 items (after 200, we stay at max size)
    // Using sqrt to grow space faster initially
    const capacity = 200;
    const ratio = Math.min(1, Math.sqrt(data.length / capacity));

    // CLUSTER MODE: Always use Max Radius to fill the screen
    const containerRadius = mode === 'CLUSTER'
        ? maxR
        : minR + (maxR - minR) * ratio;

    // Attraction Radius scales with Container
    const attractionRadius = containerRadius * 0.75; // 75% of container

    const center = { x: width / 2, y: height / 2 };

    // Initialize / Update Simulation
    useEffect(() => {
        // Validation: Need dimensions and data
        if (!width || !height || width <= 0 || height <= 0 || data.length === 0) return;

        // Dynamic Bubble Scaling
        // Inverse relationship with node count to optimize screen real estate.
        // Few nodes (e.g. 5) -> Larger bubbles (~1.2 scale)
        // Many nodes (e.g. 100) -> Smaller bubbles (~0.5 scale)
        const dynamicScale = Math.min(2.5, Math.max(0.4, 6.0 / Math.sqrt(data.length + 20)));

        // Window-Relative Unit
        // If window is 1000px, unit is 1. If 500px, unit is 0.5.
        // This allows bubbles to scale with the window size.
        const baseUnit = Math.min(width, height) / 1000;

        // 1. Prepare Nodes
        const newNodes: SimulationNode[] = data.map(d => {
            const existing = nodesRef.current.find(n => n.id === d.id);

            // Base size: sqrt(count) for area.
            // Middle ground multiplier (was 3.5, now 4.5).
            // e.g. Count 100 -> 10. * 4.5 = 45 units.

            // CLUSTER MODE BOOST:
            // If in cluster mode, we want bigger bubbles to fill the view.
            const modeMultiplier = mode === 'CLUSTER' ? 2.5 : 1.0;

            let radius = (Math.sqrt(d.count) * 4.5 * baseUnit + 2 * baseUnit) * dynamicScale * modeMultiplier;

            // Cap it relative to container 
            // Relax cap for Cluster mode (40% vs 28%)
            const capRatio = mode === 'CLUSTER' ? 0.40 : 0.28;
            radius = Math.min(radius, containerRadius * capRatio);

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
                .radius((d: any) => d.radius + 2)
                .strength(0.9)
                .iterations(3)
            )
            .force("pillar_x", d3.forceX((d: any) => {
                if (mode === 'GLOBAL') {
                    if (isNaN(d.targetX)) return center.x;
                    return center.x + (d.targetX * attractionRadius);
                }
                return center.x;
            }).strength(mode === 'GLOBAL' ? 0.3 : 0.15))

            .force("pillar_y", d3.forceY((d: any) => {
                if (mode === 'GLOBAL') {
                    if (isNaN(d.targetY)) return center.y;
                    return center.y + (d.targetY * attractionRadius);
                }
                return center.y;
            }).strength(mode === 'GLOBAL' ? 0.3 : 0.15))

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
