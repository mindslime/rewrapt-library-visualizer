"use client";

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useMusicSimulation, SimulationNode } from '@/hooks/useMusicSimulation';
import { GenreNode } from '@/types/spotify';
import { PILLARS, PILLAR_COORDINATES } from '@/utils/spotifyTransform';

interface MusicCanvasProps {
    nodes: GenreNode[];
    onNodeClick?: (node: GenreNode) => void;
    onBackgroundClick?: () => void;
    mode?: 'GLOBAL' | 'CLUSTER';
}

export default function MusicCanvas({ nodes, onNodeClick, onBackgroundClick, mode = 'GLOBAL' }: MusicCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Zoom State
    const transformRef = useRef(d3.zoomIdentity); // { k, x, y }

    // Init Simulation
    const { simulationRef, nodesRef, containerRadius } = useMusicSimulation({
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
                    height: containerRef.current.clientHeight
                });
            }
        };

        const resizeObserver = new ResizeObserver(() => updateSize());
        resizeObserver.observe(containerRef.current);
        updateSize();

        return () => resizeObserver.disconnect();
    }, []);

    // Render Loop
    useEffect(() => {
        if (!canvasRef.current || !simulationRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const render = () => {
            if (!context) return;
            const width = canvas.width;
            const height = canvas.height;
            const { k, x, y } = transformRef.current;
            const simNodes = nodesRef.current;
            const center = { x: width / 2, y: height / 2 };

            // Clear
            context.clearRect(0, 0, width, height);

            // --- TRANSFORM START ---
            context.save();
            context.translate(x, y);
            context.scale(k, k);

            // 1. Draw Pillars (Background Ring)
            if (mode === 'GLOBAL') {
                // Use the dynamic radius from simulation, or fallback
                const ringRadius = containerRadius || Math.min(dimensions.width, dimensions.height) * 0.45;

                // Create Conic Gradient for Border
                // Rotate by -90deg (-PI/2) so 0 is at top? No, standard is 0 at 3 o'clock.
                // Our pillars: Pop is (0, -1) -> -PI/2 (top). 
                // Let's align gradient start to match.
                const gradient = context.createConicGradient(0, center.x, center.y); // Start at 0 (3 o'clock standard)

                // We need sorted stops 0-1.
                // Compute angles for each pillar.
                const stops = PILLARS.map(p => {
                    const c = PILLAR_COORDINATES[p];
                    // atan2(y, x): y grows down? Yes in canvas.
                    // Pop: (0, -1) -> atan2(-1, 0) = -PI/2.
                    // normalize to 0-1 range (0 to 2PI)
                    let angle = Math.atan2(c.y, c.x);
                    if (angle < 0) angle += Math.PI * 2;
                    return { angle, color: c.color };
                }).sort((a, b) => a.angle - b.angle);

                stops.forEach(stop => {
                    gradient.addColorStop(stop.angle / (Math.PI * 2), stop.color);
                });
                // Close the loop
                gradient.addColorStop(1, stops[0].color);

                context.beginPath();
                context.strokeStyle = gradient;
                context.lineWidth = 2 / k; // Slightly thicker
                context.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
                context.stroke();

                PILLARS.forEach(pillar => {
                    const coords = PILLAR_COORDINATES[pillar];
                    // Calculate angle for radial positioning (center of the word)
                    let angle = Math.atan2(coords.y, coords.x);

                    const text = pillar.toUpperCase();
                    // Distance from center for the TEXT BASELINE
                    const radius = ringRadius + 24;

                    context.font = `bold 14px "Geist Sans", sans-serif`;
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.fillStyle = coords.color;
                    context.globalAlpha = 0.8;

                    // Measure width to center alignment
                    const totalWidth = context.measureText(text).width;
                    const totalAngle = totalWidth / radius;

                    // Flip check: If y > 0 (Bottom Half), we flip 180 and reverse curve direction
                    const isFlipped = coords.y > 0;

                    context.save();

                    // Loop through chars
                    // If flipped (Bottom): Letters go visually L->R but Angle DECREASES (CW).
                    // So start at Positive Offset (Left) and go Negative (Right).
                    const startOffset = isFlipped ? (totalAngle / 2) : (-totalAngle / 2);
                    let currentAngleOffset = startOffset;

                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        const charWidth = context.measureText(char).width;
                        const charAlpha = charWidth / radius;

                        let charAngle;
                        if (isFlipped) {
                            // Go Backwards: Current - HalfWidth
                            charAngle = currentAngleOffset - (charAlpha / 2);
                        } else {
                            // Go Forwards: Current + HalfWidth
                            charAngle = currentAngleOffset + (charAlpha / 2);
                        }

                        context.save();

                        // 1. Rotate to position
                        context.translate(center.x, center.y);
                        context.rotate(angle + charAngle);

                        // 2. Move out
                        context.translate(radius, 0);

                        // 3. Tangent Rotate
                        if (isFlipped) {
                            // Smiling curve: Letter Top points Inward (towards Center)
                            context.rotate(-Math.PI / 2);
                        } else {
                            // Frowning curve: Letter Top points Outward
                            context.rotate(Math.PI / 2);
                        }

                        context.fillText(char, 0, 0);
                        context.restore();

                        // Advance
                        if (isFlipped) {
                            currentAngleOffset -= charAlpha;
                        } else {
                            currentAngleOffset += charAlpha;
                        }
                    }

                    context.restore();

                    // Draw the Dot separately (at the ring edge, not text pos)
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

            simNodes.forEach(node => {
                // Animate Radius
                const diff = node.radius - node.currentRadius;
                if (Math.abs(diff) > 0.1) node.currentRadius += diff * 0.1;
                else node.currentRadius = node.radius;

                context.beginPath();
                context.arc(node.x!, node.y!, node.currentRadius, 0, Math.PI * 2);
                context.fillStyle = node.color;

                context.globalAlpha = 0.8;
                context.fill();

                context.strokeStyle = "rgba(255, 255, 255, 0.5)";
                context.lineWidth = 1 / k;
                context.stroke();

                context.globalAlpha = 1;

                // Labels
                // Only render if large enough
                const visualSize = node.currentRadius * k;
                if (visualSize > 15) {
                    const fontSize = Math.max(4, Math.min(node.currentRadius * 0.4, 100));
                    context.font = `bold ${fontSize}px sans-serif`;
                    context.textAlign = "center";
                    context.textBaseline = "middle";

                    // Multi-line Word Wrap
                    const maxWidth = node.currentRadius * 1.8; // 90% of diameter
                    const words = node.name.split(' ');
                    const lines: string[] = [];
                    let currentLine = words[0];

                    for (let i = 1; i < words.length; i++) {
                        const word = words[i];
                        const width = context.measureText(currentLine + " " + word).width;
                        if (width < maxWidth) {
                            currentLine += " " + word;
                        } else {
                            lines.push(currentLine);
                            currentLine = word;
                        }
                    }
                    lines.push(currentLine);

                    context.fillStyle = "white";
                    context.shadowColor = "black";
                    context.shadowBlur = 4;

                    // Render lines centered
                    const lineHeight = fontSize * 1.1;
                    const totalHeight = lines.length * lineHeight;
                    let startY = node.y! - (totalHeight / 2) + (lineHeight / 2);

                    lines.forEach((line, i) => {
                        context.fillText(line, node.x!, startY + (i * lineHeight));
                    });

                    context.shadowBlur = 0;
                }
            });

            context.restore();
        };

        // LOOP
        let animationFrameId: number;
        const tick = () => {
            render();
            animationFrameId = requestAnimationFrame(tick);
        };
        tick();

        // Zoom Listener
        const zoom = d3.zoom()
            .scaleExtent([0.1, 12]) // Increased max zoom
            .on("zoom", (event) => {
                transformRef.current = event.transform;
                // Render handled by rAF loop
            });

        d3.select(canvas).call(zoom as any);

        // Click Handler (Raycasting)
        const handleClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const { k, x, y } = transformRef.current;
            const mx = (e.clientX - rect.left - x) / k;
            const my = (e.clientY - rect.top - y) / k;

            // Find top node
            let clicked: SimulationNode | null = null;
            // Search front-to-back (Smallest (top) to Largest (bottom) if we sorted that way?)
            // We rendered Big -> Small? No, standard array order.
            // If they don't overlap, simple search.
            for (const node of nodesRef.current) {
                const dx = mx - node.x!;
                const dy = my - node.y!;
                if (dx * dx + dy * dy < node.radius * node.radius) {
                    clicked = node;
                    break; // Found one
                }
            }

            if (clicked) {
                onNodeClick?.(clicked.data);
            } else {
                onBackgroundClick?.();
            }
        };

        canvas.addEventListener('click', handleClick);

        return () => {
            canvas.removeEventListener('click', handleClick);
            simulationRef.current?.on('tick', null);
            cancelAnimationFrame(animationFrameId);
        };
    }, [dimensions, mode]); // Re-bind on dim/mode change

    return (
        <div ref={containerRef} className="w-full h-full relative bg-zinc-950 overflow-hidden">
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                className="block cursor-move"
            />

            {/* Overlay UI (optional) */}
            <div className="absolute top-4 right-4 pointer-events-none">
                <div className="text-xs text-zinc-500 font-mono">
                    {mode === 'GLOBAL' ? 'Global View' : 'Cluster View'}
                </div>
            </div>
        </div>
    );
}
