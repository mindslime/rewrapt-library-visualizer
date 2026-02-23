/**
 * Demo Playlist Definitions
 * Playlists with genre-based track filtering for the demo mode.
 */

import { SpotifyPlaylist, SpotifyTrack } from "@/types/spotify";

// Genre sets for each playlist's filtering
const PLAYLIST_GENRE_FILTERS: Record<string, { include: string[]; exclude?: string[] }> = {
    demo_top_hits: {
        include: ["pop", "dance-pop", "k-pop", "hip hop", "reggaeton", "synth-pop", "electropop", "pop rock"],
    },
    demo_chill_vibes: {
        include: ["lo-fi", "ambient", "jazz", "acoustic", "classical", "chillhop", "indie folk", "cool jazz", "dream pop", "new age", "chillwave", "piano", "vocal jazz", "contemporary classical"],
    },
    demo_workout: {
        include: ["metal", "rock", "edm", "electronic", "hip hop", "rap", "punk", "dance", "trap", "nu metal", "hard rock", "thrash metal", "dubstep", "punk rock"],
        exclude: ["lo-fi", "chillhop", "ambient", "classical", "cool jazz", "dream pop"],
    },
    demo_latin: {
        include: ["latin", "reggaeton", "latin pop", "trap latino", "colombian pop", "flamenco pop"],
    },
    demo_discover: {
        include: ["indie pop", "indie rock", "alternative r&b", "psychedelic rock", "art pop", "dream pop", "indie folk", "garage rock", "post-punk", "indie electronic", "future bass", "chillwave", "psychedelic pop", "baroque pop"],
    },
    demo_rock_classics: {
        include: ["classic rock", "rock", "hard rock", "grunge", "alternative rock", "progressive rock", "funk rock", "blues rock", "art rock"],
    },
    demo_jazz_essentials: {
        include: ["jazz", "cool jazz", "hard bop", "vocal jazz", "bebop", "free jazz", "swing", "acid jazz", "spiritual jazz"],
    },
    demo_electronic_mix: {
        include: ["edm", "electronic", "progressive house", "dubstep", "house", "uk garage", "tropical house", "french house", "electro house", "future bass", "indie electronic"],
    },
    demo_kpop_faves: {
        include: ["k-pop", "k-pop girl group", "boy band"],
    },
    demo_classical_focus: {
        include: ["classical", "baroque", "romantic", "impressionism", "orchestral", "piano", "cello", "contemporary classical"],
    },
    demo_rnb_soul: {
        include: ["r&b", "soul", "alternative r&b", "funk", "motown", "classic soul", "neo-soul"],
    },
    demo_country_roads: {
        include: ["country", "country rock", "country pop", "classic country", "americana"],
    },
};

export const DEMO_PLAYLISTS: SpotifyPlaylist[] = [
    {
        id: "demo_liked",
        name: "Liked Songs",
        description: "Your collection of liked songs (Demo)",
        images: [{ url: "https://misc.scdn.co/liked-songs/liked-songs-640.png", height: 640, width: 640 }],
        tracks: { total: 5000, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_top_hits",
        name: "Today's Top Hits",
        description: "The hottest tracks right now (Demo)",
        images: [{ url: "/demo/top_hits.png", height: 640, width: 640 }],
        tracks: { total: 800, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_chill_vibes",
        name: "Chill Vibes",
        description: "Relaxing lo-fi and acoustic tracks to wind down (Demo)",
        images: [{ url: "/demo/chill_vibes.png", height: 640, width: 640 }],
        tracks: { total: 600, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_workout",
        name: "Workout Mix",
        description: "High energy EDM and Rock to get you moving (Demo)",
        images: [{ url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=640&q=80", height: 640, width: 640 }],
        tracks: { total: 700, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_latin",
        name: "Viva Latino",
        description: "Today's top Latin hits, elevando tu vibra (Demo)",
        images: [{ url: "/demo/viva_latino.png", height: 640, width: 640 }],
        tracks: { total: 400, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_discover",
        name: "Discover Weekly",
        description: "Your personal mixtape of fresh indie and alt tracks (Demo)",
        images: [{ url: "/demo/discover_weekly.png", height: 640, width: 640 }],
        tracks: { total: 500, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_rock_classics",
        name: "Rock Classics",
        description: "The greatest rock anthems of all time (Demo)",
        images: [{ url: "/demo/rock_classics.png", height: 640, width: 640 }],
        tracks: { total: 600, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_jazz_essentials",
        name: "Jazz Essentials",
        description: "Timeless jazz from the masters (Demo)",
        images: [{ url: "/demo/jazz_essentials.png", height: 640, width: 640 }],
        tracks: { total: 300, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_electronic_mix",
        name: "Electronic Mix",
        description: "The best of EDM, house, and electronic (Demo)",
        images: [{ url: "/demo/electronic_mix.png", height: 640, width: 640 }],
        tracks: { total: 500, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_kpop_faves",
        name: "K-Pop Favorites",
        description: "The biggest K-Pop hits and rising stars (Demo)",
        images: [{ url: "/demo/kpop_favorites.png", height: 640, width: 640 }],
        tracks: { total: 300, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_classical_focus",
        name: "Classical Focus",
        description: "Concentration-enhancing classical masterpieces (Demo)",
        images: [{ url: "/demo/classical_focus.png", height: 640, width: 640 }],
        tracks: { total: 250, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_rnb_soul",
        name: "R&B & Soul",
        description: "Smooth grooves from past and present (Demo)",
        images: [{ url: "/demo/rnb_soul.png", height: 640, width: 640 }],
        tracks: { total: 500, href: "" },
        external_urls: { spotify: "" },
    },
    {
        id: "demo_country_roads",
        name: "Country Roads",
        description: "The best of country, old and new (Demo)",
        images: [{ url: "/demo/country_roads.png", height: 640, width: 640 }],
        tracks: { total: 250, href: "" },
        external_urls: { spotify: "" },
    },
];

type TrackWithGenres = SpotifyTrack & { _artistGenres: string[] };

export function getDemoPlaylistTracks(playlistId: string, allTracks: TrackWithGenres[]): TrackWithGenres[] {
    const filter = PLAYLIST_GENRE_FILTERS[playlistId];

    if (!filter || playlistId === "demo_liked") {
        return allTracks;
    }

    return allTracks.filter((t) => {
        const hasInclude = t._artistGenres.some((g) => filter.include.includes(g));
        const hasExclude = filter.exclude ? t._artistGenres.some((g) => filter.exclude!.includes(g)) : false;
        return hasInclude && !hasExclude;
    });
}
