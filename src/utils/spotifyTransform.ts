import { SpotifyTrack, GenreNode } from "@/types/spotify";

// The 7 Pillars of the Musical Fingerprint
export type PillarType =
    | 'Pop'
    | 'Rock'
    | 'R&B/Hip-Hop'
    | 'Electronic'
    | 'Jazz/Blues'
    | 'Folk/Country'
    | 'Classical';

export const PILLARS: PillarType[] = [
    'Pop',
    'Rock',
    'R&B/Hip-Hop',
    'Electronic',
    'Jazz/Blues',
    'Folk/Country',
    'Classical'
];

interface PillarWeights {
    [key: string]: number; // key is PillarType, value is 0-1
}

// Normalized Coordinate System for the Pillars (Unit Circle)
// We arrange them evenly around the circle starting from top (Pop?)
export const PILLAR_COORDINATES: Record<PillarType, { x: number, y: number, color: string }> = {
    'Pop': { x: 0, y: -1, color: '#FFD700' }, // Yellow (Top)
    'Rock': { x: 0.78, y: -0.62, color: '#FF0000' }, // Red
    'R&B/Hip-Hop': { x: 0.97, y: 0.22, color: '#FF00FF' }, // Magenta
    'Electronic': { x: 0.43, y: 0.9, color: '#00FFFF' }, // Cyan
    'Jazz/Blues': { x: -0.43, y: 0.9, color: '#0000FF' }, // Blue
    'Folk/Country': { x: -0.97, y: 0.22, color: '#00FF00' }, // Green
    'Classical': { x: -0.78, y: -0.62, color: '#FFFFFF' }, // White
};
// Note: Arranged roughly 360/7 degrees apart. 
// 0deg = -PI/2 (Top).
// Angles: -90, -38.5, 12.8, 64.2, 115.7, 167.1, 218.5 (approx)

/**
 * Maps a specific genre string to our 7 Pillars with weights.
 * This is a Heuristic Dictionary.
 */
