import { openDB, DBSchema } from 'idb';
import { SpotifyTrack, SpotifyArtist } from '@/types/spotify';

interface MusicMapDB extends DBSchema {
    library: {
        key: string;
        value: SpotifyTrack;
    };
    artists: {
        key: string;
        value: SpotifyArtist;
    };
    metadata: {
        key: string;
        value: any;
    };
}

const DB_NAME = 'spotify-music-map-db';
const DB_VERSION = 3; // Bump version to force clear stale cache

export const dbInit = async () => {
    return openDB<MusicMapDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
            if (!db.objectStoreNames.contains('library')) {
                db.createObjectStore('library', { keyPath: 'id' });
            } else if (oldVersion < 3) {
                // Clear library if upgrading from older version (stale tracks without added_at)
                transaction.objectStore('library').clear();
            }

            if (!db.objectStoreNames.contains('artists')) {
                db.createObjectStore('artists', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('metadata')) {
                db.createObjectStore('metadata');
            }
        },
    });
};

export async function saveTracksToCache(tracks: SpotifyTrack[]) {
    const db = await dbInit();
    const tx = db.transaction('library', 'readwrite');
    const store = tx.objectStore('library');
    await Promise.all(tracks.map(track => store.put(track)));
    await tx.done;
}

export async function getCachedTracks(): Promise<SpotifyTrack[]> {
    const db = await dbInit();
    return db.getAll('library');
}

export async function checkTrackExists(id: string): Promise<boolean> {
    const db = await dbInit();
    const track = await db.get('library', id);
    return !!track;
}

export async function saveArtistsToCache(artists: SpotifyArtist[]) {
    const db = await dbInit();
    const tx = db.transaction('artists', 'readwrite');
    const store = tx.objectStore('artists');
    await Promise.all(artists.map(artist => store.put(artist)));
    await tx.done;
}

export async function getCachedArtists(ids: string[]): Promise<SpotifyArtist[]> {
    const db = await dbInit();
    const tx = db.transaction('artists', 'readonly');
    const store = tx.objectStore('artists');

    // idb's store.get usually only takes one key.
    // We can do Promise.all
    const results = await Promise.all(ids.map(id => store.get(id)));
    return results.filter((a): a is SpotifyArtist => !!a);
}
