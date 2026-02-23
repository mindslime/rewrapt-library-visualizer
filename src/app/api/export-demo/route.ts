import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { fetchArtists, fetchUserPlaylists } from "@/lib/spotify-client";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized. Please log in first to export your data." }, { status: 401 });
    }

    try {
        const accessToken = session.accessToken;

        // 1. Fetch Profile
        const profileRes = await fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const profile = profileRes.ok ? await profileRes.json() : null;

        // 2. Fetch Playlists (limit to 5)
        const allPlaylists = await fetchUserPlaylists(accessToken);
        const demoPlaylists = allPlaylists.slice(0, 5);

        // 3. Fetch Liked Songs (limit to 50)
        const tracksRes = await fetch("https://api.spotify.com/v1/me/tracks?limit=50", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        let rawTracks = [];
        if (tracksRes.ok) {
            const data = await tracksRes.json();
            rawTracks = data.items.map((item: any) => {
                const t = item.track;
                delete t.available_markets;
                if (t.album) delete t.album.available_markets;
                return {
                    ...t,
                    added_at: item.added_at
                };
            }).filter((t: any) => t && t.id);
        }

        // 4. Resolve Artists to get genres
        const artistIds = new Set<string>();
        rawTracks.forEach((t: any) => t.artists?.forEach((a: any) => artistIds.add(a.id)));
        const artistIdsArray = Array.from(artistIds);
        const resolvedArtists = await fetchArtists(accessToken, artistIdsArray);
        const artistMap = new Map(resolvedArtists.map(a => [a.id, a]));

        // --- Generate TypeScript Content ---
        const imports = `import { SpotifyPlaylist, SpotifyTrack, SpotifyArtist } from "@/types/spotify";\n`;

        const profileStr = `export const DEMO_PROFILE = {
    display_name: ${JSON.stringify(profile?.display_name || "Demo User")},
    images: ${JSON.stringify(profile?.images || [])},
    id: ${JSON.stringify(profile?.id || "demo_user")}
};\n`;

        const playlistsStr = `export const DEMO_PLAYLISTS: SpotifyPlaylist[] = ${JSON.stringify(demoPlaylists, null, 4)};\n`;

        const helpersStr = `// Helper to create a track
const createTrack = (id: string, name: string, artist: string, genres: string[], cover: string = "", rawItem: any): SpotifyTrack & { _artistGenres: string[] } => ({
    ...rawItem,
    id,
    name,
    artists: rawItem.artists, // Keep original artists so mapping works
    // Custom property to help our transform function in demo mode
    _artistGenres: genres
});\n`;

        // Format tracks
        const trackLines = rawTracks.map((t: any) => {
            // Collect genres
            const genres = new Set<string>();
            t.artists.forEach((a: any) => {
                const ad = artistMap.get(a.id);
                if (ad && ad.genres) {
                    ad.genres.forEach(g => genres.add(g));
                }
            });
            const genreArr = Array.from(genres);
            const artistName = t.artists[0]?.name || "Unknown";
            const cover = t.album?.images?.[0]?.url || "";
            return `    createTrack(${JSON.stringify(t.id)}, ${JSON.stringify(t.name)}, ${JSON.stringify(artistName)}, ${JSON.stringify(genreArr)}, ${JSON.stringify(cover)}, ${JSON.stringify(t)}),`;
        });

        const tracksStr = `export const DEMO_TRACKS: (SpotifyTrack & { _artistGenres: string[] })[] = [\n${trackLines.join('\n')}\n];\n`;

        const artistsStr = `export const DEMO_ARTISTS: SpotifyArtist[] = [
${resolvedArtists.map(a => `    ${JSON.stringify(a)}`).join(',\n')}
];\n`;

        const finalOutput = [
            imports,
            profileStr,
            playlistsStr,
            helpersStr,
            tracksStr,
            artistsStr
        ].join('\n');

        return new NextResponse(finalOutput, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
            },
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