export function mapGenreToPillar(genre: string): PillarWeights {
    const g = genre.toLowerCase();

    // 1. Exact/Strong Matches

    // HIP-HOP / R&B (Priority: High, to catch Trap/Soul before Electronic)
    if (g.includes('hip hop') || g.includes('rap') || g.includes('r&b') || g.includes('trap') || g.includes('drill') || g.includes('grime')) {
        if (g.includes('jazz') || g.includes('neo')) return { 'R&B/Hip-Hop': 0.6, 'Jazz/Blues': 0.4 };
        if (g.includes('pop')) return { 'R&B/Hip-Hop': 0.5, 'Pop': 0.5 };
        // "Trap" can be EDM, but in modern context usually Rap. 
        // If it explicitly says "edm trap" or "electronic trap", we might want to split, but for now stick to Hip Hop core.
        return { 'R&B/Hip-Hop': 1 };
    }

    if (g.includes('soul') || g.includes('funk') || g.includes('disco')) {
        if (g.includes('neo')) return { 'R&B/Hip-Hop': 0.7, 'Jazz/Blues': 0.3 };
        if (g.includes('pop')) return { 'Pop': 0.6, 'R&B/Hip-Hop': 0.4 };
        // Disco is bridge between R&B and Electronic
        if (g.includes('disco')) return { 'R&B/Hip-Hop': 0.4, 'Electronic': 0.6 };
        return { 'R&B/Hip-Hop': 0.8, 'Jazz/Blues': 0.2 };
    }

    // POP
    if (g.includes('pop')) {
        if (g.includes('indie')) return { 'Pop': 0.6, 'Rock': 0.4 };
        if (g.includes('synth') || g.includes('elect')) return { 'Pop': 0.5, 'Electronic': 0.5 };
        if (g.includes('rap') || g.includes('hop')) return { 'Pop': 0.5, 'R&B/Hip-Hop': 0.5 };
        if (g.includes('punk')) return { 'Pop': 0.4, 'Rock': 0.6 };
        return { 'Pop': 1 };
    }

    // ROCK / METAL
    if (g.includes('rock') || g.includes('metal') || g.includes('punk') || g.includes('grunge')) {
        if (g.includes('soft') || g.includes('folk')) return { 'Rock': 0.5, 'Folk/Country': 0.5 };
        if (g.includes('electronic') || g.includes('industrial')) return { 'Rock': 0.5, 'Electronic': 0.5 };
        if (g.includes('psychedelic')) return { 'Rock': 0.7, 'Electronic': 0.3 };
        return { 'Rock': 1 };
    }

    // ELECTRONIC
    if (g.includes('electronic') || g.includes('edm') || g.includes('house') || g.includes('techno') || g.includes('dance') || g.includes('trance') || g.includes('dubstep') || g.includes('bass')) {
        if (g.includes('pop')) return { 'Electronic': 0.6, 'Pop': 0.4 };
        if (g.includes('rock')) return { 'Electronic': 0.6, 'Rock': 0.4 }; // Indietronica
        if (g.includes('ambient')) return { 'Electronic': 0.8, 'Classical': 0.2 };
        return { 'Electronic': 1 };
    }

    // JAZZ / BLUES
    if (g.includes('jazz') || g.includes('blues') || g.includes('bossa') || g.includes('swing')) {
        if (g.includes('r&b')) return { 'Jazz/Blues': 0.6, 'R&B/Hip-Hop': 0.4 };
        if (g.includes('pop')) return { 'Jazz/Blues': 0.4, 'Pop': 0.6 }; // Vocal jazz
        return { 'Jazz/Blues': 1 };
    }

    // FOLK / COUNTRY
    if (g.includes('country') || g.includes('folk') || g.includes('americana') || g.includes('bluegrass') || g.includes('acoustic') || g.includes('roots')) {
        if (g.includes('rock')) return { 'Folk/Country': 0.6, 'Rock': 0.4 };
        if (g.includes('indie')) return { 'Folk/Country': 0.7, 'Pop': 0.3 };
        return { 'Folk/Country': 1 };
    }

    // CLASSICAL
    if (g.includes('classical') || g.includes('orchestra') || g.includes('piano') || g.includes('soundtrack') || g.includes('score') || g.includes('baroque')) {
        if (g.includes('ambient')) return { 'Classical': 0.5, 'Electronic': 0.5 };
        return { 'Classical': 1 };
    }

    // 2. Fallbacks / Keywords
    if (g.includes('indie')) return { 'Rock': 0.6, 'Pop': 0.4 }; // Generic Indie -> Rock/Pop
    if (g.includes('alternative')) return { 'Rock': 0.7, 'Pop': 0.3 };
    if (g.includes('ambient') || g.includes('chill')) return { 'Electronic': 0.8, 'Classical': 0.2 };
    if (g.includes('latin') || g.includes('reggaeton')) return { 'Pop': 0.5, 'R&B/Hip-Hop': 0.5 };
    if (g.includes('reggae')) return { 'R&B/Hip-Hop': 0.7, 'Pop': 0.3 };
    if (g.includes('singer-songwriter')) return { 'Folk/Country': 0.7, 'Pop': 0.3 };

    // Lo-Fi Specific
    if (g.includes('lo-fi')) return { 'R&B/Hip-Hop': 0.4, 'Electronic': 0.4, 'Jazz/Blues': 0.2 };

    // Default to Center (or distribution?)
    // Unknown genres drift to center-top (Pop/Rock mix)
    return { 'Pop': 0.5, 'Rock': 0.5 };
}

/**
 * Calculates the Normalized Target Position (x, y in -1 to 1 range)
 * based on the weighted pillars.
 */
function calculateTargetPosition(weights: PillarWeights): { x: number, y: number, colorWeights: PillarWeights } {
    let x = 0;
    let y = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([pillar, weight]) => {
        const coords = PILLAR_COORDINATES[pillar as PillarType];
        if (coords) {
            x += coords.x * weight;
            y += coords.y * weight;
            totalWeight += weight;
        }
    });

    if (totalWeight > 0) {
        x /= totalWeight;
        y /= totalWeight;
    }

    return { x, y, colorWeights: weights };
}

/**
 * Interpolates color based on pillar weights
 */
