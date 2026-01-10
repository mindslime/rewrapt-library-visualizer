"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { SpotifyTrack, SpotifyArtist } from "@/types/spotify";
import { genreColors } from "@/utils/genreColors";

interface TimelineVisProps {
    tracks: SpotifyTrack[];
    artistMap: Map<string, SpotifyArtist>;
}

export default function TimelineVis({ tracks, artistMap }: TimelineVisProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number, y: number, content: any, date: string } | null>(null);

    useEffect(() => {
        if (!containerRef.current || !svgRef.current) return;

        console.log("TimelineVis: Starting render...");

        if (!tracks.length) {
            setStatus("No tracks available for timeline.");
            return;
        }

        // 1. Process Data: Buckets by Month
        const formatMonth = d3.timeFormat("%Y-%m");

        // Group tracks by month
        const tracksWithDate = tracks
            .filter(t => t.added_at)
            .map(t => {
                const date = new Date(t.added_at!);
                if (isNaN(date.getTime())) return null;
                return {
                    ...t,
                    date: date,
                    month: formatMonth(date)
                };
            })
            .filter((t): t is NonNullable<typeof t> => !!t)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (tracksWithDate.length === 0) {
            setStatus("No valid 'added_at' dates found in these tracks.");
            return;
        }

        // Identify Top Genres first (to limit noise)
        const genreGlobals = new Map<string, number>();
        tracksWithDate.forEach(t => {
            const artistId = t.artists[0]?.id;
            const fullArtist = artistMap.get(artistId);

            if (fullArtist && fullArtist.genres) {
                fullArtist.genres.forEach(g => {
                    genreGlobals.set(g, (genreGlobals.get(g) || 0) + 1);
                });
            }
        });

        const topGenres = Array.from(genreGlobals.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(d => d[0]);

        if (topGenres.length === 0) {
            setStatus("No genres found for the artists in these tracks.");
            return;
        }

        // Build Stack Data
        const dataByMonth = new Map<string, any>();

        tracksWithDate.forEach(t => {
            if (!dataByMonth.has(t.month)) {
                dataByMonth.set(t.month, {
                    month: d3.timeParse("%Y-%m")(t.month),
                    monthStr: t.month,
                    total: 0,
                    ...Object.fromEntries(topGenres.map(g => [g, 0]))
                });
            }

            const entry = dataByMonth.get(t.month);
            const artistId = t.artists[0]?.id;
            const fullArtist = artistMap.get(artistId);

            if (fullArtist && fullArtist.genres) {
                fullArtist.genres.forEach(g => {
                    if (topGenres.includes(g)) {
                        entry[g] += 1;
                        entry.total += 1;
                    }
                });
            }
        });

        const data = Array.from(dataByMonth.values()).sort((a, b) => a.month - b.month);

        if (data.length < 2) {
            setStatus("Not enough data points over time to draw a streamgraph (need at least 2 months).");
            return;
        }

        setStatus(null);

        // 2. Setup D3
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Clip Path for Zooming
        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width - margin.left - margin.right)
            .attr("height", height - margin.top - margin.bottom);

        const chartArea = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        const x = d3.scaleTime()
            .domain(d3.extent(data, (d: any) => d.month) as [Date, Date])
            .range([0, width - margin.left - margin.right]);

        const stack = d3.stack()
            .keys(topGenres)
            .offset(d3.stackOffsetSilhouette)
            .order(d3.stackOrderNone);

        const stackedData = stack(data);

        const maxY = d3.max(stackedData, layer => d3.max(layer, d => d[1])) || 0;
        const minY = d3.min(stackedData, layer => d3.min(layer, d => d[0])) || 0;

        const y = d3.scaleLinear()
            .domain([minY, maxY])
            .range([height - margin.bottom - margin.top, 0]);

        const color = (id: string) => {
            const key = id.toLowerCase();
            if (genreColors[key]) return genreColors[key];
            return d3.scaleOrdinal(d3.schemeSpectral[8] || d3.schemeTableau10)(id);
        };

        const area = d3.area()
            .curve(d3.curveBasis)
            .x((d: any) => x(d.data.month))
            .y0((d: any) => y(d[0]))
            .y1((d: any) => y(d[1]));

        // Draw Layers
        const layers = chartArea.append("g")
            .attr("class", "layers")
            .attr("clip-path", "url(#clip)");

        layers.selectAll("path")
            .data(stackedData)
            .join("path")
            .attr("fill", (d: any) => color(d.key) as string)
            .attr("d", area as any)
            .attr("opacity", 0.9);

        // Axes
        const xAxis = chartArea.append("g")
            .attr("transform", `translate(0,${height - margin.bottom - margin.top})`)
            .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

        // Legend
        const legend = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        topGenres.forEach((genre, i) => {
            const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
            row.append("rect").attr("width", 12).attr("height", 12).attr("rx", 2).attr("fill", color(genre) as string);
            row.append("text").attr("x", 20).attr("y", 10).text(genre).attr("fill", "white").style("font-size", "12px").style("text-transform", "capitalize");
        });

        // Interactive Scanner Line
        const scannerGroup = chartArea.append("g")
            .style("pointer-events", "none")
            .style("opacity", 0);

        scannerGroup.append("line")
            .attr("y1", 0)
            .attr("y2", height - margin.top - margin.bottom)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4 2");

        // Zoom Behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 10]) // Limit zoom
            .extent([[0, 0], [width, height]])
            .translateExtent([[0, 0], [width, height]])
            .on("zoom", (event) => {
                const newX = event.transform.rescaleX(x);

                // Update Area
                const newArea = d3.area()
                    .curve(d3.curveBasis)
                    .x((d: any) => newX(d.data.month))
                    .y0((d: any) => y(d[0]))
                    .y1((d: any) => y(d[1]));

                layers.selectAll("path").attr("d", newArea as any);

                // Update Axis
                xAxis.call(d3.axisBottom(newX).ticks(width / 80).tickSizeOuter(0));
            });

        // Overlay for events
        const overlay = svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent")
            .attr("cursor", "crosshair")
            .call(zoom as any)
            .on("mousemove", (event) => {
                const [mx] = d3.pointer(event);
                // Account for margins when calculating x-value
                const transform = d3.zoomTransform(overlay.node() as any);
                const newX = transform.rescaleX(x);

                const hoverDate = newX.invert(mx - margin.left);

                // Find nearest data point
                const bisect = d3.bisector((d: any) => d.month).center;
                const i = bisect(data, hoverDate);
                const d0 = data[i - 1];
                const d1 = data[i];
                let selected = d0;
                if (d0 && d1) {
                    selected = hoverDate.getTime() - d0.month.getTime() > d1.month.getTime() - hoverDate.getTime() ? d1 : d0;
                } else if (!d0) {
                    selected = d1;
                }

                if (selected) {
                    const px = newX(selected.month);

                    // Show Scanner
                    scannerGroup.style("opacity", 1)
                        .attr("transform", `translate(${px}, 0)`);

                    // Update Tooltip State
                    setTooltip({
                        x: px + margin.left,
                        y: event.offsetY, // simple y-follow
                        content: selected,
                        date: d3.timeFormat("%B %Y")(selected.month)
                    });
                }
            })
            .on("mouseleave", () => {
                scannerGroup.style("opacity", 0);
                setTooltip(null);
            });

    }, [tracks, artistMap]);

    return (
        <div ref={containerRef} className="w-full h-full animate-in fade-in duration-500 relative bg-zinc-950/50">
            <svg ref={svgRef} className="w-full h-full" />

            {status && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950/80 p-6 text-center pointer-events-none">
                    <p className="text-lg font-semibold mb-2">Notice</p>
                    <p>{status}</p>
                </div>
            )}

            {tooltip && (
                <div
                    className="absolute z-50 pointer-events-none bg-zinc-900/90 text-white text-xs p-3 rounded-lg shadow-xl backdrop-blur-md border border-zinc-700 w-48"
                    style={{ left: tooltip.x + 10, top: 40 }} // Fixed top, follows X
                >
                    <div className="font-bold text-base mb-2 text-green-400 border-b border-zinc-700 pb-1">{tooltip.date}</div>
                    <div className="space-y-1">
                        {Object.entries(tooltip.content)
                            .filter(([key]) => key !== 'month' && key !== 'monthStr' && key !== 'total')
                            .sort((a: any, b: any) => b[1] - a[1]) // sorting by count
                            .slice(0, 5) // Top 5
                            .map(([genre, count]: [string, any]) => (
                                <div key={genre} className="flex justify-between items-center">
                                    <span className="capitalize text-zinc-300 truncate pr-2">{genre}</span>
                                    <span className="font-mono text-white">{count}</span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
}
