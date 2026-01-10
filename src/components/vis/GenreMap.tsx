"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { GenreNode, SpotifyTrack } from "@/types/spotify";
import { Play, Pause, FastForward, Rewind, Calendar, Clock, ArrowLeft } from "lucide-react";
import { genreColors } from "@/utils/genreColors";

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

    // --- Time Travel State ---
    const [currentDate, setCurrentDate] = useState<number>(Date.now());
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1); // months per tick? or speed multiplier
    const [timeRange, setTimeRange] = useState<{ min: number; max: number }>({ min: Date.now(), max: Date.now() });

    // Store exact track dates for performance
    const nodeTrackCache = useRef<Map<string, number[]>>(new Map());

    // --- References ---
    const transformRef = useRef(d3.zoomIdentity);
    const simulationRef = useRef<d3.Simulation<GenreNode, undefined> | null>(null);
    // We store the "full" set of nodes for the current view (activeData) with their physics state preserved
    const currentSimulationNodes = useRef<GenreNode[]>([]);

    // Stable Color Scale
    // We compute this ONCE for the active view to ensure colors don't shift as nodes appear/disappear
    const colorScale = useMemo(() => {
        // Fallback scale for unknown genres
        const ordinal = d3.scaleOrdinal(d3.schemeCategory10);

        return (id: string) => {
            // Check specific map first
            // normalize id to lower case just in case matches map keys
            const key = id.toLowerCase();
            if (genreColors[key]) return genreColors[key];

            // Fallback
            return ordinal(id);
        };
    }, []); // No dependencies needed if genreColors is static and ordinal is internal

    // 1. Calculate Time Range when data changes
    useEffect(() => {
        if (!data || data.length === 0) return;

        // Find global min/max
        // We need to look at ALL tracks in data to find range
        let min = Date.now();
        let max = 0;
        let hasDates = false;

        const traverse = (nodes: GenreNode[]) => {
            nodes.forEach(n => {
                if (n.tracks) {
                    n.tracks.forEach(t => {
                        if (t.added_at) {
                            const d = new Date(t.added_at).getTime();
                            if (d < min) min = d;
                            if (d > max) max = d;
                            hasDates = true;
                        }
                    });
                }
                if (n.children) traverse(n.children);
            });
        };

        traverse(data);

        // Fallback if no dates
        if (!hasDates) {
            min = Date.now() - 31536000000; // 1 year ago
            max = Date.now();
        }

        // Buffer range slightly
        setTimeRange({ min, max });
        setCurrentDate(max); // Start at end (present day)
    }, [data]);

    // 2. Pre-process ActiveData into Simulation Nodes when ActiveData changes (Drill Down/Up)
    useEffect(() => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // Reset Cache for current view
        nodeTrackCache.current.clear();
        activeData.forEach(node => {
            if (node.tracks) {
                // map dates once
                const dates = node.tracks
                    .map(t => t.added_at ? new Date(t.added_at).getTime() : 0)
                    .filter(d => d > 0)
                    .sort((a, b) => a - b);
                nodeTrackCache.current.set(node.id, dates);
            }
        });

        // Create new simulation nodes, but try to preserve positions if ID matches?
        // For distinct drill downs, we usually want fresh positions.
        // Let's just create fresh.
        currentSimulationNodes.current = activeData.map(d => ({
            ...d,
            x: Math.random() * width,
            y: Math.random() * height,
            // Initialize count to 0 if we were starting at time 0, but we depend on logic below
            // We'll let the filter loop set the correct counts/presence
        }));

        // --- CLUSTERING LOGIC ---
        // Create links between nodes that share artists
        const activeNodeIds = new Set(activeData.map(d => d.id));
        const links: any[] = [];

        // Simple O(N^2) comparison - fine for N < 200
        for (let i = 0; i < activeData.length; i++) {
            for (let j = i + 1; j < activeData.length; j++) {
                const source = activeData[i];
                const target = activeData[j];

                // Intersection of artists
                if (source.artists && target.artists) {
                    const setA = new Set(source.artists);
                    const setB = new Set(target.artists);
                    let intersection = 0;
                    setA.forEach(a => { if (setB.has(a)) intersection++; });

                    if (intersection > 0) {
                        // Jaccard Index or similar
                        // const union = setA.size + setB.size - intersection;
                        // const strength = intersection / union;

                        // Let's just use raw intersection count weighted by size? 
                        // Actually, if they share ANY artist, they should be somewhat close.
                        // We want "Similar genres" -> Share artists.

                        // Limit links to significant overlaps to avoid hairball
                        if (intersection >= 1) {
                            links.push({
                                source: source.id,
                                target: target.id,
                                value: intersection
                            });
                        }
                    }
                }
            }
        }


        // Find Max Count for Gravity Scaling
        const maxCount = Math.max(...activeData.map(d => d.count), 1);

        // Re-initialize Simulation
        if (simulationRef.current) simulationRef.current.stop();

        const simulation = d3.forceSimulation<GenreNode>(currentSimulationNodes.current)
            .alphaTarget(0.0) // Settle completely
            .velocityDecay(0.6) // High friction (was 0.35) to stop "spinning"
            .force("charge", d3.forceManyBody().strength(-30)) // Slightly reduced repulsion (was -40)
            .force("x", d3.forceX(width / 2).strength((d: any) => {
                // Variable gravity: Large nodes pulled harder to center
                // REDUCED STRENGTH significantly to prevent "magnetized" clumping
                const sizeRatio = Math.sqrt(d.count || 0) / Math.sqrt(maxCount);
                return 0.005 + (sizeRatio * 0.01); // Was 0.02 + 0.08
            }))
            .force("y", d3.forceY(height / 2).strength((d: any) => {
                const sizeRatio = Math.sqrt(d.count || 0) / Math.sqrt(maxCount);
                return 0.005 + (sizeRatio * 0.01);
            }))
            .force("collide", d3.forceCollide()
                .radius((d: any) => Math.sqrt(d.count) * 10 + 4) // Initial radius
                .strength(1) // Stiff collision
                .iterations(4) // More iterations = stiffer collisions, less overlap
            )
            .force("link", d3.forceLink(links)
                .id((d: any) => d.id)
                .distance(60) // Target distance between related clusters
                .strength(0.1) // Weak pull, just enough to group them over time
            )
            .force("colorWheel", alpha => {
                // Custom Force: Spectral Sorting
                // Pull nodes towards an angle matching their color hue
                const k = alpha * 0.15; // Strength of the pull
                const radius = Math.min(width, height) * 0.35; // Target radius for the color ring

                currentSimulationNodes.current.forEach((d: any) => {
                    // Get color for this node
                    let color = "#888888"; // default
                    const key = (d.id || "").toLowerCase();
                    if (genreColors[key]) color = genreColors[key];

                    // Simple Hex to Hue
                    const hue = hexToHue(color);

                    // Map Hue (0-360) to Radians (0-2PI)
                    const angle = (hue / 360) * 2 * Math.PI;

                    const targetX = width / 2 + Math.cos(angle) * radius;
                    const targetY = height / 2 + Math.sin(angle) * radius;

                    // Apply gentle velocity nudge
                    d.vx += (targetX - d.x!) * k;
                    d.vy += (targetY - d.y!) * k;
                });
            })
            .stop(); // We will tick manually or in loop

        simulationRef.current = simulation;

        // Trigger an update to filter logic immediately
        updateSimulationForDate(currentDate);

    }, [activeData]);


    // 3. Playback Loop
    useEffect(() => {
        let animationFrameId: number;
        let lastTime = performance.now();

        const loop = (time: number) => {
            if (!isPlaying) return;

            const dt = time - lastTime;
            lastTime = time;

            // Speed:  Span / 10 seconds?
            // Let's say we want to cover the whole range in 20 seconds at 1x
            const totalSpan = timeRange.max - timeRange.min;
            const durationMs = 60000 / playbackSpeed; // Increased base duration to 60s for slower playback
            const advance = (totalSpan / durationMs) * dt;

            setCurrentDate(prev => {
                const next = prev + advance;
                if (next >= timeRange.max) {
                    setIsPlaying(false);
                    return timeRange.max;
                }
                return next;
            });

            animationFrameId = requestAnimationFrame(loop);
        };

        if (isPlaying) {
            // If we are at the end, restart
            if (currentDate >= timeRange.max) {
                setCurrentDate(timeRange.min);
            }
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(loop);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying, timeRange, playbackSpeed]); // currentDate is in state setter callback


    // 4. Update Simulation & Filter Nodes based on Date
    // This runs whenever currentDate changes or Simulation re-inits
    const updateSimulationForDate = useCallback((date: number) => {
        if (!simulationRef.current) return;
        const width = containerRef.current?.clientWidth || 800;
        const height = containerRef.current?.clientHeight || 600;
        const aspectRatio = width / height;

        // Current Nodes (mutable D3 objects)
        const allNodes = currentSimulationNodes.current;

        // Filter and Update Counts
        const activeNodes: GenreNode[] = [];

        allNodes.forEach(node => {
            // Calculate dynamic count
            const dates = nodeTrackCache.current.get(node.id);
            let count = 0;
            if (dates) {
                // simple loop (dates are sorted)
                for (let d of dates) {
                    if (d <= date) count++;
                    else break;
                }
            } else {
                // If no tracks (intermediate node?), use node.count if static? 
                // We should assume data has tracks. If not, preserve original count?
                // For safety, if no tracks, we check if it has children?
                // If it's a genre node without tracks attached (older bug), keep static?
                // With our fix, it should have tracks.
                // Fallback:
                count = node.count;
            }

            // Update node property
            node.count = count;

            if (count > 0) {
                activeNodes.push(node);
            }
        });

        // Update Simulation
        // For smooth transitions, we want to KEEP the same node references if possible.
        // activeNodes contains references to objects in currentSimulationNodes.current

        // Detect new nodes for animation
        activeNodes.forEach((node: any) => {
            // If node was previously inactive (count == 0 or not in list) and now is active
            if (!node.currentRadius) node.currentRadius = 0;

            const targetRadius = Math.sqrt(node.count) * 10;
            if (targetRadius > 0 && node.currentRadius === 0) {
                node.spawnTime = Date.now();
                node.isSpawning = true;
            }
            node.targetRadius = targetRadius;
        });

        simulationRef.current.nodes(activeNodes);

        // Update Forces that depend on data
        simulationRef.current.force("collide", d3.forceCollide()
            .radius((d: any) => d.targetRadius + 5) // Solid buffer
            .strength(1)
            .iterations(3)
        );

        // Update Links (if we have them initialized) and filter for ACTIVE nodes only
        // We need to re-calculate links for just the active subset, or filter the master link list?
        // Calculating on the fly is cheap for N<100.
        const activeIdSet = new Set(activeNodes.map(d => d.id));
        const activeLinks: any[] = [];

        const nodesList = activeNodes;
        for (let i = 0; i < nodesList.length; i++) {
            for (let j = i + 1; j < nodesList.length; j++) {
                const s = nodesList[i];
                const t = nodesList[j];
                // Check intersection in active set
                // We can re-use the pre-calc if we stored it, but doing it here is safe
                if (s.artists && t.artists) {
                    // Optimization: check if bounding boxes overlap? No, logic first.
                    const sA = new Set(s.artists);
                    let intersect = 0;
                    for (const a of t.artists) {
                        if (sA.has(a)) intersect++;
                    }
                    if (intersect > 0) {
                        activeLinks.push({ source: s.id, target: t.id });
                    }
                }
            }
        }

        if (simulationRef.current.force("link")) {
            (simulationRef.current.force("link") as d3.ForceLink<any, any>).links(activeLinks);
        }

        // Re-heat simulation significantly if we have potential collisions/new nodes
        simulationRef.current.alpha(0.3).restart();

    }, []);

    // Sync effect
    useEffect(() => {
        updateSimulationForDate(currentDate);
    }, [currentDate, updateSimulationForDate]);


    // 5. Render Loop (Canvas)
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        // This loop only DRAWS. Physics is handled in D3 internal timer or manually ticked?
        // D3 internal timer handles physics ticks and calls 'tick' event.
        // We attached 'tick' handler in previous implementation. 
        // Here we need to attach the tick handler to the CURRENT simulation.

        // D3 v4+ simulation runs its own timer.
        // We need to register the 'tick' event on the simulationRef.current whenever it changes.
    }, []);

    // We need to attach the renderer to the simulation
    useEffect(() => {
        if (!simulationRef.current || !canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        canvas.width = width;
        canvas.height = height;

        // Renderer
        const ticked = () => {
            if (!context) return;
            context.save();
            context.clearRect(0, 0, width, height);

            const { k, x, y } = transformRef.current;
            context.translate(x, y);
            context.scale(k, k);

            const nodes = simulationRef.current?.nodes() || [];

            const now = Date.now();

            // Sort by size DESCENDING so we draw BIG ones first (background) and SMALL ones last (foreground)
            // This prevents small ones from "sliding under" big ones visually
            nodes.sort((a, b) => (b.count || 0) - (a.count || 0));

            nodes.forEach((node: any) => {
                if (node.count <= 0) return;

                // ANIMATION: Smooth Growth
                // Lerp currentRadius -> targetRadius
                const targetRadius = node.targetRadius || (Math.sqrt(node.count) * 10);
                if (typeof node.currentRadius !== 'number') node.currentRadius = 0;

                // Simple lerp: move 10% of the way each frame
                const diff = targetRadius - node.currentRadius;
                if (Math.abs(diff) > 0.1) {
                    node.currentRadius += diff * 0.1;
                } else {
                    node.currentRadius = targetRadius;
                }

                const radius = node.currentRadius;

                // Draw Bubble
                context.beginPath();
                context.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
                context.fillStyle = colorScale(node.id);
                context.fill();
                context.strokeStyle = "rgba(255,255,255,0.4)";
                context.lineWidth = 2 / k;
                context.stroke();

                // ANIMATION: Splash / Inverse Ripple
                if (node.spawnTime && (now - node.spawnTime < 800)) {
                    const elapsed = now - node.spawnTime;
                    const progress = elapsed / 800; // 0 to 1

                    // Splash Effect: Large ring shrinking IN
                    // Start at 2.5x radius, shrink to 1x radius
                    const splashRadius = radius * 2.5 - (radius * 1.5 * progress);

                    if (splashRadius > radius) {
                        context.beginPath();
                        context.arc(node.x!, node.y!, splashRadius, 0, 2 * Math.PI);
                        context.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`; // Fade out
                        context.lineWidth = (2 * (1 - progress)) / k;
                        context.stroke();
                    }
                }

                // Draw Text
                // Only show text if mostly grown
                if (radius * k > 15 && radius > targetRadius * 0.8) {
                    context.fillStyle = "white";
                    const isArtistLevel = viewStack.length > 0;
                    const fontSize = isArtistLevel ? 8 : 10;
                    context.font = `bold ${fontSize}px sans-serif`;
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.shadowColor = "black";
                    context.shadowBlur = 4;
                    context.fillText(node.name, node.x!, node.y!);
                    context.shadowBlur = 0;
                }
            });

            context.restore();
        };

        simulationRef.current.on("tick", ticked);

        // Zoom Logic Update
        const zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                transformRef.current = event.transform;
                ticked(); // Force redraw
            });

        d3.select(canvas).call(zoom as any);

    }, [activeData, viewStack.length, colorScale]); // Re-bind when activeData changes (new sim)

    // Interaction Handlers (Mouse) - mostly unchanged, just need to query sim nodes
    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        const handleMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const { k, x, y } = transformRef.current;
            const mouseX = (event.clientX - rect.left - x) / k;
            const mouseY = (event.clientY - rect.top - y) / k;

            // use safe list
            const nodes = simulationRef.current?.nodes() || [];
            let found: GenreNode | null = null;

            // Loop backwards for Z-index
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

            const nodes = simulationRef.current?.nodes() || [];
            for (let i = nodes.length - 1; i >= 0; i--) {
                const node = nodes[i];
                const dx = mouseX - node.x!;
                const dy = mouseY - node.y!;
                const r = Math.sqrt(node.count) * 10;
                if (dx * dx + dy * dy < r * r) {
                    if (node.children && node.children.length > 0) {
                        setViewStack(prev => [...prev, node.name]);
                        setActiveData(node.children);
                        setHoveredNode(null);
                        // Reset Date to End or Keep? 
                        // UX: Usually keep to see detail at that time?
                        // Let's keep.
                    } else {
                        setSelectedArtistNode(node);
                    }
                    break;
                }
            }
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("click", handleClick);
        return () => {
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("click", handleClick);
        };
    }, [activeData]); // Re-bind on data change just to be safe with closure



    const handleBack = () => {
        // Simple reset to top level for now, or pop stack if we only have 1 level
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


            {/* Time Travel Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40">
                <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-2xl p-4 shadow-2xl space-y-4">

                    {/* Date Display & Play Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="p-3 bg-green-500 hover:bg-green-400 text-black rounded-full transition-all shadow-lg hover:scale-105"
                            >
                                {isPlaying ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
                            </button>

                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Current Time</span>
                                <div className="text-xl font-mono text-white flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-green-500" />
                                    {new Date(currentDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
                            {[1, 5, 20].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => setPlaybackSpeed(speed)}
                                    className={`px-2 py-1 text-xs font-bold rounded ${playbackSpeed === speed ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-white"}`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Slider */}
                    <div className="relative h-6 flex items-center">
                        <input
                            type="range"
                            min={timeRange.min}
                            max={timeRange.max}
                            value={currentDate}
                            onChange={(e) => {
                                setIsPlaying(false);
                                setCurrentDate(Number(e.target.value));
                            }}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400 transition-all"
                        />
                        {/* Optional: Markers for years? */}
                    </div>

                    <div className="flex justify-between text-xs text-zinc-500 font-mono">
                        <span>{new Date(timeRange.min).getFullYear()}</span>
                        <span>{new Date(timeRange.max).getFullYear()}</span>
                    </div>
                </div>
            </div>

            {/* Back Button */}
            {viewStack.length > 0 && (
                <button
                    onClick={handleBack}
                    className="absolute top-4 left-4 bg-zinc-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-zinc-700 transition z-40 flex items-center gap-2 border border-zinc-600"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
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

// Helper: Convert Hex to Hue (0-360)
function hexToHue(hex: string): number {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt("0x" + hex[1] + hex[1]);
        g = parseInt("0x" + hex[2] + hex[2]);
        b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt("0x" + hex[1] + hex[2]);
        g = parseInt("0x" + hex[3] + hex[4]);
        b = parseInt("0x" + hex[5] + hex[6]);
    }
    r /= 255;
    g /= 255;
    b /= 255;

    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;
    return h;
}
