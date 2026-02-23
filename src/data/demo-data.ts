/**
 * Demo Data — Barrel Export
 *
 * All demo data is generated procedurally from a large artist catalog.
 * See ./demo/ for the underlying data and logic.
 */

import { SpotifyArtist } from "@/types/spotify";
import { generateDemoTracks } from "./demo/generator";
import { DEMO_PLAYLISTS as _DEMO_PLAYLISTS, getDemoPlaylistTracks as _getDemoPlaylistTracks } from "./demo/playlists";

// ─── Profile ───────────────────────────────────────────────
export const DEMO_PROFILE = {
    display_name: "Demo User",
    images: [] as { url: string; height: number; width: number }[], // Empty to trigger placeholder
    id: "demo_user",
};

// ─── Tracks (generated once at import time) ────────────────
export const DEMO_TRACKS = generateDemoTracks(5000);

// ─── Artists (derived from tracks) ─────────────────────────
// Deduplicated by artist ID
const artistMap = new Map<string, SpotifyArtist>();
for (const t of DEMO_TRACKS) {
    const artistId = t.artists[0].id;
    if (!artistMap.has(artistId)) {
        artistMap.set(artistId, {
            id: artistId,
            name: t.artists[0].name,
            genres: t._artistGenres,
            images: t.album.images,
            popularity: t.popularity,
        });
    }
}
export const DEMO_ARTISTS: SpotifyArtist[] = Array.from(artistMap.values());

// ─── Playlists ─────────────────────────────────────────────
export const DEMO_PLAYLISTS = _DEMO_PLAYLISTS;

export const getDemoPlaylistTracks = (playlistId: string) => {
    return _getDemoPlaylistTracks(playlistId, DEMO_TRACKS);
};
