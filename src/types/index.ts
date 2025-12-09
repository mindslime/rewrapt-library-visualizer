export interface SongNode {
    id: string;
    name: string;
    artist: string;
    artistId: string;
    album: string;
    genres: string[];
    addedAt: string;     // ISO Date string
    releaseDate: string; // ISO Date string (YYYY-MM-DD)
    popularity: number;
    previewUrl: string | null;
    image: string | null;

    // Audio Features
    danceability?: number;
    energy?: number;
    valence?: number;
    acousticness?: number;
    tempo?: number;

    // Layout
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
}

export interface GenreNode {
    id: string;
    name: string;
    count: number;
    x?: number;
    y?: number;
}
