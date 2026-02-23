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

    // ─── Genre Discovery Eras ──────────────────────────────
    // Simulate how people discover genres over time: each genre gets
    // a "peak era" where listening activity is concentrated, creating
    // realistic rises and falls in the timeline streamgraph.
    const genreEras = new Map<string, { peakDaysAgo: number; spread: number }>();
    const allGenres = new Set<string>();
    for (const artist of ARTIST_CATALOG) {
        artist.genres.forEach(g => allGenres.add(g));
    }

    // Assign each genre a peak era (deterministic via rng)
    const maxDaysAgo = 1460; // ~4 years for richer timeline
    for (const genre of allGenres) {
        const peakDaysAgo = Math.floor(rng() * maxDaysAgo);
        // Spread: how long the "discovery phase" lasts (60-300 days)
        const spread = 60 + Math.floor(rng() * 240);
        genreEras.set(genre, { peakDaysAgo, spread });
    }

    // Fixed reference date for deterministic output (Feb 2026)
    const referenceDate = new Date(2026, 1, 20); // Feb 20, 2026

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

        // ─── Date Generation ───────────────────────────────
        // Blend two signals: overall recency bias + genre era clustering
        //
        // 1. Recency bias: Math.pow(x, 2.5) skews toward 0 (recent)
        //    x in [0,1], pow(x, 2.5) biases toward 0
        const recencyBase = Math.floor(Math.pow(rng(), 2.5) * maxDaysAgo);

        // 2. Genre era clustering: pull the date toward the genre's peak era
        //    Use the artist's primary genre for era calculation
        const primaryGenre = artist.genres[0];
        const era = genreEras.get(primaryGenre) || { peakDaysAgo: maxDaysAgo / 2, spread: 180 };
        // Gaussian-ish sample around the era peak using Box-Muller transform
        const u1 = Math.max(0.0001, rng()); // avoid log(0)
        const u2 = rng();
        const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const eraSample = Math.floor(era.peakDaysAgo + gaussian * era.spread);
        const eraClampedSample = Math.max(0, Math.min(maxDaysAgo, eraSample));

        // 3. Blend: 40% recency, 60% era clustering
        const blendWeight = 0.4 + rng() * 0.2; // 0.4 - 0.6 recency weight, varies per track
        const daysAgo = Math.max(0, Math.min(maxDaysAgo, Math.floor(
            blendWeight * recencyBase + (1 - blendWeight) * eraClampedSample
        )));

        const addedAt = new Date(referenceDate);
        addedAt.setDate(addedAt.getDate() - daysAgo);
        // Add hour/minute variance
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
