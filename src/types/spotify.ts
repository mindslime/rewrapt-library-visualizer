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
    added_at?: string; // Date string
    uri: string;
    external_urls: {
        spotify: string;
    };
    album: {
        name: string;
        images: SpotifyImage[];
        uri: string; // Add album URI too
    };
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
}
