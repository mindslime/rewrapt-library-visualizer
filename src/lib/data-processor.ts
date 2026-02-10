import { getAllLikedSongs, getArtists } from "./spotify/client";
import { SongNode } from "@/types";

export async function processLibrary(accessToken: string): Promise<SongNode[]> {
    // 1. Fetch all songs
    const songs = await getAllLikedSongs(accessToken, 500); // Limit to 500 for initial dev speed, can increase later

    // 2. Extract Artist IDs to fetch Genres
    const artistIds = new Set<string>();
    songs.forEach(song => {
        song.track.artists.forEach(artist => {
            artistIds.add(artist.id);
        });
    });

    // 3. Fetch Artist Details (for Genres)
    const artists = await getArtists(accessToken, Array.from(artistIds));
    const artistMap = new Map(artists.map(a => [a.id, a]));

    // 4. Merge Data (Minus Audio Features)
    const nodes: SongNode[] = songs.map(item => {
        const track = item.track;

        // Aggregate genres from all artists on the track
        const genres = new Set<string>();
        track.artists.forEach(a => {
            const artistDetails = artistMap.get(a.id);
            if (artistDetails) {
                artistDetails.genres.forEach(g => genres.add(g));
            }
        });

        return {
            id: track.id,
            name: track.name,
            artist: track.artists[0].name, // Primary artist
            artistId: track.artists[0].id,
            album: track.album.name,
            genres: Array.from(genres),
            addedAt: item.added_at,
            releaseDate: track.album.release_date,
            popularity: track.popularity,
            previewUrl: track.preview_url,
            image: track.album.images[0]?.url || null,

            // Audio Features are deprecated
            danceability: undefined,
            energy: undefined,
            valence: undefined,
            acousticness: undefined,
            tempo: undefined,
        };
    });

    return nodes;
}
