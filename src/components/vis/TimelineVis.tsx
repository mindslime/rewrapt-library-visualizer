"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { SpotifyTrack, SpotifyArtist } from "@/types/spotify";
import { mapGenreToPillar, interpolatePillarColor, generateVariedColor } from "@/utils/spotifyTransform";


interface TimelineVisProps {
    tracks: SpotifyTrack[];
    artistMap: Map<string, SpotifyArtist>;
}

export default function TimelineVis({ tracks, artistMap }: TimelineVisProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number, y: number, content: any, date: string, highlightedGenre?: string } | null>(null);



    // Stable Color Cache
    const colorMapRef = useRef<Map<string, string>>(new Map());

    // Track mouse position for zoom-tracing
    const lastMousePos = useRef<{ x: number, y: number, svgX: number, svgY: number, clientX: number, clientY: number } | null>(null);
    const lockedGenre = useRef<string | null>(null);
    const currentHoveredRef = useRef<string | null>(null);

    // Shared Color Generator
    const getColor = (id: string) => {
        if (colorMapRef.current.has(id)) return colorMapRef.current.get(id)!;

        // Use 7 Pillars System for consistency with GenreMap
        const weights = mapGenreToPillar(id);
        const baseColor = interpolatePillarColor(weights);

        // Apply variance once
        const variedColor = generateVariedColor(baseColor);

        // Soften the color - slightly less saturated for timeline to avoid visual vibration
        const c = d3.color(variedColor);
        let finalColor = variedColor;
        if (c) {
            const hsl = d3.hsl(c);
            hsl.s *= 0.85;
            hsl.l = Math.min(0.75, Math.max(0.45, hsl.l)); // Clamp lightness
            finalColor = hsl.toString();
        }

        colorMapRef.current.set(id, finalColor);
        return finalColor;
    };

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Memoize Data Processing to prevent re-calc on simple frequent re-renders
    const { processedData, topGenres, dateExtent } = useMemo(() => {
        if (!tracks.length) return { processedData: [] as any[], topGenres: [] as string[], dateExtent: [new Date(), new Date()] as [Date, Date] };

        // 1. Buckets by Month
        const formatMonth = d3.timeFormat("%Y-%m");
        const parseMonth = d3.timeParse("%Y-%m");

        const tracksWithDate = tracks
            .filter(t => t.added_at)
            .map(t => {
                const date = new Date(t.added_at!);
                return isNaN(date.getTime()) ? null : { ...t, date, monthStr: formatMonth(date) };
            })
            .filter((t): t is NonNullable<typeof t> => !!t)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        if (tracksWithDate.length === 0) return { processedData: [] as any[], topGenres: [] as string[], dateExtent: [new Date(), new Date()] as [Date, Date] };

        // Identify Top Genres
        const genreGlobals = new Map<string, number>();
        tracksWithDate.forEach(t => {
            const artistId = t.artists[0]?.id;
            const fullArtist = artistMap.get(artistId);
            fullArtist?.genres?.forEach(g => genreGlobals.set(g, (genreGlobals.get(g) || 0) + 1));
        });

        const topGenres = Array.from(genreGlobals.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 40) // Increased limit for streamgraph detail
            .map(d => d[0]);

        if (topGenres.length === 0) return { processedData: [] as any[], topGenres: [] as string[], dateExtent: [new Date(), new Date()] as [Date, Date] };

        // Build Stack Data
        const dataByMonth = new Map<string, any>();

        // Fill gaps? Streamgraphs look better with continuous data.
        // Let's create a range of months from start to end
        const start = tracksWithDate[0].date;
        const end = tracksWithDate[tracksWithDate.length - 1].date;
        const monthRange = d3.timeMonth.range(d3.timeMonth.floor(start), new Date(d3.timeMonth.ceil(end).getTime() + 1));

        monthRange.forEach(date => {
            const mStr = formatMonth(date);
            dataByMonth.set(mStr, {
                month: date,
                monthStr: mStr,
                total: 0,
                ...Object.fromEntries(topGenres.map(g => [g, 0]))
            });
        });

        // Add 2 padding months before and after for smooth entry/exit
        // (Optional, maybe later if it looks cutoff)

        // Populate Data
        tracksWithDate.forEach(t => {
            if (dataByMonth.has(t.monthStr)) {
                const entry = dataByMonth.get(t.monthStr);
                const fullArtist = artistMap.get(t.artists[0]?.id);
                fullArtist?.genres?.forEach(g => {
                    if (topGenres.includes(g)) {
                        entry[g] += 1;
                        entry.total += 1;
                    }
                });
            }
        });

        const processedData = Array.from(dataByMonth.values()).sort((a, b) => a.month - b.month);
        const dateExtent = d3.extent(processedData, (d: any) => d.month) as [Date, Date];

        return { processedData, topGenres, dateExtent };
    }, [tracks.length, artistMap.size]); // Re-run only if tracks/artists count changes meaningfully (hacky but functional for now)


    // --- D3 RENDERING ---
    useEffect(() => {
        if (!dimensions.width || !dimensions.height || !processedData.length) return;

        const margin = { top: 20, right: 0, bottom: 30, left: 0 };
        const width = dimensions.width;
        const height = dimensions.height;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // -- Setup --
        const defs = svg.append("defs");
        defs.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        // Base Groups
        const chartArea = svg.append("g");

        // Scales
        // X Scale (Primary time scale)
        const x = d3.scaleTime()
            .domain(dateExtent)
            .range([margin.left, width - margin.right]);

        // Stack
        const stack = d3.stack()
            .keys(topGenres)
            .offset(d3.stackOffsetSilhouette) // centered stream
            .order(d3.stackOrderNone);

        const series = stack(processedData);

        // Initial Y Calculation
        const yMax = d3.max(series, layer => d3.max(layer, d => d[1])) || 0;
        const yMin = d3.min(series, layer => d3.min(layer, d => d[0])) || 0;
        const yPadding = (yMax - yMin) * 0.1;

        // Y Scale (Base)
        const y = d3.scaleLinear()
            .domain([yMin - yPadding, yMax + yPadding])
            .range([height - margin.bottom, margin.top]);

        // Refs for Animation Loop
        const state = {
            currentTransform: d3.zoomIdentity,
            targetYDomain: y.domain(),
            currentYDomain: y.domain(),
            isAnimating: false
        };

        // --- Layers ---
        const layerGroup = chartArea.append("g").attr("class", "layers");
        const paths = layerGroup.selectAll("path")
            .data(series)
            .join("path")
            .attr("class", "genre-stream")
            .attr("fill", (d) => getColor(d.key))
            .attr("opacity", 0.9)
            .attr("stroke", "rgba(0,0,0,0.2)")
            .attr("stroke-width", 0.5);

        // --- X Axis ---
        const xAxisGroup = chartArea.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .attr("class", "x-axis");

        // --- Labels Group ---
        const labelsGroup = chartArea.append("g").attr("class", "labels pointer-events-none");

        // --- SMART LABELS ALGORITHM ---
        const updateLabels = (currentXScale: d3.ScaleTime<number, number>, currentYScale: d3.ScaleLinear<number, number>) => {
            labelsGroup.selectAll("*").remove();

            const domain = currentXScale.domain();
            const visibleData = processedData.filter(d => d.month >= domain[0] && d.month <= domain[1]);

            if (visibleData.length < 2) return;

            // Defines how many points to sample for smoothness
            // We can iterate all visible points

            series.forEach(s => {
                const genre = s.key;

                // Find point of max thickness IN VIEW
                let maxThickness = 0;
                let maxPoint: any = null;
                // let maxIndex = -1;

                // We iterate the data points that are in view
                // We need to map the original data indices to the series data
                // The series data matches processedData index 1:1

                // Optimization: scan only visible range indices
                const startIndex = processedData.findIndex(d => d.month >= domain[0]);
                // Optimization: scan only visible range indices
                const endIndexRaw = processedData.findIndex(d => d.month > domain[1]);
                const endIndex = endIndexRaw === -1 ? processedData.length : endIndexRaw;

                if (startIndex === -1) return;

                for (let i = startIndex; i < endIndex; i++) {
                    const d = s[i]; // [y0, y1] at index i
                    const thickness = d[1] - d[0];
                    // Weight thickness by how central it is? (Optional)
                    if (thickness > maxThickness) {
                        maxThickness = thickness;
                        maxPoint = d;
                    }
                }

                if (!maxPoint || maxThickness === 0) return;

                // Convert data coordinates to screen coordinates
                const centroidX = currentXScale(maxPoint.data.month);
                const y0 = currentYScale(maxPoint[0]);
                const y1 = currentYScale(maxPoint[1]);
                const centroidY = (y0 + y1) / 2;
                const screenThickness = Math.abs(y0 - y1);

                // Thresholds
                if (screenThickness < 12) return; // Too thin for label

                // Font Size scaling (min 10px, max 24px)
                const fontSize = Math.min(24, Math.max(10, screenThickness / 2));

                labelsGroup.append("text")
                    .attr("data-genre", genre)
                    .attr("x", centroidX)
                    .attr("y", centroidY)
                    .attr("dy", "0.35em")
                    .attr("text-anchor", "middle")
                    .text(genre)
                    .style("fill", "white")
                    .style("font-size", `${fontSize}px`)
                    .style("font-weight", "bold")
                    .style("font-family", "system-ui")
                    .style("pointer-events", "none")
                    .style("text-shadow", "0px 1px 4px rgba(0,0,0,0.8)")
                    .style("opacity", 0)
                    .transition().duration(200)
                    .style("opacity", 1);
            });
        };

        // --- Helper: Draw Function ---
        const draw = () => {
            // 1. Construct Current Scales
            const currentX = state.currentTransform.rescaleX(x);
            const currentY = y.copy().domain(state.currentYDomain);

            // 2. Area Generator
            const area = d3.area()
                .curve(d3.curveBasis)
                .x((d: any) => currentX(d.data.month))
                .y0((d: any) => currentY(d[0]))
                .y1((d: any) => currentY(d[1]));

            // 3. Update Paths
            paths.attr("d", area as any);

            // 4. Update Axis
            const visibleMs = currentX.domain()[1].getTime() - currentX.domain()[0].getTime();
            const visibleMonths = visibleMs / (1000 * 60 * 60 * 24 * 30);

            // Use width-based Density Threshold
            let tickArg: any = width / 100;
            if (visibleMonths < width / 90) tickArg = d3.timeMonth;

            // Check if dataset spans multiple years
            const isMultiYear = dateExtent[1].getFullYear() !== dateExtent[0].getFullYear();

            const axis = d3.axisBottom(currentX)
                .ticks(tickArg)
                .tickSize(0)
                .tickPadding(10)
                .tickFormat((domainValue: any) => {
                    const d = domainValue as Date;

                    // Safety: Hide any tick that isn't the start of a month
                    if (d.getDate() !== 1) return "";

                    // Always show year if dataset spans multiple years, or zoom is wide
                    if (isMultiYear || visibleMonths >= 12) return d3.timeFormat("%b '%y")(d);
                    return d3.timeFormat("%b")(d);
                });


            xAxisGroup.call(axis)
                .call(g => g.select(".domain").remove())
                .call(g => g.selectAll("text").style("fill", "#71717a").style("font-size", "10px").style("font-family", "system-ui"));


            return { currentX, currentY };
        };

        // Initial Draw
        draw();

        // Label Update (Moved separate to avoid excessive recalc in loop, or throttled)
        const redrawLabels = () => {
            const { currentX, currentY } = draw(); // Ensure we have latest scales
            updateLabels(currentX, currentY);
        };
        redrawLabels(); // Initial Labels

        // --- INTERACTION ---

        // Background Capture
        const bgLayer = chartArea.insert("rect", ":first-child")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent")
            .attr("class", "background-capture");

        // Scanner Line
        const scannerLine = chartArea.append("line")
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3 3")
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom)
            .style("opacity", 0)
            .style("pointer-events", "none");

        // --- HOVER LOGIC ---
        const handleInteraction = (mx: number, my: number, targetElement?: Element | null, lockedGenreOverride?: string | null) => {
            const currentX = state.currentTransform.rescaleX(x);

            // 1. Resolve Date (X-Axis)
            const date = currentX.invert(mx);

            // 2. Find closest data point
            const bisect = d3.bisector((d: any) => d.month).center;
            const i = bisect(processedData, date);
            const d0 = processedData[i - 1];
            const d1 = processedData[i];
            let d = d0;
            if (d0 && d1) {
                d = date.getTime() - d0.month.getTime() > d1.month.getTime() - date.getTime() ? d1 : d0;
            } else if (!d0) {
                d = d1;
            }

            if (!d) return;

            // 3. Move Scanner
            const px = currentX(d.month);
            scannerLine
                .attr("x1", px)
                .attr("x2", px)
                .style("opacity", 1);

            // 4. Determine Hovered Stream (VISUAL CHECK)
            let hoveredGenre: string | undefined = undefined;

            if (lockedGenreOverride) {
                // If locked, use that
                hoveredGenre = lockedGenreOverride;
            } else {
                // Standard detection
                let element = targetElement;
                if (!element && lastMousePos.current) {
                    element = document.elementFromPoint(lastMousePos.current.clientX, lastMousePos.current.clientY);
                }

                if (element) {
                    const datum = d3.select(element).datum() as any;
                    if (datum && datum.key && topGenres.includes(datum.key)) {
                        hoveredGenre = datum.key;
                    }
                }
            }

            // Store for locking logic
            currentHoveredRef.current = hoveredGenre || null;

            // 5. Highlight Effect
            const activeGenres = new Set(Object.keys(d).filter(k => d[k] > 0 && topGenres.includes(k)));

            if (hoveredGenre) {
                // Focus on Specific Stream
                paths.transition().duration(50)
                    .attr("opacity", (s) => s.key === hoveredGenre ? 1 : 0.2);

                labelsGroup.selectAll("text").transition().duration(50)
                    .style("opacity", function () {
                        return d3.select(this).attr("data-genre") === hoveredGenre ? 1 : 0.2;
                    });
            } else {
                // Focus on Time Slice (Current Month)
                paths.transition().duration(50)
                    .attr("opacity", (s) => activeGenres.has(s.key) ? 0.9 : 0.2);

                labelsGroup.selectAll("text").transition().duration(50)
                    .style("opacity", function () {
                        const g = d3.select(this).attr("data-genre");
                        return (g && activeGenres.has(g)) ? 1 : 0.2;
                    });
            }

            // 6. Tooltip
            setTooltip({
                x: mx,
                y: my,
                content: d,
                date: d3.timeFormat("%B %Y")(d.month),
                highlightedGenre: hoveredGenre
            });
        };

        const leaveInteraction = () => {
            lastMousePos.current = null;
            currentHoveredRef.current = null;
            scannerLine.style("opacity", 0);
            paths.transition().duration(200).attr("opacity", 0.9);
            labelsGroup.selectAll("text").transition().duration(200).style("opacity", 1);
            setTooltip(null);
        };


        // --- ANIMATION LOOP ---
        let lastDrawnTransform = d3.zoomIdentity;

        const timer = d3.timer(() => {
            let changed = false;

            // 1. Check if Transform Changed (Pan/Zoom X)
            if (state.currentTransform !== lastDrawnTransform) {
                changed = true;
                lastDrawnTransform = state.currentTransform;
            }

            // 2. Lerp Y Domain (Smooth Y Adjust)
            const target = state.targetYDomain;
            const current = state.currentYDomain;
            const k = 0.15;

            if (Math.abs(target[0] - current[0]) > 0.01 || Math.abs(target[1] - current[1]) > 0.01) {
                const nextMin = current[0] + (target[0] - current[0]) * k;
                const nextMax = current[1] + (target[1] - current[1]) * k;
                state.currentYDomain = [nextMin, nextMax];
                changed = true;
            } else {
                if (current[0] !== target[0] || current[1] !== target[1]) {
                    state.currentYDomain = [...target];
                    changed = true;
                }
            }

            if (changed) {
                draw();
                redrawLabels();

                // If we are animating Y, the thing under the cursor might change!
                // We should re-run interaction if persistent mouse exists.
                if (lastMousePos.current) {
                    // We need client coords for elementFromPoint to be accurate during animation
                    const { clientX, clientY, svgX, svgY } = lastMousePos.current;
                    const element = document.elementFromPoint(clientX, clientY);
                    handleInteraction(svgX, svgY, element, lockedGenre.current);
                }
            }
        });


        // --- ZOOM BEHAVIOR ---
        const msTotal = dateExtent[1].getTime() - dateExtent[0].getTime();
        const minMs = 1000 * 60 * 60 * 24 * 60; // ~2 months visible
        const maxZoom = Math.max(1, msTotal / minMs);

        const zoom = d3.zoom()
            .scaleExtent([1, maxZoom])
            .extent([[margin.left, 0], [width - margin.right, height]])
            .translateExtent([[margin.left, -Infinity], [width - margin.right, Infinity]])
            .on("start", (event) => {
                // LOCK GENRE IF APPLICABLE
                if (currentHoveredRef.current) {
                    lockedGenre.current = currentHoveredRef.current;
                }
            })
            .on("end", () => {
                // UNLOCK
                lockedGenre.current = null;
            })
            .on("zoom", (event) => {
                state.currentTransform = event.transform;

                // Target Y Calculation
                const newX = event.transform.rescaleX(x);
                const domain = newX.domain();
                const bisect = d3.bisector((d: any) => d.month).left;
                const i0 = Math.max(0, bisect(processedData, domain[0]));
                const i1 = Math.min(processedData.length, d3.bisector((d: any) => d.month).right(processedData, domain[1]));

                let localYMin = 0;
                let localYMax = 0;

                if (i0 < i1) {
                    localYMin = d3.min(series, layer => {
                        let min = Infinity;
                        for (let k = i0; k < i1; k++) {
                            if (layer[k][0] < min) min = layer[k][0];
                        }
                        return min;
                    }) || 0;

                    localYMax = d3.max(series, layer => {
                        let max = -Infinity;
                        for (let k = i0; k < i1; k++) {
                            if (layer[k][1] > max) max = layer[k][1];
                        }
                        return max;
                    }) || 0;
                }
                const padding = (localYMax - localYMin) * 0.1;

                state.targetYDomain = [localYMin - padding, localYMax + padding];

                // --- TRACING LOGIC ---
                // If we have a mouse position, update the interaction immediately
                // This ensures the X-marker follows the time under the cursor
                if (lastMousePos.current) {
                    const { clientX, clientY, svgX, svgY } = lastMousePos.current;
                    const element = document.elementFromPoint(clientX, clientY);
                    handleInteraction(svgX, svgY, element, lockedGenre.current);
                }
            });

        // Initialize Zoom
        svg.call(zoom as any);

        // Bind Events to SVG
        svg
            .on("mousemove", (event) => {
                const [mx, my] = d3.pointer(event);
                const { clientX, clientY } = event;

                // Store BOTH SVG relative and Client screen coords
                lastMousePos.current = { x: mx, y: my, svgX: mx, svgY: my, clientX, clientY };

                handleInteraction(mx, my, event.target, lockedGenre.current);
            })
            .on("mouseleave", leaveInteraction)
            .on("touchmove", (event) => {
                event.preventDefault();
                const [mx, my] = d3.pointer(event);
                const touch = event.touches[0];
                const { clientX, clientY } = touch;

                lastMousePos.current = { x: mx, y: my, svgX: mx, svgY: my, clientX, clientY };

                const element = document.elementFromPoint(clientX, clientY);
                handleInteraction(mx, my, element || undefined, lockedGenre.current);
            }, { passive: false })
            .on("touchend", () => setTimeout(leaveInteraction, 1000));



        // Cleanup
        return () => {
            timer.stop();
        };

    }, [processedData, dimensions]);

    return (
        <div ref={containerRef} className="w-full h-full animate-in fade-in duration-500 relative bg-zinc-950/50 touch-none">
            <svg ref={svgRef} className="w-full h-full block" />

            {status && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950/80 p-6 text-center pointer-events-none">
                    <p className="text-lg font-semibold mb-2">Notice</p>
                    <p>{status}</p>
                </div>
            )}



            {/* --- TOOLTIP --- */}
            {tooltip && (
                <div
                    className="absolute z-50 pointer-events-none"
                    style={{
                        left: Math.min(tooltip.x + 15, dimensions.width - 220), // Prevent overflow right
                        top: Math.max(10, tooltip.y - 100), // Render ABOVE finger/cursor by default
                    }}
                >
                    <div className="bg-zinc-900/95 text-white text-xs p-3 rounded-xl shadow-2xl backdrop-blur-md border border-zinc-700 w-52">
                        <div className="font-bold text-base mb-2 text-green-400 border-b border-zinc-700 pb-1 flex justify-between">
                            <span>{tooltip.date}</span>
                            <span className="text-zinc-500 text-[10px] font-normal pt-1">Total: {tooltip.content.total}</span>
                        </div>
                        <div className="space-y-1 max-h-48 overflow-hidden">
                            {/* Show Highlighted Genre First if exists */}
                            {tooltip.highlightedGenre && (
                                <div className="flex justify-between items-center gap-2 bg-zinc-800/50 p-1 rounded mb-2 border border-zinc-600">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: getColor(tooltip.highlightedGenre) }}
                                        />
                                        <span className="capitalize text-white font-bold truncate">{tooltip.highlightedGenre}</span>
                                    </div>
                                    <span className="font-mono text-white font-bold">{tooltip.content[tooltip.highlightedGenre]}</span>
                                </div>
                            )}

                            {Object.entries(tooltip.content)
                                .filter(([key]) => key !== 'month' && key !== 'monthStr' && key !== 'total' && key !== 'date' && key !== tooltip.highlightedGenre)
                                .sort((a: any, b: any) => b[1] - a[1]) // sorting by count
                                .slice(0, 5) // Top 5
                                .map(([genre, count]: [string, any]) => {
                                    if (count === 0) return null;
                                    return (
                                        <div key={genre} className="flex justify-between items-center gap-2 px-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {/* <div
                                                    className="w-2 h-2 rounded-full flex-shrink-0 opacity-70"
                                                    style={{ backgroundColor: getColor(genre) }}
                                                /> */}
                                                <span className="capitalize text-zinc-400 truncate">{genre}</span>
                                            </div>
                                            <span className="font-mono text-zinc-300">{count}</span>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
