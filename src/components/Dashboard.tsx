"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Music, Users, Library, Activity, Grid } from "lucide-react";
import GenreMap from "./vis/GenreMap";
import TimelineVis from "./vis/TimelineVis";
import { fetchPlaylistTracks, fetchArtists, fetchLikedSongs, fetchUserPlaylists } from "@/lib/spotify-client";
import { getCachedTracks, saveTracksToCache, checkTrackExists, getCachedArtists, saveArtistsToCache } from "@/lib/storage";
import { GenreNode, SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from "@/types/spotify";

export default function Dashboard() {
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);

    // View State
    const [viewTitle, setViewTitle] = useState<string | null>(null);
    const [isLibraryView, setIsLibraryView] = useState(false);
    const [viewMode, setViewMode] = useState<'CLUSTER' | 'TIMELINE'>('CLUSTER');

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

            const genreCounts = new Map<string, {
                count: number;
                artists: Set<string>;
                albums: Set<string>;
                artistTracks: Map<string, number>;
                artistTrackObjects: Map<string, SpotifyTrack[]>; // Store actual tracks
            }>();

            tracks.forEach(track => {
                track.artists.forEach(trackArtist => {
                    const fullArtist = artistMap.get(trackArtist.id);
                    if (fullArtist && fullArtist.genres) {
                        fullArtist.genres.forEach(genre => {
                            const entry = genreCounts.get(genre) || {
                                count: 0,
                                artists: new Set(),
                                albums: new Set(),
                                artistTracks: new Map<string, number>(),
                                artistTrackObjects: new Map<string, SpotifyTrack[]>() // Store actual tracks
                            };
                            entry.count += 1;
                            entry.artists.add(fullArtist.name);
                            if (track.album) {
                                entry.albums.add(track.album.name);
                            }

                            // Track counts and objects per artist for drill-down
                            const currentArtistCount = entry.artistTracks.get(fullArtist.name) || 0;
                            entry.artistTracks.set(fullArtist.name, currentArtistCount + 1);

                            const currentObjects = entry.artistTrackObjects.get(fullArtist.name) || [];
                            currentObjects.push(track);
                            entry.artistTrackObjects.set(fullArtist.name, currentObjects);

                            genreCounts.set(genre, entry);
                        });
                    }
                });
            });

            // 4. Convert to Nodes
            const nodes: GenreNode[] = Array.from(genreCounts.entries()).map(([name, data]) => {
                // Create children nodes (Artists) for drill-down
                const children: GenreNode[] = Array.from(data.artistTracks.entries()).map(([artistName, count]) => ({
                    id: artistName,
                    name: artistName,
                    count: count,
                    artists: [artistName],
                    artistCount: 1,
                    albumCount: 0,
                    tracks: data.artistTrackObjects.get(artistName) || [], // Pass full track list
                    topTracks: []
                })).sort((a, b) => b.count - a.count);

                return {
                    id: name,
                    name,
                    count: data.count,
                    artists: Array.from(data.artists),
                    artistCount: data.artists.size,
                    albumCount: data.albums.size,
                    children: children,
                    topTracks: []
                };
            })
                .sort((a, b) => b.count - a.count)
                .slice(0, 100); // Increased limit for whole library

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

        cancelOperations(); // Cancel previous
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

        cancelOperations(); // Cancel previous
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const signal = abortController.signal;

        setIsLibraryView(true);
        setLoading(true);
        setViewTitle("Your Whole Library");
        setProgress(null);

        try {
            // A. Load Cache First (Instant)
            if (signal.aborted) return;
            setLoadingStatus("Checking cache...");
            const cachedTracks = await getCachedTracks();

            if (cachedTracks.length > 0) {
                if (!signal.aborted) {
                    setLoading(false);
                    processTracks(cachedTracks, "Your Whole Library", signal);
                }
            } else {
                if (!signal.aborted) {
                    setLoadingStatus("Fetching your entire Liked Songs library...");
                    setProgress({ current: 0, total: 100 });
                }
            }

            // B. Sync New Tracks (Background or Foreground)
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

                await processTracks(uniqueTracks, "Your Whole Library", signal);
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
                // Only turn off loading if we failed or finished and nothing is showing
                // (Edge case handling)
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
            // Fetch Profile
            fetch("https://api.spotify.com/v1/me", {
                headers: { Authorization: `Bearer ${session.accessToken} ` },
            })
                .then((res) => res.json())
                .then((data) => setProfile(data));

            // Fetch Playlists using our new paginated helper
            fetchUserPlaylists(session.accessToken).then(setPlaylists);
        }
    }, [session]);


    if (!session) return null;

    // --- RENDER: Detailed View (Genre Map) ---
    if (viewTitle) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                <header className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                cancelOperations(); // Cancel immediately on Back
                                setViewTitle(null);
                                setIsLibraryView(false);
                            }}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold">{viewTitle}</h2>
                            <p className="text-zinc-400 text-xs">
                                {isLibraryView ? "Global Library Analysis" : "Playlist Analysis"}
                            </p>
                        </div>
                    </div>

                    {/* View Switcher */}
                    <div className="flex bg-zinc-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('CLUSTER')}
                            className={`flex items - center gap - 2 px - 4 py - 2 rounded - md text - sm font - medium transition - all ${viewMode === 'CLUSTER' ? "bg-zinc-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                                } `}
                        >
                            <Grid className="w-4 h-4" />
                            Clusters
                        </button>
                        <button
                            onClick={() => setViewMode('TIMELINE')}
                            className={`flex items - center gap - 2 px - 4 py - 2 rounded - md text - sm font - medium transition - all ${viewMode === 'TIMELINE' ? "bg-zinc-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                                } `}
                        >
                            <Activity className="w-4 h-4" />
                            Timeline
                        </button>
                    </div>
                </header>

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
                                            style={{ width: `${(progress.current / (progress.total || 1)) * 100}% ` }}
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
        <div className="w-full max-w-6xl flex flex-col gap-8 mt-8 pb-20">
            {/* Header Stats */}
            <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/50">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-2">
                            {profile?.display_name ? `Hi, ${profile.display_name} ` : "Welcome"}
                        </h2>
                        <p className="text-zinc-400">Visualize your musical landscape.</p>
                    </div>
                    {profile?.images?.[0]?.url && (
                        <img src={profile.images[0].url} className="w-16 h-16 rounded-full border-2 border-zinc-700" alt="Profile" />
                    )}
                </div>

                <div className="flex gap-4">
                    {/* NEW: Whole Library Button */}
                    <button
                        onClick={handleLibraryClick}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-green-900/20"
                    >
                        <Library className="w-6 h-6" />
                        Analyze Whole Library
                    </button>

                    {/* Stats */}
                    <div className="flex items-center gap-2 px-6 py-4 bg-black/20 rounded-xl text-zinc-300">
                        <div className="text-xl font-bold text-white">{playlists.length}</div>
                        <div className="text-sm">Playlists</div>
                    </div>
                </div>
            </div>

            {/* Playlist Grid */}
            <div>
                <h2 className="text-xl font-bold mb-6 px-2">Your Playlists</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {playlists.map((playlist) => (
                        <button
                            key={playlist.id}
                            onClick={() => handlePlaylistClick(playlist)}
                            className="group text-left"
                        >
                            <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden mb-3 shadow-lg group-hover:shadow-green-900/20 group-hover:scale-105 transition-all duration-300 relative">
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
                                        <Music className="w-6 h-6 fill-current" />
                                    </div>
                                </div>
                            </div>
                            <h3 className="font-bold text-white truncate px-1 group-hover:text-green-400 transition-colors">{playlist.name}</h3>
                            <p className="text-xs text-zinc-400 px-1 truncate">{playlist.tracks?.total} tracks</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
