"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { SongNode } from "@/types";

interface GenreMapProps {
    data: SongNode[];
}

export default function GenreMap({ data }: GenreMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredNode, setHoveredNode] = useState<SongNode | null>(null);

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current || !data.length) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // Setup Canvas
        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Simulation Setup
        // Group nodes by primary genre (first one in list) for clustering
        const nodes = data.map(d => ({ ...d })); // Clone to avoid mutation issues in strict mode

        // Create a color scale for genres
        const uniqueGenres = Array.from(new Set(nodes.map(d => d.genres[0] || "Unknown")));
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueGenres);

        const simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(-5)) // Repel
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(5)) // Avoid overlap
            .on("tick", ticked);

        function ticked() {
            if (!context) return;
            context.clearRect(0, 0, width, height);
            context.save();

            // Draw Nodes
            nodes.forEach(node => {
                context.beginPath();
                context.arc(node.x!, node.y!, 3, 0, 2 * Math.PI);
                context.fillStyle = colorScale(node.genres[0] || "Unknown");
                context.fill();
            });

            context.restore();
        }

        // Interaction Handling (Basic Hover)
        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Find node near mouse
            const node = simulation.find(mouseX, mouseY, 10); // 10px radius

            if (node) {
                setHoveredNode(node as SongNode);
                canvas.style.cursor = "pointer";
            } else {
                setHoveredNode(null);
                canvas.style.cursor = "default";
            }
        };

        canvas.addEventListener("mousemove", handleMouseMove);

        return () => {
            simulation.stop();
            canvas.removeEventListener("mousemove", handleMouseMove);
        };
    }, [data]);

    return (
        <div ref={containerRef} className="w-full h-full relative group">
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* Tooltip Overlay */}
            {hoveredNode && (
                <div
                    className="absolute pointer-events-none bg-zinc-900/90 border border-zinc-700 p-4 rounded-lg shadow-xl backdrop-blur-sm z-50 transition-all duration-200"
                    style={{
                        left: hoveredNode.x! + 10,
                        top: hoveredNode.y! + 10,
                        maxWidth: '300px'
                    }}
                >
                    <div className="flex gap-4">
                        {hoveredNode.image && (
                            <img src={hoveredNode.image} alt={hoveredNode.album} className="w-16 h-16 rounded object-cover" />
                        )}
                        <div>
                            <h3 className="text-white font-bold leading-tight">{hoveredNode.name}</h3>
                            <p className="text-gray-400 text-sm mt-1">{hoveredNode.artist}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {hoveredNode.genres.slice(0, 3).map(g => (
                                    <span key={g} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-zinc-300 border border-white/5">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
