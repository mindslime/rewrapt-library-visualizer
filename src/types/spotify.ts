export interface SpotifyImage {
    url: string;
    height: number;
    width: number;
}

export interface SpotifyArtist {
    id: string;
    name: string;
    genres: string[];
    images: SpotifyImage[];
    popularity: number;
}

export interface SpotifyTrack {
    id: string;
    name: string;
    artists: { id: string; name: string }[];
    duration_ms: number;
    popularity: number;
    preview_url: string | null;
    explicit?: boolean;
    added_at?: string; // Date string
    uri: string;
    is_local?: boolean;
    external_urls: {
        spotify: string;
    };
    album: {
        name: string;
        images: SpotifyImage[];
        uri: string; // Add album URI too
        release_date: string;
    };
    audio_features?: SpotifyAudioFeatures;
}

export interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string;
    images: SpotifyImage[];
    tracks: {
        total: number;
        href: string;
    };
    external_urls: {
        spotify: string;
    };
}

export interface GenreNode {
    id: string; // genre name
    name: string;
    count: number;
    artists: string[]; // artist names contributing to this genre
    artistCount: number;
    albumCount: number;
    children?: GenreNode[]; // Drill-down nodes (artists)
    tracks?: SpotifyTrack[]; // All tracks for this node (used for artist popup)
    topTracks: SpotifyTrack[]; // sample tracks for this genre
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    color?: string;
}

export interface SpotifyAudioFeatures {
    danceability: number;
    energy: number;
    key: number;
    loudness: number;
    mode: number;
    speechiness: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    valence: number;
    tempo: number;
    type: "audio_features";
    id: string;
    uri: string;
    track_href: string;
    analysis_url: string;
    duration_ms: number;
    time_signature: number;
}
