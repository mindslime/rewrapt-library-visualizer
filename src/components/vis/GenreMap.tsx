"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { GenreNode } from "@/types/spotify";

interface GenreMapProps {
    data: GenreNode[];
    contextType?: 'library' | 'playlist';
}

export default function GenreMap({ data, contextType = 'library' }: GenreMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredNode, setHoveredNode] = useState<GenreNode | null>(null);
    const [activeData, setActiveData] = useState<GenreNode[]>(data);
    const [viewStack, setViewStack] = useState<string[]>([]); // Track "breadcrumbs"
    const [selectedArtistNode, setSelectedArtistNode] = useState<GenreNode | null>(null); // For popup

    // Reset activeData when prop data changes (new analysis)
    useEffect(() => {
        setActiveData(data);
        setViewStack([]);
        setSelectedArtistNode(null);
    }, [data]);

    // Store transform in ref to access it inside the simulation loop without re-renders
    const transformRef = useRef(d3.zoomIdentity);
    const simulationRef = useRef<d3.Simulation<GenreNode, undefined> | null>(null);

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current || !activeData.length) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const aspectRatio = width / height;

        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Reset transform 
        // We only reset transform if we are at the top level to keep context? 
        // Actually for a fresh simulation of new data, reset is safer.
        transformRef.current = d3.zoomIdentity;

        // Clone data for simulation with random positions
        const nodes: GenreNode[] = activeData.map(d => ({
            ...d,
            x: Math.random() * width,
            y: Math.random() * height
        }));
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Responsive Forces
        const forceXStrength = aspectRatio > 1 ? 0.05 : 0.1;
        const forceYStrength = aspectRatio > 1 ? 0.1 : 0.05;

        // Simulation
        const simulation = d3.forceSimulation(nodes)
            .alphaTarget(0.01)
            .velocityDecay(0.15)
            .force("charge", d3.forceManyBody().strength(-20))
            .force("x", d3.forceX(width / 2).strength(forceXStrength))
            .force("y", d3.forceY(height / 2).strength(forceYStrength))
            .force("collide", d3.forceCollide()
                .radius((d: any) => Math.sqrt(d.count) * 10 + 4)
                .strength(0.8)
                .iterations(2)
            );

        // Pre-warm
        simulation.tick(300);

        simulation.on("tick", ticked);
        simulationRef.current = simulation;

        // Zoom Behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                transformRef.current = event.transform;
                ticked();
            });

        d3.select(canvas).call(zoom as any);

        // Auto Zoom to Fit
        setTimeout(() => {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            nodes.forEach(node => {
                const r = Math.sqrt(node.count) * 10 + 4;
                if ((node.x ?? 0) - r < minX) minX = (node.x ?? 0) - r;
                if ((node.y ?? 0) - r < minY) minY = (node.y ?? 0) - r;
                if ((node.x ?? 0) + r > maxX) maxX = (node.x ?? 0) + r;
                if ((node.y ?? 0) + r > maxY) maxY = (node.y ?? 0) + r;
            });

            const boundsWidth = maxX - minX;
            const boundsHeight = maxY - minY;
            const padding = 40;

            if (boundsWidth > 0 && boundsHeight > 0) {
                const scale = Math.min(
                    (width - padding * 2) / boundsWidth,
                    (height - padding * 2) / boundsHeight
                );
                const clampedScale = Math.min(Math.max(scale, 0.5), 2);
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                const t = d3.zoomIdentity
                    .translate(width / 2, height / 2)
                    .scale(clampedScale)
                    .translate(-centerX, -centerY);

                d3.select(canvas)
                    .transition().duration(750)
                    .call(zoom.transform as any, t);
            }
        }, 100); // Shorter delay since we pre-warmed

        function ticked() {
            if (!context) return;
            context.save();
            context.clearRect(0, 0, width, height);

            const { k, x, y } = transformRef.current;
            context.translate(x, y);
            context.scale(k, k);

            nodes.forEach(node => {
                const radius = Math.sqrt(node.count) * 10;

                // Draw Bubble
                context.beginPath();
                context.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
                context.fillStyle = colorScale(node.id);
                context.fill();
                context.strokeStyle = "rgba(255,255,255,0.4)";
                context.lineWidth = 2 / k;
                context.stroke();

                // Removed Glint/Reflection as requested

                // Draw Text
                if (radius * k > 15) {
                    context.fillStyle = "white";
                    // Smaller font size for artists (if depth > 0)
                    const isArtistLevel = viewStack.length > 0;
                    const fontSize = isArtistLevel ? 8 : 10;
                    context.font = `bold ${fontSize}px sans-serif`;
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.shadowColor = "black";
                    context.shadowBlur = 4;
                    // For artists, maybe handle truncation if super long?
                    // For now, full name per user request "show name"
                    context.fillText(node.name, node.x!, node.y!);
                    context.shadowBlur = 0;
                }
            });

            context.restore();
        }

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const { k, x, y } = transformRef.current;
            const mouseX = (event.clientX - rect.left - x) / k;
            const mouseY = (event.clientY - rect.top - y) / k;

            let found: GenreNode | null = null;
            for (let i = nodes.length - 1; i >= 0; i--) {
                const node = nodes[i];
                const dx = mouseX - node.x!;
                const dy = mouseY - node.y!;
                const r = Math.sqrt(node.count) * 10;
                if (dx * dx + dy * dy < r * r) {
                    found = node as GenreNode;
                    break;
                }
            }

            if (found) {
                setHoveredNode({
                    ...found,
                    x: found.x! * k + x,
                    y: found.y! * k + y
                });
                canvas.style.cursor = "pointer";
            } else {
                setHoveredNode(null);
                canvas.style.cursor = "default";
            }
        };

        const handleClick = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const { k, x, y } = transformRef.current;
            const mouseX = (event.clientX - rect.left - x) / k;
            const mouseY = (event.clientY - rect.top - y) / k;

            for (let i = nodes.length - 1; i >= 0; i--) {
                const node = nodes[i];
                const dx = mouseX - node.x!;
                const dy = mouseY - node.y!;
                const r = Math.sqrt(node.count) * 10;
                if (dx * dx + dy * dy < r * r) {
                    // Node Clicked -> Drill down if children exist
                    if (node.children && node.children.length > 0) {
                        setViewStack(prev => [...prev, node.name]);
                        setActiveData(node.children);
                        setHoveredNode(null); // Clear tooltip
                    } else {
                        // Leaf node (Artist) -> Open Popup
                        setSelectedArtistNode(node);
                    }
                    break;
                }
            }
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("click", handleClick);

        return () => {
            simulation.stop();
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("click", handleClick);
        };
    }, [activeData, viewStack.length]); // Re-run when activeData changes (drill down/up)

    const handleBack = () => {
        // Simple reset to top level for now, or pop stack if we had arbitrary depth
        // Since we only have 1 level of depth (Genre -> Artists), reset to props.data
        setActiveData(data);
        setViewStack([]);
        setSelectedArtistNode(null);
    };

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-move bg-zinc-950/50">
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* Genre Header Title */}
            {viewStack.length > 0 && (
                <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-30">
                    <h1 className="bg-zinc-950/50 backdrop-blur-md px-6 py-2 rounded-full text-2xl font-bold text-white shadow-2xl border border-zinc-700">
                        {viewStack[viewStack.length - 1]}
                    </h1>
                </div>
            )}

            {/* Back Button */}
            {viewStack.length > 0 && (
                <button
                    onClick={handleBack}
                    className="absolute top-4 left-4 bg-zinc-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-zinc-700 transition z-40 flex items-center gap-2 border border-zinc-600"
                >
                    <span>← Back to Genres</span>
                </button>
            )}

            {hoveredNode && !selectedArtistNode && (
                <div
                    className="absolute bg-zinc-900/90 text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none backdrop-blur-md border border-zinc-700 z-50 transform -translate-y-full -translate-x-1/2 -mt-2"
                    style={{
                        left: hoveredNode.x!,
                        top: hoveredNode.y!,
                    }}
                >
                    <div className="font-bold mb-1 border-b border-zinc-600 pb-1 text-base text-green-400">{hoveredNode.name}</div>
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-zinc-300">
                        <span>Tracks:</span> <span className="text-white text-right">{hoveredNode.count}</span>
                        {/* Only show artist count if we're at genre level (has children) */}
                        {hoveredNode.children && (
                            <>
                                <span>Artists:</span> <span className="text-white text-right">{hoveredNode.artistCount}</span>
                                <span>Albums:</span> <span className="text-white text-right">{hoveredNode.albumCount}</span>
                                <div className="col-span-2 text-xs text-zinc-500 italic mt-1 text-center">Click to zoom in</div>
                            </>
                        )}
                        {!hoveredNode.children && (
                            <div className="col-span-2 text-xs text-zinc-500 italic mt-1 text-center">Click for songs</div>
                        )}
                    </div>
                </div>
            )}

            {/* Artist Detail Popup (Modal) */}
            {selectedArtistNode && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedArtistNode(null)}>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="p-4 border-b border-zinc-700 flex justify-between items-center bg-zinc-800/50">
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedArtistNode.name}</h2>
                                <p className="text-sm text-zinc-400">{selectedArtistNode.count} tracks in selection</p>
                            </div>
                            <button
                                onClick={() => setSelectedArtistNode(null)}
                                className="text-zinc-400 hover:text-white transition p-2"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content (List) */}
                        <div className="overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
                            <table className="w-full text-left text-sm text-zinc-300">
                                <thead className="bg-zinc-950/50 sticky top-0 backdrop-blur-sm">
                                    <tr>
                                        <th className="p-3 font-semibold">Title</th>
                                        <th className="p-3 font-semibold">Album</th>
                                        <th className="p-3 font-semibold">Duration</th>
                                        <th className="p-3 font-semibold">Added</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {[...(selectedArtistNode.tracks || [])]
                                        .sort((a, b) => new Date(b.added_at || 0).getTime() - new Date(a.added_at || 0).getTime())
                                        .map((track) => (
                                            <tr key={track.id}
                                                className="hover:bg-zinc-800/50 transition cursor-pointer group"
                                                onClick={() => {
                                                    // Link Logic
                                                    // Library -> Open Album
                                                    // Playlist -> Open Track
                                                    const url = contextType === 'library'
                                                        ? track.album.uri // spotify:album:xxx
                                                        : track.uri;      // spotify:track:xxx
                                                    window.location.href = url;
                                                }}
                                            >
                                                <td className="p-3 group-hover:text-green-400 font-medium">
                                                    {track.name}
                                                    <div className="text-xs text-zinc-500 font-normal mt-0.5">OPEN IN SPOTIFY ↗</div>
                                                </td>
                                                <td className="p-3">{track.album.name}</td>
                                                <td className="p-3">{formatDuration(track.duration_ms)}</td>
                                                <td className="p-3">{track.added_at ? new Date(track.added_at).toLocaleDateString() : '-'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatDuration(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
}
