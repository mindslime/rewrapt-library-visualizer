import { SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from "@/types/spotify";

export const DEMO_PROFILE = {
    display_name: "Demo User",
    images: [] as { url: string; height: number; width: number }[], // Empty to trigger placeholder
    id: "demo_user"
};

export const DEMO_PLAYLISTS: SpotifyPlaylist[] = [
    {
        id: "demo_liked",
        name: "Liked Songs",
        description: "Your collection of liked songs (Demo)",
        images: [{ url: "https://misc.scdn.co/liked-songs/liked-songs-640.png", height: 640, width: 640 }],
        tracks: { total: 15, href: "" },
        external_urls: { spotify: "" }
    },
    {
        id: "demo_top_hits",
        name: "Today's Top Hits",
        description: "The hottest tracks right now (Demo)",
        images: [{ url: "https://i.scdn.co/image/ab67706f00000002b0fe40a6e1692822f5a9d8f1", height: 640, width: 640 }],
        tracks: { total: 10, href: "" },
        external_urls: { spotify: "" }
    }
];

// Helper to create a track
const createTrack = (id: string, name: string, artist: string, genres: string[], cover: string = ""): SpotifyTrack & { _artistGenres: string[] } => ({
    id,
    name,
    artists: [{ id: `art_${id}`, name: artist }],
    duration_ms: 180000,
    popularity: 80,
    preview_url: null,
    uri: `spotify:track:${id}`,
    external_urls: { spotify: "" },
    added_at: new Date().toISOString(),
    album: {
        name: `${name} Single`,
        images: cover ? [{ url: cover, height: 640, width: 640 }] : [],
        uri: "",
        release_date: "2023"
    },
    // Custom property to help our transform function in demo mode
    _artistGenres: genres
});

export const DEMO_TRACKS: (SpotifyTrack & { _artistGenres: string[] })[] = [
    // Pop
    createTrack("1", "Cruel Summer", "Taylor Swift", ["pop", "synth-pop"]),
    createTrack("2", "As It Was", "Harry Styles", ["pop", "rock"]),
    createTrack("3", "Flowers", "Miley Cyrus", ["pop", "disco"]),

    // Rock
    createTrack("4", "Smells Like Teen Spirit", "Nirvana", ["grunge", "rock", "alternative rock"]),
    createTrack("5", "Mr. Brightside", "The Killers", ["indie rock", "modern rock"]),
    createTrack("6", "Everlong", "Foo Fighters", ["rock", "alternative rock"]),

    // Hip Hop
    createTrack("7", "God's Plan", "Drake", ["hip hop", "rap", "canadian hip hop"]),
    createTrack("8", "SICKO MODE", "Travis Scott", ["hip hop", "rap"]),
    createTrack("9", "HUMBLE.", "Kendrick Lamar", ["hip hop", "rap", "conscious hip hop"]),

    // Electronic
    createTrack("10", "Get Lucky", "Daft Punk", ["disco", "electronic", "french house"]),
    createTrack("11", "Clarity", "Zedd", ["edm", "pop dance", "german techno"]),
    createTrack("12", "Levels", "Avicii", ["edm", "progressive house"]),

    // Jazz
    createTrack("13", "Take Five", "Dave Brubeck", ["jazz", "cool jazz"]),
    createTrack("14", "So What", "Miles Davis", ["jazz", "cool jazz", "hard bop"]),

    // Country
    createTrack("15", "Tennessee Whiskey", "Chris Stapleton", ["country", "country rock", "soul"]),
];

export const DEMO_ARTISTS: SpotifyArtist[] = DEMO_TRACKS.map(t => ({
    id: `art_${t.id}`,
    name: t.artists[0].name,
    genres: t._artistGenres,
    images: t.album.images,
    popularity: 80
}));