export function interpolatePillarColor(weights: PillarWeights): string {
    let r = 0, g = 0, b = 0, total = 0;

    Object.entries(weights).forEach(([pillar, weight]) => {
        const hex = PILLAR_COORDINATES[pillar as PillarType]?.color;
        if (hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (result) {
                r += parseInt(result[1], 16) * weight;
                g += parseInt(result[2], 16) * weight;
                b += parseInt(result[3], 16) * weight;
                total += weight;
            }
        }
    });

    if (total > 0) {
        r = Math.round(r / total);
        g = Math.round(g / total);
        b = Math.round(b / total);
    }

    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Main Transformation Function
 */
export function transformSpotifyData(songs: SpotifyTrack[]): GenreNode[] {
    const genreMap = new Map<string, GenreNode>();

    // 1. Aggregate
    songs.forEach(song => {
        song.artists.forEach(artistRef => {
            // We need the Full Artist Object to get genres. 
            // BUT, transformSpotifyData assumes we have enriched data or we pass in a mapping?
            // The previous implementation had 'processTracks' in Dashboard that did this.
            // Here, we receive 'songs' which might NOT have genres attached directly if they are just SpotifyTrack?
            // SpotifyTrack in types.ts doesn't have genres. SpotifyArtist does.
            // 
            // Issue: SpotifyTrack only has 'artists: { id, name }[]'. 
            // We need a way to look up genres.
            //
            // Solution: We should pass in the Artist Map or assume 'songs' is not enough.
            // Let's UPDATE the function signature to take an Artist Map.
        });
    });

    return [];
}

// REDEFINED due to data dependency:
export function transformTracksToNodes(
    tracks: SpotifyTrack[],
    artistMap: Map<string, { genres: string[] }>
): GenreNode[] {
    const genreGroups = new Map<string, {
        count: number;
        artists: Set<string>;
        topTracks: SpotifyTrack[];
        tracks: SpotifyTrack[];
    }>();

    tracks.forEach(track => {
        track.artists.forEach(a => {
            const artistDetails = artistMap.get(a.id);
            if (artistDetails && artistDetails.genres) {
                artistDetails.genres.forEach(genre => {
                    const g = genre.toLowerCase(); // normalize
                    if (!genreGroups.has(g)) {
                        genreGroups.set(g, {
                            count: 0,
                            artists: new Set(),
                            topTracks: [],
                            tracks: []
                        });
                    }
                    const group = genreGroups.get(g)!;
                    group.count++;
                    group.artists.add(a.name);
                    group.tracks.push(track);
                    // Keep a sample
                    if (group.topTracks.length < 5) group.topTracks.push(track);
                });
            }
        });
    });

    // Convert to Nodes
    const nodes: GenreNode[] = Array.from(genreGroups.entries()).map(([genre, data]) => {
        const weights = mapGenreToPillar(genre);
        const { x: nx, y: ny } = calculateTargetPosition(weights);
        const color = interpolatePillarColor(weights);

        // Children (Artists)
        // Group tracks by artist within this genre for drill-down
        const artistGroups = new Map<string, { count: number, tracks: SpotifyTrack[] }>();
        data.tracks.forEach(t => {
            t.artists.forEach(a => {
                // only if this artist actually HAS this genre? 
                // It's tricky because a track has multiple artists.
                // Simplification: Associate track with this artist node.
                if (!artistGroups.has(a.name)) artistGroups.set(a.name, { count: 0, tracks: [] });
                artistGroups.get(a.name)!.count++;
                artistGroups.get(a.name)!.tracks.push(t);
            });
        });

        const children: GenreNode[] = Array.from(artistGroups.entries()).map(([aname, adata]) => ({
            id: `${genre}-${aname}`, // Unique ID
            name: aname,
            count: adata.count,
            artists: [aname],
            artistCount: 1,
            albumCount: 0, // todo
            tracks: adata.tracks,
            topTracks: adata.tracks.slice(0, 5),
            // Artist nodes inherit the Genre's position roughly, maybe slightly randomized?
            // Or we re-calculate if we had finer grained data. 
            // For now, they inherit the Parent's color/position logic but will be simulated separately in drill down.
            genres: [genre]
        }));


        return {
            id: genre,
            name: genre, // Capitalize?
            count: data.count,
            artists: Array.from(data.artists),
            artistCount: data.artists.size,
            albumCount: 0,
            tracks: data.tracks,
            topTracks: data.topTracks,
            // Custom Props for Simulation
            pillarPos: { x: nx, y: ny },
            color: color,
            children: children
        } as GenreNode & { pillarPos: { x: number, y: number }, color: string };
    });

    // Sort by size
    return nodes.sort((a, b) => b.count - a.count).slice(0, 200); // Limit to top 200 genres to avoid clutter?
}
