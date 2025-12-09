const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

interface SpotifyFetchOptions extends RequestInit {
    accessToken: string;
    params?: Record<string, string>;
}

async function spotifyFetch<T>(endpoint: string, options: SpotifyFetchOptions): Promise<T> {
    const { accessToken, params, ...init } = options;
    const url = new URL(SPOTIFY_API_BASE + endpoint);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }

    const res = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        ...init,
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `Spotify API Error: ${res.statusText}`);
    }

    return res.json();
}

export async function getLikedSongs(accessToken: string, limit = 50, offset = 0) {
    return spotifyFetch<SpotifyApi.UsersSavedTracksResponse>("/me/tracks", {
        accessToken,
        params: {
            limit: limit.toString(),
            offset: offset.toString(),
        },
    });
}

export async function getAllLikedSongs(accessToken: string, maxLimit = 1000) {
    let allTracks: SpotifyApi.SavedTrackObject[] = [];
    let offset = 0;
    const limit = 50;

    while (allTracks.length < maxLimit) {
        const data = await getLikedSongs(accessToken, limit, offset);
        if (!data.items.length) break;

        allTracks = [...allTracks, ...data.items];
        if (!data.next) break;

        offset += limit;
    }

    return allTracks;
}

export async function getAudioFeatures(accessToken: string, ids: string[]) {
    // Max 100 IDs per request
    const chunks = [];
    for (let i = 0; i < ids.length; i += 100) {
        chunks.push(ids.slice(i, i + 100));
    }

    const features = await Promise.all(
        chunks.map(chunk =>
            spotifyFetch<{ audio_features: SpotifyApi.AudioFeaturesObject[] }>("/audio-features", {
                accessToken,
                params: { ids: chunk.join(",") },
            })
        )
    );

    return features.flatMap(f => f.audio_features);
}

export async function getArtists(accessToken: string, ids: string[]) {
    // Max 50 IDs per request
    const chunks = [];
    for (let i = 0; i < ids.length; i += 50) {
        chunks.push(ids.slice(i, i + 50));
    }

    const artists = await Promise.all(
        chunks.map(chunk =>
            spotifyFetch<{ artists: SpotifyApi.ArtistObjectFull[] }>("/artists", {
                accessToken,
                params: { ids: chunk.join(",") },
            })
        )
    );

    return artists.flatMap(a => a.artists);
}
