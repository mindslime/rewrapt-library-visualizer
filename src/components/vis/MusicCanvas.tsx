"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import { useMusicSimulation, SimulationNode } from '@/hooks/useMusicSimulation';
import { GenreNode } from '@/types/spotify';
import { PILLARS, PILLAR_COORDINATES } from '@/utils/spotifyTransform';

export interface MusicCanvasRef {
    zoomToNode: (node: SimulationNode, duration?: number) => Promise<void>;
}

interface MusicCanvasProps {
    nodes: GenreNode[];
    onNodeClick?: (node: GenreNode) => void;
    onBackgroundClick?: () => void;
    mode?: 'GLOBAL' | 'CLUSTER';
    enableEntryTransition?: boolean;
}

const MusicCanvas = forwardRef<MusicCanvasRef, MusicCanvasProps>(({ nodes, onNodeClick, onBackgroundClick, mode = 'GLOBAL', enableEntryTransition = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, dpr: 1 });

    // Zoom State
    const transformRef = useRef(d3.zoomIdentity); // { k, x, y }
    const savedGlobalTransform = useRef(d3.zoomIdentity);
    const prevMode = useRef(mode);

    // D3 Refs for Imperative Zoom
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
    const selectionRef = useRef<d3.Selection<HTMLCanvasElement, unknown, null, undefined> | null>(null);

    // --- IMPERATIVE API ---
    useImperativeHandle(ref, () => ({
        zoomToNode: async (node: SimulationNode, duration = 750) => {
            if (!selectionRef.current || !zoomBehaviorRef.current) return;

            const width = dimensions.width;
            const height = dimensions.height;

            // Target Scale: Fill ~60% of screen with the bubble diameter
            // node.radius is visual radius.
            // At scale 1, diameter = node.radius * 2.
            // We want (node.radius * 2 * k) = minDim * 0.6
            // k = (minDim * 0.6) / (node.radius * 2)
            const minDim = Math.min(width, height);

            // FILL FACTOR: 1.5x (150% coverage) to ensure we are "inside" the bubble color
            // Use maximum of 1 to prevent invalid math
            const safeRadius = Math.max(1, node.radius);
            const targetScale = (minDim * 1.5) / (safeRadius * 2);

            // UNLOCK ZOOM LIMITS:
            // Standard limit is 8x. Small bubbles need 50x+ to fill screen.
            // We temporarily boost the limit on the behavior instance.
            if (zoomBehaviorRef.current) {
                zoomBehaviorRef.current.scaleExtent([0.1, Math.max(100, targetScale * 1.2)]);
            }

            // Center the node
            // translate(width/2, height/2).scale(k).translate(-node.x, -node.y)
            const transform = d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(targetScale)
                .translate(-node.x!, -node.y!);

            return new Promise<void>((resolve) => {
                selectionRef.current!
                    .transition()
                    .duration(duration)
                    .ease(d3.easeExpIn) // Accelerate into the warp
                    .call(zoomBehaviorRef.current!.transform as any, transform)
                    .on("end", () => resolve());
            });
        }
    }));

    // Init Simulation
    const { simulationRef, nodesRef, containerRadius, simulationBounds } = useMusicSimulation({
        data: nodes,
        width: dimensions.width,
        height: dimensions.height,
        mode
    });

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                    dpr: window.devicePixelRatio || 1
                });
            }
        };

        const resizeObserver = new ResizeObserver(() => updateSize());
        resizeObserver.observe(containerRef.current);
        updateSize();

        return () => resizeObserver.disconnect();
    }, []);

    // Render Loop & Zoom Logic
    useEffect(() => {
        if (!canvasRef.current || !simulationRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Hover State (Local to effect)
        let hoveredNode: SimulationNode | null = null;

        // --- ZOOM SETUP ---
        // Center of the "World" (where nodes spawning centered at)
        const cx = dimensions.width / 2;
        const cy = dimensions.height / 2;

        let minScale = 1;
        let startScale = 1; // The optimal "initial" zoom level (boosted)
        let extent: [[number, number], [number, number]] = [[0, 0], [dimensions.width, dimensions.height]];

        if (mode === 'GLOBAL') {
            // GLOBAL MODE: Smart constraints
            // Calculate scale to fit the Galaxy (~containerRadius) within the view
            // We want to limit zooming out so the galaxy is never smaller than ~60% of the screen
            const galaxyDiameter = containerRadius * 2;
            const viewportMin = Math.min(dimensions.width, dimensions.height);

            // Target: scaledGalaxy >= viewportMin * 0.6
            // Scale >= (viewportMin * 0.6) / galaxyDiameter
            // Default containerRadius is approx 0.45 * minDim, so fitScale ~= 0.66
            const fitScale = (viewportMin * 0.6) / Math.max(1, galaxyDiameter);
            minScale = Math.max(0.4, fitScale); // Absolute floor to prevent microscopic view
            startScale = minScale;

            // Pan limits: Allow 50% padding around the viewport
            // Prevents losing the galaxy entirely
            // const panPadding = Math.min(dimensions.width, dimensions.height) * 0.8;
            // extent = [[-panPadding, -panPadding], [dimensions.width + panPadding, dimensions.height + panPadding]];

            // REVISION: Unlimited Pan for "Warp" Effect
            // To zoom into a specific node that might be anywhere, we need to allow panning.
            // We'll trust the user/code not to lose the galaxy.
            extent = [[-Infinity, -Infinity], [Infinity, Infinity]];

        } else {
            // CLUSTER MODE: Strict "Infinite Canvas" Lock

            // CALCULATED ZOOM (Iteration 27):
            // Instead of guessing with "boosts", we calculate exactly how much space the bubbles take up.
            // 1. Calculate total area of all bubbles (Visual Mass)
            // Fix: Use nodesRef.current because it contains the SimulationNodes with 'radius'.
            const totalArea = nodesRef.current.reduce((acc, node) => acc + (Math.PI * node.radius * node.radius), 0);

            // 2. Estimate the side length of a square needed to hold this mass
            // We use a tight packing (1.0) to ensure we focus on the core content.
            const contentSide = Math.sqrt(totalArea) * 1.0;

            // 3. Calculate Scale needed to fit this SQUARE into the Viewport
            // We use the smaller dimension (minDim) to ensure we don't crop if the aspect ratios differ.
            const minDim = Math.min(dimensions.width, dimensions.height);
            const fillScale = minDim / contentSide;

            // 4. Set Start Scale
            // "Stronger by a little bit": We boost the mathematically perfect fit by 10%.
            startScale = fillScale * 1.1;

            // REVISION: Ensure we don't zoom in SO close that we lose context.
            // Cap max initial zoom to avoid pixelation if few items.
            startScale = Math.min(startScale, 4.0);

            // Min Zoom = 0.9x of the "Fill" level (10% margin out).
            // User Request: "Max zoom out... with a tiny bit extra."
            // This allows seeing the whole cluster with a tight frame, but prevents shrinking it to a dot.
            minScale = isFinite(fillScale) && fillScale > 0 ? fillScale * 0.9 : 1;

            // Constraint: Can only pan within the virtual bounds.
            // REVISION: Add 50% Padding to the bounds so the user isn't hard-locked to the edges.
            const paddingX = simulationBounds.width * 0.5;
            const paddingY = simulationBounds.height * 0.5;

            extent = [
                [cx - simulationBounds.width / 2 - paddingX, cy - simulationBounds.height / 2 - paddingY],
                [cx + simulationBounds.width / 2 + paddingX, cy + simulationBounds.height / 2 + paddingY]
            ];
        }

        const zoom = d3.zoom()
            .scaleExtent([minScale, 8])
            .translateExtent(extent)
            .on("zoom", (event) => {
                transformRef.current = event.transform;
            });

        const selection = d3.select(canvas);
        selection.call(zoom as any);

        // --- EXPOSE ACTIONS ---
        // We do this inside the Effect because 'zoom' and 'selection' are created here.
        // But we need to update the ref. A common pattern is to use a mutable ref for the API.
        // However, standard useImperativeHandle runs outside this closure.
        // Alternative: Assign to a ref that useImperativeHandle reads, or put this logic in a robust useEffect.
        // But simpler: just define the function here and assign it to a ref we can call from useImperativeHandle.

        // We'll use a unique ID for the "current zoom instance" to avoid stale closures if possible,
        // but since this Effect completely recreates the zoom on deps change, it's safer to just
        // store the "zoomTo" function in a ref.

        // Let's store the SELECTION in a ref, since we already have it.
        // We also need the ZOOM behavior object.
        zoomBehaviorRef.current = zoom;
        selectionRef.current = selection as any;


        // --- STATE SYNC & AUTO-ZOOM ---
        // Handle "Entry Transition" (Genie Effect Part 2: Zoom Out Reveal)
        if (enableEntryTransition && mode === 'CLUSTER' && prevMode.current !== 'CLUSTER') {
            // Start "Inside" the bubble (Zoomed In)
            const zoomedInScale = startScale * 1.5; // Start 1.5x closer (Subtle reveal)
            const initialTransform = d3.zoomIdentity
                .translate(cx, cy)
                .scale(zoomedInScale)
                .translate(-cx, -cy);

            // Apply immediately
            selection.call(zoom.transform as any, initialTransform);
            transformRef.current = initialTransform;

            // Animate out to "Fit"
            const targetTransform = d3.zoomIdentity
                .translate(cx, cy)
                .scale(startScale)
                .translate(-cx, -cy);

            selection.transition()
                .duration(1200) // Slow, smooth reveal
                .ease(d3.easeCubicOut)
                .call(zoom.transform as any, targetTransform);
        }
        else if (mode !== prevMode.current) {
            if (prevMode.current === 'GLOBAL' && mode === 'CLUSTER') {
                // Entering Cluster: Save Global, Auto-Zoom to Fill
                savedGlobalTransform.current = transformRef.current;

                // Animate to the fill view (Scale around Center)
                // translate(cx, cy).scale(s).translate(-cx, -cy)
                // BUG FIX: Use startScale (boosted) for the initial view, not minScale (unboosted floor).
                const initialTransform = d3.zoomIdentity
                    .translate(cx, cy)
                    .scale(Math.max(minScale, startScale)) // Ensure we don't go below min (redundant but safe)
                    .translate(-cx, -cy);

                selection.call(zoom.transform as any, initialTransform);
                transformRef.current = initialTransform;

            } else if (prevMode.current === 'CLUSTER' && mode === 'GLOBAL') {
                // Exiting Cluster: Restore Global
                // We also need to update the zoom behavior (re-bind) which happens automatically on render
                // But we must manually restore the transform
                selection.call(zoom.transform as any, savedGlobalTransform.current);
                transformRef.current = savedGlobalTransform.current;
            }
            prevMode.current = mode;
        }




        const getHoveredNode = (e: MouseEvent): SimulationNode | null => {
            const rect = canvas.getBoundingClientRect();
            const { k, x, y } = transformRef.current;
            const mx = (e.clientX - rect.left - x) / k;
            const my = (e.clientY - rect.top - y) / k;

            for (const node of nodesRef.current) {
                const dx = mx - node.x!;
                const dy = my - node.y!;
                if (dx * dx + dy * dy < node.radius * node.radius) {
                    return node;
                }
            }
            return null;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const hovered = getHoveredNode(e);
            hoveredNode = hovered;

            if (hovered) {
                canvas.style.cursor = 'pointer';
            } else {
                canvas.style.cursor = 'default';
            }
        };

        const handleClick = (e: MouseEvent) => {
            const clicked = getHoveredNode(e);
            if (clicked) {
                onNodeClick?.(clicked.data);
            } else {
                onBackgroundClick?.();
            }
        };

        const render = () => {
            if (!context) return;
            const width = canvas.width;
            const height = canvas.height;
            const { k, x, y } = transformRef.current;
            const simNodes = nodesRef.current;
            // Use logical dimensions for center calculation since we scale the context
            const center = { x: dimensions.width / 2, y: dimensions.height / 2 };

            // Clear
            context.clearRect(0, 0, width, height);

            context.save();
            // Handle High DPI
            const dpr = dimensions.dpr || 1;
            context.scale(dpr, dpr);

            context.translate(x, y);
            context.scale(k, k);

            // 1. Draw Pillars (Background Ring)
            if (mode === 'GLOBAL') {
                const ringRadius = containerRadius || Math.min(dimensions.width, dimensions.height) * 0.45;

                // Conic Gradient
                const gradient = context.createConicGradient(0, center.x, center.y);
                const stops = PILLARS.map(p => {
                    const c = PILLAR_COORDINATES[p];
                    let angle = Math.atan2(c.y, c.x);
                    if (angle < 0) angle += Math.PI * 2;
                    return { angle, color: c.color };
                }).sort((a, b) => a.angle - b.angle);

                stops.forEach(stop => {
                    gradient.addColorStop(stop.angle / (Math.PI * 2), stop.color);
                });
                gradient.addColorStop(1, stops[0].color);

                context.beginPath();
                context.strokeStyle = gradient;
                context.lineWidth = 2 / k;
                context.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
                context.stroke();

                PILLARS.forEach(pillar => {
                    const coords = PILLAR_COORDINATES[pillar];
                    let angle = Math.atan2(coords.y, coords.x);
                    const text = pillar.toUpperCase();
                    const radius = ringRadius + 24;

                    context.font = `bold 14px "Geist Sans", sans-serif`;
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.fillStyle = coords.color;
                    context.globalAlpha = 0.8;

                    const totalWidth = context.measureText(text).width;
                    const totalAngle = totalWidth / radius;
                    const isFlipped = coords.y > 0;

                    context.save();
                    const startOffset = isFlipped ? (totalAngle / 2) : (-totalAngle / 2);
                    let currentAngleOffset = startOffset;

                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        const charWidth = context.measureText(char).width;
                        const charAlpha = charWidth / radius;
                        let charAngle = isFlipped ?
                            currentAngleOffset - (charAlpha / 2) :
                            currentAngleOffset + (charAlpha / 2);

                        context.save();
                        context.translate(center.x, center.y);
                        context.rotate(angle + charAngle);
                        context.translate(radius, 0);
                        if (isFlipped) context.rotate(-Math.PI / 2);
                        else context.rotate(Math.PI / 2);

                        context.fillText(char, 0, 0);
                        context.restore();

                        if (isFlipped) currentAngleOffset -= charAlpha;
                        else currentAngleOffset += charAlpha;
                    }
                    context.restore();

                    // Dot
                    const px = center.x + coords.x * ringRadius;
                    const py = center.y + coords.y * ringRadius;
                    context.beginPath();
                    context.arc(px, py, 4 / k, 0, Math.PI * 2);
                    context.fillStyle = coords.color;
                    context.globalAlpha = 0.5;
                    context.fill();
                    context.globalAlpha = 1;
                });
            }

            // 2. Draw Nodes
            simNodes.sort((a, b) => b.radius - a.radius);

            const drawNode = (node: SimulationNode, isHovered: boolean) => {
                // 1. Animate Physics Radius (Entry/Exit)
                const diff = node.radius - node.currentRadius;
                if (Math.abs(diff) > 0.1) node.currentRadius += diff * 0.1;
                else node.currentRadius = node.radius;

                // 2. Animate Hover Scale (The "Raising" Effect)
                const targetScale = isHovered ? 1.5 : 1.0;
                // Init if missing (handle undefined)
                if (typeof node.currentScale === 'undefined') node.currentScale = 1.0;

                // Interpolate
                const scaleDiff = targetScale - node.currentScale;
                if (Math.abs(scaleDiff) > 0.01) node.currentScale += scaleDiff * 0.3; // Snappy speed
                else node.currentScale = targetScale;

                const drawRadius = node.currentRadius * node.currentScale;

                // 3. Calculate "Lift" for Shadow
                // As scale goes 1.0 -> 1.5, lift goes 0 -> 1
                const lift = (node.currentScale - 1.0) * 2.0;
                const shadowBlur = 4 + (lift * 25);
                const shadowOffsetY = lift * 12;

                context.beginPath();
                context.arc(node.x!, node.y!, drawRadius, 0, Math.PI * 2);
                context.fillStyle = node.color;

                context.globalAlpha = isHovered ? 1 : 0.8;

                // Shadow
                context.shadowColor = "black";
                context.shadowBlur = shadowBlur;
                context.shadowOffsetY = shadowOffsetY;

                context.fill();

                // 3D "Dome" Highlight (Radial Gradient)
                // Simulates a light source above the center
                if (isHovered || node.currentScale > 1.1) {
                    const gradient = context.createRadialGradient(
                        node.x!, node.y!, 0,
                        node.x!, node.y!, drawRadius
                    );
                    gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)"); // Subtle highlight
                    gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.05)");
                    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

                    context.fillStyle = gradient;
                    context.shadowColor = "transparent";
                    context.shadowOffsetY = 0;
                    context.fill();
                }

                // Reset Shadow for Stroke/Text
                context.shadowColor = "transparent";
                context.shadowBlur = 0;
                context.shadowOffsetY = 0;

                // Border: Glowy White Shadow
                context.save();
                context.shadowColor = "rgba(255, 255, 255, 0.6)";
                context.shadowBlur = isHovered ? 15 : 5;
                context.strokeStyle = "rgba(255, 255, 255, 0.1)";
                context.lineWidth = (isHovered ? 2 : 1) / k;
                context.stroke();
                context.restore();

                context.globalAlpha = 1;

                // Labels
                // Render if large enough OR if trying to lift
                const visualSize = node.radius * k; // Check unscaled size for layout stability

                // Lower threshold to 6px for smoother fade-in
                if (visualSize > 6 || node.currentScale > 1.1) {

                    // --- STABLE LAYOUT CALCULATION ---
                    const stableRadius = node.radius;
                    let baseFontSize = Math.max(1, Math.min(stableRadius * 0.4, 100)); // Start with max desired size

                    // Check width constraint for longest word
                    const words = node.name.split(' ');
                    let longestWord = "";
                    words.forEach(w => {
                        if (w.length > longestWord.length) longestWord = w;
                    });

                    // Dynamic weight based on size
                    const getFont = (size: number) => {
                        const weight = size < 10 ? 'normal' : 'bold';
                        return `${weight} ${size}px sans-serif`;
                    };

                    if (longestWord) {
                        context.font = getFont(baseFontSize);
                        const widthAtMax = context.measureText(longestWord).width;
                        const targetMaxWidth = stableRadius * 1.5; // Leave some padding (1.5x radius)

                        if (widthAtMax > targetMaxWidth) {
                            const ratio = targetMaxWidth / widthAtMax;
                            baseFontSize = Math.max(1, baseFontSize * ratio);
                        }
                    }

                    const stableMaxWidth = stableRadius * 1.8; // Wrapping limit

                    context.font = getFont(baseFontSize);

                    const lines: string[] = [];
                    let currentLine = words[0];

                    for (let i = 1; i < words.length; i++) {
                        const word = words[i];
                        const width = context.measureText(currentLine + " " + word).width;
                        if (width < stableMaxWidth) {
                            currentLine += " " + word;
                        } else {
                            lines.push(currentLine);
                            currentLine = word;
                        }
                    }
                    lines.push(currentLine);

                    // --- DRAWING ---
                    context.save();
                    context.translate(node.x!, node.y!); // Move to center

                    // Calc Opacity based on size
                    // Range: 6px (invisible) -> 20px (full visibility)
                    let textAlpha = 1;

                    if (!isHovered && visualSize < 20) {
                        const t = Math.max(0, (visualSize - 6) / (20 - 6)); // 0 to 1
                        textAlpha = t;
                    }

                    context.globalAlpha = textAlpha;

                    // Scale the font size
                    const drawFontSize = baseFontSize * node.currentScale;
                    // Dynamic weight based on DRAGGED/SCALED size
                    const drawWeight = drawFontSize < 12 ? 'normal' : 'bold';
                    context.font = `${drawWeight} ${drawFontSize}px sans-serif`;
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.fillStyle = "white";

                    // Soft shadow for text readibility
                    context.shadowColor = "rgba(0, 0, 0, 0.5)";
                    context.shadowBlur = 4;

                    // Dynamic Line Height ("Stretch" Effect)
                    const spacingFactor = 1.1 + (node.currentScale - 1.0) * 0.4;
                    const lineHeight = drawFontSize * spacingFactor;

                    // Draw centered at (0,0) (since we translated)
                    let totalHeight = lines.length * lineHeight;
                    let startY = 0 - (totalHeight / 2) + (lineHeight / 2);

                    lines.forEach((line, i) => {
                        // SPHERICAL DISTORTION
                        const lineYFromCenter = startY + (i * lineHeight);
                        const relativeY = Math.min(1, Math.abs(lineYFromCenter) / (drawRadius * 0.9)); // Ensure bound <= 1

                        // Sphere Curve: 
                        // Power 4 curve creates a very flat top (center) and sharp drop to 0 at edges.
                        // At relativeY = 1.0 (edge), cos is 0, curve is 0.
                        const rawCurve = Math.cos(relativeY * (Math.PI / 2));
                        const sphereCurve = Math.pow(rawCurve, 4);

                        // Apply stretch based on curve
                        // If sphereCurve is 0 (at edges), localStretch is 1.0 (NO stretch).
                        const scale = node.currentScale || 1.0;
                        const animationLift = (scale - 1.0); // 0.0 to 0.5
                        const localStretch = 1.0 + (animationLift * 0.5 * sphereCurve); // Max stretch 1.25x at center (was 0.8 / 1.4x)

                        context.save();
                        context.translate(0, lineYFromCenter);
                        context.scale(1, localStretch);
                        context.fillText(line, 0, 0); // Draw at local 0, which is the line center
                        context.restore();
                    });

                    context.restore();
                }
            };

            // Draw Non-Hovered First
            simNodes.forEach(node => {
                if (node !== hoveredNode) {
                    drawNode(node, false);
                }
            });

            // Draw Hovered Last
            if (hoveredNode) {
                drawNode(hoveredNode, true);
            }

            context.restore();
        };

        // LOOP
        let animationFrameId: number;
        const tick = () => {
            render();
            animationFrameId = requestAnimationFrame(tick);
        };
        tick();

        // Apply Zoom and Sync State
        // Remove old listeners
        // Re-apply zoom if bounds changed

        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);

        return () => {
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('mousemove', handleMouseMove);
            simulationRef.current?.on('tick', null);
            cancelAnimationFrame(animationFrameId);
            selection.on(".zoom", null); // Clean up zoom
        };
    }, [dimensions, mode, containerRadius, simulationBounds]);

    return (
        <div ref={containerRef} className="w-full h-full relative bg-zinc-950 overflow-hidden">
            <canvas
                ref={canvasRef}
                width={dimensions.width * (dimensions.dpr || 1)}
                height={dimensions.height * (dimensions.dpr || 1)}
                style={{ width: dimensions.width, height: dimensions.height }}
                className="block cursor-move"
            />

            {/* Overlay UI (optional) */}
            <div className="absolute top-4 right-4 pointer-events-none md:hidden">
                <div className="text-xs text-zinc-500 font-mono">
                    {mode === 'GLOBAL' ? 'Cluster View' : 'Cluster View'}
                </div>
            </div>
        </div>
    );
});

export default MusicCanvas;
