"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { SongNode } from "@/types";

interface TimelineMapProps {
    data: SongNode[];
    mode: "release" | "added"; // Release Date vs Added Date
}

export default function TimelineMap({ data, mode }: TimelineMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredNode, setHoveredNode] = useState<SongNode | null>(null);

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current || !data.length) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const canvas = canvasRef.current;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Data Preparation
        const nodes = data.map(d => ({ ...d }));

        // Time Scale
        const getDate = (d: SongNode) => mode === "release" ? new Date(d.releaseDate) : new Date(d.addedAt);
        const domain = d3.extent(nodes, getDate) as [Date, Date];
        const timeScale = d3.scaleTime()
            .domain(domain)
            .range([50, width - 50]);

        // Color Scale
        const uniqueGenres = Array.from(new Set(nodes.map(d => d.genres[0] || "Unknown")));
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(uniqueGenres);

        // Simulation
        // We want X to be fixed to time, Y to be clustered or random but avoiding collision
        const simulation = d3.forceSimulation<SongNode>(nodes)
            .force("x", d3.forceX(d => timeScale(getDate(d))).strength(0.8))
            .force("y", d3.forceY(height / 2).strength(0.1))
            .force("collide", d3.forceCollide(4))
            .on("tick", ticked);

        function ticked() {
            if (!context) return;
            context.clearRect(0, 0, width, height);

            // Draw Axis
            context.beginPath();
            context.strokeStyle = "#333";
            context.moveTo(50, height / 2);
            context.lineTo(width - 50, height / 2);
            context.stroke();

            // Draw Nodes
            nodes.forEach(node => {
                context.beginPath();
                context.arc(node.x!, node.y!, 3, 0, 2 * Math.PI);
                context.fillStyle = colorScale(node.genres[0] || "Unknown");
                context.fill();
            });

            // Draw Years/Dates
            const ticks = timeScale.ticks(5);
            context.fillStyle = "#666";
            context.textAlign = "center";
            context.font = "12px sans-serif";
            ticks.forEach(date => {
                const x = timeScale(date);
                context.fillText(d3.timeFormat("%Y")(date), x, height - 20);
            });
        }

        // Interaction (Same as GenreMap - Refactor to shared hook later if needed)
        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            const node = simulation.find(mouseX, mouseY, 10);

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
    }, [data, mode]);

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <canvas ref={canvasRef} className="block w-full h-full" />
            {/* Tooltip - Duplicate of GenreMap tooltip for now, cleaner to extract later */}
            {hoveredNode && (
                <div
                    className="absolute pointer-events-none bg-zinc-900/90 border border-zinc-700 p-4 rounded-lg shadow-xl backdrop-blur-sm z-50"
                    style={{
                        left: hoveredNode.x! + 10,
                        top: hoveredNode.y! + 10,
                        maxWidth: '300px'
                    }}
                >
                    <div>
                        <h3 className="text-white font-bold">{hoveredNode.name}</h3>
                        <p className="text-gray-400 text-sm">{hoveredNode.artist}</p>
                        <p className="text-gray-500 text-xs mt-1">
                            {mode === "release"
                                ? `Released: ${hoveredNode.releaseDate}`
                                : `Added: ${new Date(hoveredNode.addedAt).toLocaleDateString()}`
                            }
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
