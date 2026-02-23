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
        tracks: { total: 35, href: "" },
        external_urls: { spotify: "" }
    },
    {
        id: "demo_top_hits",
        name: "Today's Top Hits",
        description: "The hottest tracks right now (Demo)",
        images: [{ url: "https://i.scdn.co/image/ab67706f00000002b0fe40a6e1692822f5a9d8f1", height: 640, width: 640 }],
        tracks: { total: 20, href: "" },
        external_urls: { spotify: "" }
    },
    {
        id: "demo_chill_vibes",
        name: "Chill Vibes",
        description: "Relaxing lo-fi and acoustic tracks to wind down (Demo)",
        images: [{ url: "/demo/chill_vibes.png", height: 640, width: 640 }],
        tracks: { total: 15, href: "" },
        external_urls: { spotify: "" }
    },
    {
        id: "demo_workout",
        name: "Workout Mix",
        description: "High energy EDM and Rock to get you moving (Demo)",
        images: [{ url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=640&q=80", height: 640, width: 640 }],
        tracks: { total: 25, href: "" },
        external_urls: { spotify: "" }
    },
    {
        id: "demo_latin",
        name: "Viva Latino",
        description: "Today's top Latin hits, elevando tu vibra (Demo)",
        images: [{ url: "/demo/viva_latino.png", height: 640, width: 640 }],
        tracks: { total: 30, href: "" },
        external_urls: { spotify: "" }
    }
];

// Helper to create a track
const createTrack = (id: string, name: string, artist: string, genres: string[], cover: string = ""): SpotifyTrack & { _artistGenres: string[] } => {
    // Spread dates out based on ID so the timeline functions properly
    const daysAgo = parseInt(id) * 7 || Math.floor(Math.random() * 100);
    const addedAt = new Date();
    addedAt.setDate(addedAt.getDate() - daysAgo);

    return {
        id,
        name,
        artists: [{ id: `art_${id}`, name: artist }],
        duration_ms: 180000,
        popularity: 80,
        preview_url: null,
        uri: `spotify:track:${id}`,
        external_urls: { spotify: "" },
        added_at: addedAt.toISOString(),
        album: {
            name: `${name} Single`,
            images: cover ? [{ url: cover, height: 640, width: 640 }] : [],
            uri: "",
            release_date: "2023"
        },
        // Custom property to help our transform function in demo mode
        _artistGenres: genres
    };
};

export const DEMO_TRACKS: (SpotifyTrack & { _artistGenres: string[] })[] = [
    // Pop
    createTrack("1", "Cruel Summer", "Taylor Swift", ["pop", "synth-pop"]),
    createTrack("2", "As It Was", "Harry Styles", ["pop", "rock"]),
    createTrack("3", "Flowers", "Miley Cyrus", ["pop", "disco"]),
    createTrack("16", "Blinding Lights", "The Weeknd", ["pop", "synth-pop", "r&b"]),
    createTrack("17", "Levitating", "Dua Lipa", ["pop", "dance-pop", "disco"]),
    createTrack("18", "Watermelon Sugar", "Harry Styles", ["pop", "rock"]),

    // Rock & Metal
    createTrack("4", "Smells Like Teen Spirit", "Nirvana", ["grunge", "rock", "alternative rock"]),
    createTrack("5", "Mr. Brightside", "The Killers", ["indie rock", "modern rock"]),
    createTrack("6", "Everlong", "Foo Fighters", ["rock", "alternative rock"]),
    createTrack("19", "Master of Puppets", "Metallica", ["metal", "thrash metal", "rock"]),
    createTrack("20", "Chop Suey!", "System Of A Down", ["alternative metal", "nu metal", "rock"]),
    createTrack("21", "Bohemian Rhapsody", "Queen", ["classic rock", "rock"]),

    // Hip Hop
    createTrack("7", "God's Plan", "Drake", ["hip hop", "rap", "canadian hip hop"]),
    createTrack("8", "SICKO MODE", "Travis Scott", ["hip hop", "rap"]),
    createTrack("9", "HUMBLE.", "Kendrick Lamar", ["hip hop", "rap", "conscious hip hop"]),
    createTrack("22", "Alright", "Kendrick Lamar", ["hip hop", "rap", "conscious hip hop"]),
    createTrack("23", "N.Y. State of Mind", "Nas", ["hip hop", "east coast hip hop"]),

    // Electronic & Lo-Fi
    createTrack("10", "Get Lucky", "Daft Punk", ["disco", "electronic", "french house"]),
    createTrack("11", "Clarity", "Zedd", ["edm", "pop dance", "german techno"]),
    createTrack("12", "Levels", "Avicii", ["edm", "progressive house"]),
    createTrack("24", "Strobe", "deadmau5", ["electronic", "progressive house"]),
    createTrack("25", "Coffee Cold", "Galt MacDermot", ["lo-fi", "jazz", "electronic"]),
    createTrack("26", "Aruarian Dance", "Nujabes", ["chillhop", "lo-fi", "electronic"]),

    // Jazz & Blues
    createTrack("13", "Take Five", "Dave Brubeck", ["jazz", "cool jazz"]),
    createTrack("14", "So What", "Miles Davis", ["jazz", "cool jazz", "hard bop"]),
    createTrack("27", "Feeling Good", "Nina Simone", ["vocal jazz", "blues", "soul"]),
    createTrack("28", "The Thrill Is Gone", "B.B. King", ["blues", "electric blues"]),

    // Folk, Country & Acoustic
    createTrack("15", "Tennessee Whiskey", "Chris Stapleton", ["country", "country rock", "soul"]),
    createTrack("29", "Jolene", "Dolly Parton", ["country", "classic country"]),
    createTrack("30", "Fast Car", "Tracy Chapman", ["folk", "singer-songwriter", "acoustic"]),
    createTrack("31", "Skinny Love", "Bon Iver", ["indie folk", "acoustic", "singer-songwriter"]),

    // Classical & Orchestral
    createTrack("32", "Clair de Lune", "Claude Debussy", ["classical", "impressionism", "piano"]),
    createTrack("33", "Symphony No. 5", "Ludwig van Beethoven", ["classical", "orchestral"]),
    createTrack("34", "The Four Seasons: Spring", "Antonio Vivaldi", ["classical", "baroque"]),

    // Soul, R&B, Funk
    createTrack("35", "Superstition", "Stevie Wonder", ["soul", "funk", "motown"]),
    createTrack("36", "What's Going On", "Marvin Gaye", ["soul", "classic soul", "r&b"]),
    createTrack("37", "September", "Earth, Wind & Fire", ["disco", "soul", "funk"]),

    // Latin & Reggaeton
    createTrack("38", "Despacito", "Luis Fonsi", ["latin", "reggaeton", "pop"]),
    createTrack("39", "Danza Kuduro", "Don Omar", ["latin pop", "reggaeton", "dance"]),
    createTrack("40", "Hips Don't Lie", "Shakira", ["latin pop", "colombian pop", "dance pop"]),
    createTrack("41", "Un Verano Sin Ti", "Bad Bunny", ["reggaeton", "latin", "trap latino"]),

    // K-Pop & J-Pop
    createTrack("42", "Dynamite", "BTS", ["k-pop", "pop", "boy band"]),
    createTrack("43", "How You Like That", "BLACKPINK", ["k-pop", "k-pop girl group", "pop"]),
    createTrack("44", "Racing Into The Night", "YOASOBI", ["j-pop", "anime"]),

    // Alt/Indie/Ambient
    createTrack("45", "Weightless", "Marconi Union", ["ambient", "new age", "electronic"]),
    createTrack("46", "Midnight City", "M83", ["indie pop", "synth-pop", "electronic"]),
    createTrack("47", "Take Me Out", "Franz Ferdinand", ["indie rock", "garage rock", "post-punk revival"]),
    createTrack("48", "Dog Days Are Over", "Florence + The Machine", ["indie pop", "art pop", "baroque pop"]),
    createTrack("49", "Clocks", "Coldplay", ["piano rock", "alternative rock", "pop rock"]),

    // Reggae & Dub
    createTrack("50", "Three Little Birds", "Bob Marley & The Wailers", ["reggae", "roots reggae", "ska"]),
    createTrack("51", "Santeria", "Sublime", ["ska punk", "reggae rock", "punk"]),
];

export const DEMO_ARTISTS: SpotifyArtist[] = DEMO_TRACKS.map(t => ({
    id: `art_${t.id}`,
    name: t.artists[0].name,
    genres: t._artistGenres,
    images: t.album.images,
    popularity: 80
}));

export const getDemoPlaylistTracks = (playlistId: string) => {
    switch (playlistId) {
        case "demo_top_hits":
            return DEMO_TRACKS.filter(t => t._artistGenres.some(g => ["pop", "k-pop", "hip hop", "dance pop", "reggaeton"].includes(g)));
        case "demo_chill_vibes":
            return DEMO_TRACKS.filter(t => t._artistGenres.some(g => ["lo-fi", "ambient", "jazz", "acoustic", "classical", "chillhop", "indie folk"].includes(g)));
        case "demo_workout":
            return DEMO_TRACKS.filter(t => t._artistGenres.some(g => ["metal", "rock", "edm", "electronic", "hip hop", "rap", "punk", "dance"].includes(g) && !["lo-fi", "chillhop", "ambient"].includes(g)));
        case "demo_latin":
            return DEMO_TRACKS.filter(t => t._artistGenres.some(g => ["latin", "reggaeton", "latin pop"].includes(g)));
        case "demo_liked":
        default:
            return DEMO_TRACKS;
    }
};
