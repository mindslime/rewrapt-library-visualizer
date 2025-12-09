import { SpotifyArtist, SpotifyTrack, SpotifyPlaylist } from "@/types/spotify";

export async function fetchPlaylistTracks(accessToken: string, playlistId: string, onProgress?: (loaded: number, total: number) => void, signal?: AbortSignal): Promise<SpotifyTrack[]> {
    let tracks: SpotifyTrack[] = [];
    let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;

    while (nextUrl) {
        if (signal?.aborted) throw new Error("Aborted");

        const res = await fetch(nextUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal
        });
        if (!res.ok) break;
        const data = await res.json();

        const items = data.items.map((item: any) => ({
            ...item.track,
            added_at: item.added_at
        })).filter((t: any) => t && t.id);
        tracks = [...tracks, ...items];

        if (onProgress) {
            onProgress(tracks.length, data.total || 0);
        }

        nextUrl = data.next;
    }
    return tracks;
}

export async function fetchArtists(accessToken: string, artistIds: string[], onProgress?: (loaded: number, total: number) => void, signal?: AbortSignal): Promise<SpotifyArtist[]> {
    const uniqueIds = Array.from(new Set(artistIds));
    const chunks = [];

    for (let i = 0; i < uniqueIds.length; i += 50) {
        chunks.push(uniqueIds.slice(i, i + 50));
    }

    let artists: SpotifyArtist[] = [];
    let processed = 0;

    for (const chunk of chunks) {
        if (signal?.aborted) throw new Error("Aborted");

        const res = await fetch(`https://api.spotify.com/v1/artists?ids=${chunk.join(",")}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal
        });
        if (!res.ok) continue;
        const data = await res.json();
        artists = [...artists, ...data.artists];
        processed += chunk.length;

        if (onProgress) {
            onProgress(processed, uniqueIds.length);
        }
    }
    return artists;
}

export async function fetchLikedSongs(accessToken: string, onProgress?: (loaded: number, total: number) => void, checkCache?: (id: string) => Promise<boolean>, signal?: AbortSignal): Promise<SpotifyTrack[]> {
    let tracks: SpotifyTrack[] = [];
    let nextUrl = "https://api.spotify.com/v1/me/tracks?limit=50";

    while (nextUrl) {
        if (signal?.aborted) throw new Error("Aborted");

        const res = await fetch(nextUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal
        });
        if (!res.ok) break;
        const data = await res.json();

        const items = data.items.map((item: any) => ({
            ...item.track,
            added_at: item.added_at
        })).filter((t: any) => t && t.id);

        let shouldStop = false;

        if (checkCache) {
            // Check if we already have the first item of this batch
            // If we have the newest item, we likely have everything after it too (assuming chronological fetch)
            // But to be safe, we add items until we hit one we have.

            const newItems: SpotifyTrack[] = [];
            for (const item of items) {
                const exists = await checkCache(item.id);
                if (exists) {
                    shouldStop = true;
                    // We found a track we already have.
                    // If this is incremental, we stop here.
                    break;
                }
                newItems.push(item);
            }
            tracks = [...tracks, ...newItems];
        } else {
            tracks = [...tracks, ...items];
        }

        if (onProgress) {
            onProgress(tracks.length, data.total || 0);
        }

        if (shouldStop) {
            break;
        }

        nextUrl = data.next;
    }
    return tracks;
}

export async function fetchUserPlaylists(accessToken: string): Promise<SpotifyPlaylist[]> {
    let playlists: SpotifyPlaylist[] = [];
    let nextUrl = "https://api.spotify.com/v1/me/playlists?limit=50";

    console.log("Starting playlist fetch...");

    while (nextUrl) {
        console.log(`Fetching playlists from: ${nextUrl}`);
        const res = await fetch(nextUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
            console.error("Failed to fetch playlists", res.status, res.statusText);
            break;
        }
        const data = await res.json();

        if (data.items) {
            console.log(`Fetched ${data.items.length} playlists.`);
            playlists = [...playlists, ...data.items];
        }

        nextUrl = data.next;
    }
    console.log(`Total playlists loaded: ${playlists.length}`);
    return playlists;
}
