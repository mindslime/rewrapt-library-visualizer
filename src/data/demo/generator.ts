/**
 * Demo Track Generator
 * Procedurally generates thousands of realistic tracks from the artist catalog.
 */

import { SpotifyTrack } from "@/types/spotify";
import { ARTIST_CATALOG, DemoArtistEntry } from "./artists";

// Simple seeded PRNG for deterministic output
function createRng(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

export function generateDemoTracks(count: number): (SpotifyTrack & { _artistGenres: string[] })[] {
    const rng = createRng(42);
    const tracks: (SpotifyTrack & { _artistGenres: string[] })[] = [];
    const usedIds = new Set<string>();

    // Flatten artist catalog into weighted pool (more popular artists appear more often)
    const weightedPool: DemoArtistEntry[] = [];
    for (const artist of ARTIST_CATALOG) {
        const pop = artist.popularity ?? 75;
        // Artists get 1-4 copies in the pool based on popularity
        const copies = Math.max(1, Math.round(pop / 30));
        for (let c = 0; c < copies; c++) {
            weightedPool.push(artist);
        }
    }

    // Date distribution: more recent tracks are more likely
    // Span: ~2 years (730 days)
    const now = new Date();
    const maxDaysAgo = 730;

    for (let i = 0; i < count; i++) {
        // Pick a random artist from weighted pool
        const artist = weightedPool[Math.floor(rng() * weightedPool.length)];

        // Pick a random song from the artist
        const songIdx = Math.floor(rng() * artist.songs.length);
        const songName = artist.songs[songIdx];

        // Generate unique ID
        let id: string;
        let attempt = 0;
        do {
            id = `demo_${i}_${attempt}`;
            attempt++;
        } while (usedIds.has(id));
        usedIds.add(id);

        // Generate added_at with recency bias (exponential distribution)
        // Most tracks added recently, fewer from long ago
        const recencyFactor = rng();
        const daysAgo = Math.floor(Math.pow(recencyFactor, 0.6) * maxDaysAgo);
        const addedAt = new Date(now);
        addedAt.setDate(addedAt.getDate() - daysAgo);
        // Add some hour/minute variance
        addedAt.setHours(Math.floor(rng() * 24));
        addedAt.setMinutes(Math.floor(rng() * 60));

        // Popularity with some variance
        const basePop = artist.popularity ?? 75;
        const popularity = Math.min(100, Math.max(30, basePop + Math.floor((rng() - 0.5) * 20)));

        // Duration between 2:30 and 6:00 min
        const durationMs = Math.floor((150 + rng() * 210) * 1000);

        // Album name: use song name + " - Single" or " (Album)" variation
        const albumVariants = [`${songName} - Single`, `${songName} (Deluxe)`, `${artist.name}: Greatest Hits`, `${songName} EP`, `The Best of ${artist.name}`];
        const albumName = albumVariants[Math.floor(rng() * albumVariants.length)];

        // Release date spread across recent years
        const releaseYear = 2018 + Math.floor(rng() * 8); // 2018-2025
        const releaseMonth = String(1 + Math.floor(rng() * 12)).padStart(2, "0");
        const releaseDay = String(1 + Math.floor(rng() * 28)).padStart(2, "0");

        const track: SpotifyTrack & { _artistGenres: string[] } = {
            id,
            name: songName,
            artists: [{ id: `art_${artist.name.replace(/\s+/g, "_").toLowerCase()}`, name: artist.name }],
            duration_ms: durationMs,
            popularity,
            preview_url: null,
            uri: `spotify:track:${id}`,
            external_urls: { spotify: "" },
            added_at: addedAt.toISOString(),
            album: {
                name: albumName,
                images: [], // No album art for generated tracks — keeps bundle small
                uri: "",
                release_date: `${releaseYear}-${releaseMonth}-${releaseDay}`,
            },
            _artistGenres: artist.genres,
        };

        tracks.push(track);
    }

    return tracks;
}
