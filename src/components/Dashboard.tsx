"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, Music, Users, Library, Activity, Circle, List, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import GenreMap from "./vis/GenreMap";
import TimelineVis from "./vis/TimelineVis";
import PlaylistSkeleton from "./PlaylistSkeleton";
import { fetchPlaylistTracks, fetchArtists, fetchLikedSongs, fetchUserPlaylists } from "@/lib/spotify-client";
import { getCachedTracks, saveTracksToCache, checkTrackExists, getCachedArtists, saveArtistsToCache } from "@/lib/storage";
import { GenreNode, SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from "@/types/spotify";
import { transformTracksToNodes } from "@/utils/spotifyTransform";

interface DashboardProps {
    onDetailViewChange?: (isOpen: boolean) => void;
    onViewModeChange?: (mode: 'CLUSTER' | 'TIMELINE') => void;
    onProfileImageLoaded?: (url: string | null) => void;
}

export default function Dashboard({ onDetailViewChange, onViewModeChange, onProfileImageLoaded }: DashboardProps) {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);

    // View State
    const [viewTitle, setViewTitle] = useState<string | null>(null);

    // Sync view state with parent
    useEffect(() => {
        onDetailViewChange?.(!!viewTitle);
    }, [viewTitle, onDetailViewChange]);

    const [isLibraryView, setIsLibraryView] = useState(false);
    const [viewMode, setViewMode] = useState<'CLUSTER' | 'TIMELINE'>('CLUSTER');
    const [playlistViewMode, setPlaylistViewMode] = useState<'GRID' | 'LIST'>('GRID');

    // Sync view mode
    useEffect(() => {
        onViewModeChange?.(viewMode);
    }, [viewMode, onViewModeChange]);

    // Data State
    const [genreData, setGenreData] = useState<GenreNode[]>([]);
    const [allTracks, setAllTracks] = useState<SpotifyTrack[]>([]);
    const [artistDetails, setArtistDetails] = useState<Map<string, SpotifyArtist>>(new Map());

    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState("");
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

    // Abort Controller Ref
    const abortControllerRef = useRef<AbortController | null>(null);

    // cancel function to stop any ongoing operations
    const cancelOperations = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setLoading(false);
        setProgress(null);
    };

    // Helpers
    const processTracks = async (tracks: SpotifyTrack[], sourceName: string, signal: AbortSignal) => {
        if (!session?.accessToken) return;
        if (signal.aborted) return;

        setLoading(true);
        setViewTitle(sourceName);
        setGenreData([]);
        setAllTracks([]);
        setArtistDetails(new Map());
        setProgress(null);

        try {
            if (signal.aborted) return;

            // 1. Extract Artists
            const artistIds = new Set<string>();
            tracks.forEach(t => t.artists.forEach(a => artistIds.add(a.id)));
            const allArtistIds = Array.from(artistIds);

            // 2. Resolve Artists (Cache + Net)
            setLoadingStatus(`Resolving details for ${allArtistIds.length} artists...`);

            // A. Check Cache
            const cachedArtists = await getCachedArtists(allArtistIds);
            const cachedArtistMap = new Map(cachedArtists.map(a => [a.id, a]));

            const missingIds = allArtistIds.filter(id => !cachedArtistMap.has(id));

            let fetchedArtists: SpotifyArtist[] = [];

            // B. Fetch Missing
            if (missingIds.length > 0) {
                if (signal.aborted) return;
                setLoadingStatus(`Fetching details for ${missingIds.length} new artists...`);
                setProgress({ current: 0, total: missingIds.length });

                fetchedArtists = await fetchArtists(session.accessToken, missingIds, (current, total) => {
                    if (!signal.aborted) setProgress({ current, total });
                }, signal);

                // Save new ones to cache
                if (fetchedArtists.length > 0) {
                    await saveArtistsToCache(fetchedArtists);
                }
            }

            if (signal.aborted) return;

            setProgress(null);
            const allArtists = [...cachedArtists, ...fetchedArtists];

            // 3. Map Artists -> Genres
            const artistMap = new Map(allArtists.map(a => [a.id, a]));

            // SAVE DATA FOR TIMELINE
            setAllTracks(tracks);
            setArtistDetails(artistMap);

            // 4. Convert to Nodes (Using new "Spotify ID" transform)
            const nodes = transformTracksToNodes(tracks, artistMap);

            setGenreData(nodes);

        } catch (e: any) {
            if (e.message === "Aborted" || e.name === "AbortError") {
                console.log("Operation aborted");
                return;
            }
            console.error(e);
            alert("Failed to load data");
            setViewTitle(null);
            setIsLibraryView(false);
        } finally {
            if (!signal.aborted) {
                setLoading(false);
                setProgress(null);
            }
        }
    }

    const handlePlaylistClick = async (playlist: SpotifyPlaylist) => {
        if (!session?.accessToken) return;

        cancelOperations();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const signal = abortController.signal;

        setIsLibraryView(false);
        setLoadingStatus(`Fetching tracks for ${playlist.name}...`);
        setLoading(true);
        setViewTitle(playlist.name);
        setProgress({ current: 0, total: playlist.tracks.total });

        try {
            const tracks = await fetchPlaylistTracks(session.accessToken, playlist.id, (current, total) => {
                if (!signal.aborted) setProgress({ current, total });
            }, signal);

            if (signal.aborted) return;

            await processTracks(tracks, playlist.name, signal);
        } catch (e: any) {
            if (e.message === "Aborted" || e.name === "AbortError") return;
            console.error(e);
            setLoading(false);
            setViewTitle(null);
            setProgress(null);
        }
    };

    const handleLibraryClick = async () => {
        if (!session?.accessToken) return;

        cancelOperations();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const signal = abortController.signal;

        setIsLibraryView(true);
        setLoading(true);
        setViewTitle("Your Library");
        setProgress(null);

        try {
            if (signal.aborted) return;
            setLoadingStatus("Checking cache...");
            const cachedTracks = await getCachedTracks();

            if (cachedTracks.length > 0) {
                if (!signal.aborted) {
                    setLoading(false);
                    processTracks(cachedTracks, "Your Library", signal);
                }
            } else {
                if (!signal.aborted) {
                    setLoadingStatus("Fetching your entire Liked Songs library...");
                    setProgress({ current: 0, total: 100 });
                }
            }

            if (signal.aborted) return;

            const newTracks = await fetchLikedSongs(
                session.accessToken,
                (current, total) => {
                    if (cachedTracks.length === 0 && !signal.aborted) {
                        setProgress({ current, total });
                    }
                },
                checkTrackExists,
                signal
            );

            if (signal.aborted) return;

            if (newTracks.length > 0) {
                console.log(`Found ${newTracks.length} new tracks!`);
                await saveTracksToCache(newTracks);

                const allTracks = [...newTracks, ...cachedTracks];
                const uniqueTracks = Array.from(new Map(allTracks.map(t => [t.id, t])).values());

                await processTracks(uniqueTracks, "Your Library", signal);
            } else {
                console.log("Library up to date.");
            }

        } catch (e: any) {
            if (e.message === "Aborted" || e.name === "AbortError") return;
            console.error(e);
            if (genreData.length === 0) {
                alert("Failed to load library");
                setIsLibraryView(false);
                setViewTitle(null);
            }
        } finally {
            if (!signal.aborted && genreData.length === 0 && loading) {
                setLoading(false);
                setProgress(null);
            }
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelOperations();
        };
    }, []);

    useEffect(() => {
        if (session?.accessToken) {
            fetch("https://api.spotify.com/v1/me", {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            })
                .then((res) => res.json())
                .then((data) => {
                    setProfile(data);
                    if (data?.images?.[0]?.url) {
                        onProfileImageLoaded?.(data.images[0].url);
                    }
                });

            fetchUserPlaylists(session.accessToken).then(setPlaylists);
        }
    }, [session]);


    if (!session) return null;

    // --- RENDER: Detailed View (Genre Map) ---
    if (viewTitle) {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col">
                <header className="flex items-center justify-between px-4 py-2 md:px-6 md:py-4 bg-gradient-to-b from-[#121212]/95 to-[#121212]/0 backdrop-blur-md absolute top-0 left-0 right-0 z-[120]">
                    <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                        <button
                            onClick={() => {
                                cancelOperations();
                                setViewTitle(null);
                                setIsLibraryView(false);
                            }}
                            className="p-1.5 md:p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                        >
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <div className="min-w-0">
                            <h2 className="text-sm md:text-xl font-bold truncate">{viewTitle}</h2>
                            <p className="text-zinc-400 text-[10px] md:text-xs truncate hidden md:block">
                                {!isLibraryView && "Playlist Analysis"}
                            </p>
                        </div>
                    </div>

                    {/* View Switcher */}
                    <div className="flex bg-[#181818]/80 backdrop-blur-md p-1 rounded-lg relative z-[101]">
                        <button
                            onClick={() => setViewMode('CLUSTER')}
                            className={`flex items-center justify-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all cursor-pointer ${viewMode === 'CLUSTER' ? "bg-[#333333] text-white shadow-sm" : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Circle className="w-4 h-4" />
                            <span className="hidden md:inline">Clusters</span>
                        </button>

                        <button
                            onClick={() => setViewMode('TIMELINE')}
                            className={`flex items-center justify-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all cursor-pointer ${viewMode === 'TIMELINE' ? "bg-[#333333] text-white shadow-sm" : "text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Activity className="w-4 h-4" />
                            {/* Desktop: Always Show. Mobile: Hidden (Icon only) */}
                            <span className="hidden md:inline">
                                Timeline
                            </span>
                        </button>
                    </div>
                </header>

                {/* Spacer for fixed header */}
                <div className="h-12 md:h-20 flex-shrink-0 pointer-events-none" />

                <div className="flex-1 overflow-hidden relative bg-zinc-950">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 text-center p-8">
                            <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mb-4" />
                            <p className="text-lg mb-2">{loadingStatus}</p>

                            {progress && (
                                <div className="w-64 mt-4">
                                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-300 ease-out"
                                            style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-2">
                                        {progress.current} / {progress.total}
                                    </p>
                                </div>
                            )}

                            {isLibraryView && !progress && <p className="text-sm text-zinc-500 max-w-sm mt-4">Evaluating library size...</p>}
                        </div>
                    ) : (
                        <>
                            {viewMode === 'CLUSTER' && <GenreMap data={genreData} contextType={isLibraryView ? 'library' : 'playlist'} />}
                            {viewMode === 'TIMELINE' && <TimelineVis tracks={allTracks} artistMap={artistDetails} />}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // --- RENDER: Dashboard Home ---
    return (
        <div className="w-full max-w-6xl flex flex-col gap-6 sm:gap-8 mt-0 pb-20">
            {/* Header Stats */}
            <motion.div
                layout
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="bg-[#121212] p-8 rounded-xl"
            >
                <motion.div
                    layout
                    className="flex flex-col md:flex-row items-center gap-8"
                >
                    {/* Profile Image - Left */}
                    {profile?.images?.[0]?.url && (
                        <motion.img
                            layout
                            src={profile.images[0].url}
                            className="w-32 h-32 rounded-full border-4 border-zinc-700 object-cover flex-shrink-0 relative z-10"
                            alt="Profile"
                        />
                    )}

                    {/* Text - Center */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex-1 text-center md:text-left relative z-0"
                    >
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-2">
                            {profile?.display_name ? `Hi, ${profile.display_name}` : "Welcome"}
                        </h2>
                        <p className="text-zinc-400">Visualize your musical landscape.</p>
                    </motion.div>

                    <motion.div layout className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto">
                        <button
                            onClick={handleLibraryClick}
                            className="relative group overflow-hidden p-[1px] rounded-xl transition-all hover:scale-105 shadow-lg hover:shadow-[0_0_20px_2px_rgba(16,185,129,0.5)] w-full md:w-auto"
                        >
                            {/* Animated Conic Gradient Background */}
                            <div className="absolute inset-[-1000%] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#10b981_40%,#a7f3d0_50%,#10b981_60%,#000000_100%)] animate-[spin_4s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Inner Content */}
                            <div className="relative flex items-center justify-center md:justify-start gap-3 px-6 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl h-full w-full backface-visibility-hidden">
                                <Library className="w-6 h-6" />
                                <span className="relative z-10">Analyze Liked Music</span>
                            </div>
                        </button>

                        <div className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1f1f1f] rounded-xl text-zinc-300">
                            <div className="text-xl font-bold text-white">{playlists.length}</div>
                            <div className="text-sm">{playlists.length === 1 ? "Playlist" : "Playlists"}</div>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Playlist Section */}
            <div className="bg-[#121212] p-6 rounded-xl">
                <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-xl font-bold">Your Playlists</h2>
                    <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/50">
                        <button
                            onClick={() => setPlaylistViewMode('GRID')}
                            className={`p-2 rounded-md transition-all ${playlistViewMode === 'GRID' ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPlaylistViewMode('LIST')}
                            className={`p-2 rounded-md transition-all ${playlistViewMode === 'LIST' ? "bg-zinc-700 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {playlistViewMode === 'GRID' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {playlists.length === 0 ? (
                            // Loading Skeletons
                            Array.from({ length: 15 }).map((_, i) => (
                                <PlaylistSkeleton key={i} />
                            ))
                        ) : (
                            playlists.map((playlist, i) => (
                                <button
                                    key={playlist.id}
                                    onClick={() => handlePlaylistClick(playlist)}
                                    className="group text-left"
                                    style={{
                                        animation: `fade-in-up 0.6s ease-out forwards`,
                                        animationDelay: `${i * 0.05}s`,
                                        opacity: 0 // Start invisible
                                    }}
                                >
                                    <div className="aspect-square bg-[#181818] rounded-lg overflow-hidden mb-3 shadow-lg group-hover:shadow-green-900/20 group-hover:scale-105 transition-all duration-300 relative">
                                        {playlist.images?.[0]?.url ? (
                                            <img
                                                src={playlist.images[0].url}
                                                alt={playlist.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                                                <Music className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-green-500 text-black p-3 rounded-full translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <Music className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-white truncate px-1 group-hover:text-green-400 transition-colors">{playlist.name}</h3>
                                    <p className="text-xs text-zinc-400 px-1 truncate">{playlist.tracks?.total} tracks</p>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {playlists.map((playlist) => (
                            <button
                                key={playlist.id}
                                onClick={() => handlePlaylistClick(playlist)}
                                className="group flex items-center gap-4 p-3 bg-[#181818] hover:bg-[#282828] rounded-xl transition-all"
                            >
                                <div className="w-12 h-12 bg-zinc-800 rounded flex-shrink-0 overflow-hidden relative">
                                    {playlist.images?.[0]?.url ? (
                                        <img
                                            src={playlist.images[0].url}
                                            alt={playlist.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                                            <Music className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 text-left min-w-0">
                                    <h3 className="font-bold text-white truncate group-hover:text-green-400 transition-colors">{playlist.name}</h3>
                                    <p className="text-xs text-zinc-500 truncate">{playlist.tracks?.total} tracks • {playlist?.description || "No description"}</p>
                                </div>

                                <div className="p-2 text-zinc-600 group-hover:text-green-500 transition-colors">
                                    <Music className="w-5 h-5" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
