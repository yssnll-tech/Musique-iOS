// Stockage 100 % local et hors-ligne, sans backend.
//
// Remplace la couche Moxt (window.moxt.db + window.moxt.upload) par IndexedDB :
//   - métadonnées des morceaux / playlists / appartenances aux playlists
//   - fichiers audio et pochettes stockés en Blob dans le magasin `blobs`
//
// Les URLs persistées sont des références stables `idb-blob:<id>`. À l'exécution,
// on les résout en URLs d'objet (URL.createObjectURL) pour l'élément <audio> et
// les <img>. Ces URLs d'objet ne survivent pas à un rechargement : elles sont donc
// régénérées à chaque chargement de la bibliothèque.

import type { PlaylistRow, PlaylistTrackRow, TrackInsert, TrackRow } from '@/types/database'

const DB_NAME = 'musique'
const DB_VERSION = 1
const BLOB_PREFIX = 'idb-blob:'

type StoreName = 'tracks' | 'playlists' | 'playlist_tracks' | 'blobs'

// ---- Génération d'identifiants (sans crypto.randomUUID : indisponible hors contexte sécurisé) ----
function uid(): string {
    const bytes = new Uint8Array(16)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes)
    } else {
        for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'))
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
        .slice(6, 8)
        .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
}

// ---- Ouverture de la base ----
let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains('tracks')) db.createObjectStore('tracks', { keyPath: 'id' })
            if (!db.objectStoreNames.contains('playlists'))
                db.createObjectStore('playlists', { keyPath: 'id' })
            if (!db.objectStoreNames.contains('playlist_tracks'))
                db.createObjectStore('playlist_tracks', { keyPath: ['playlist_id', 'track_id'] })
            if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs', { keyPath: 'id' })
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
    return dbPromise
}

// ---- Primitives promisifiées ----
function tx(db: IDBDatabase, store: StoreName, mode: IDBTransactionMode): IDBObjectStore {
    return db.transaction(store, mode).objectStore(store)
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

async function getAll<T>(store: StoreName): Promise<T[]> {
    const db = await openDB()
    return reqToPromise(tx(db, store, 'readonly').getAll() as IDBRequest<T[]>)
}

async function getOne<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
    const db = await openDB()
    return reqToPromise(tx(db, store, 'readonly').get(key) as IDBRequest<T | undefined>)
}

async function putValue<T>(store: StoreName, value: T): Promise<void> {
    const db = await openDB()
    await reqToPromise(tx(db, store, 'readwrite').put(value as unknown as Record<string, unknown>))
}

async function deleteValue(store: StoreName, key: IDBValidKey): Promise<void> {
    const db = await openDB()
    await reqToPromise(tx(db, store, 'readwrite').delete(key))
}

// ---- Blobs & résolution d'URLs ----
const urlCache = new Map<string, string>() // blobId -> objectURL

async function saveBlob(blob: Blob): Promise<string> {
    const id = uid()
    await putValue('blobs', { id, blob })
    // Pré-remplit le cache pour un usage immédiat après import.
    urlCache.set(id, URL.createObjectURL(blob))
    return id
}

function blobRef(id: string): string {
    return BLOB_PREFIX + id
}

async function objectUrlForBlobId(id: string): Promise<string | null> {
    const cached = urlCache.get(id)
    if (cached) return cached
    const rec = await getOne<{ id: string; blob: Blob }>('blobs', id)
    if (!rec) return null
    const url = URL.createObjectURL(rec.blob)
    urlCache.set(id, url)
    return url
}

async function resolveRef(ref: string | null): Promise<string | null> {
    if (!ref) return ref
    if (ref.startsWith(BLOB_PREFIX)) return objectUrlForBlobId(ref.slice(BLOB_PREFIX.length))
    return ref // passe-plat (URL http éventuelle héritée)
}

async function deleteBlobByRef(ref: string | null): Promise<void> {
    if (!ref || !ref.startsWith(BLOB_PREFIX)) return
    const id = ref.slice(BLOB_PREFIX.length)
    const cached = urlCache.get(id)
    if (cached) {
        URL.revokeObjectURL(cached)
        urlCache.delete(id)
    }
    await deleteValue('blobs', id)
}

async function resolveTrack(row: TrackRow): Promise<TrackRow> {
    const [audio, art] = await Promise.all([resolveRef(row.audio_url), resolveRef(row.artwork_url)])
    return { ...row, audio_url: audio ?? '', artwork_url: art }
}

// ---- API bibliothèque ----
export interface LibrarySnapshot {
    tracks: TrackRow[]
    playlists: PlaylistRow[]
    membership: PlaylistTrackRow[]
}

export async function loadLibrary(): Promise<LibrarySnapshot> {
    const [tracks, playlists, membership] = await Promise.all([
        getAll<TrackRow>('tracks'),
        getAll<PlaylistRow>('playlists'),
        getAll<PlaylistTrackRow>('playlist_tracks'),
    ])
    tracks.sort((a, b) => b.created_at.localeCompare(a.created_at))
    playlists.sort((a, b) => b.created_at.localeCompare(a.created_at))
    membership.sort((a, b) => a.position - b.position)
    const resolved = await Promise.all(tracks.map(resolveTrack))
    return { tracks: resolved, playlists, membership }
}

/** Stocke un fichier (audio ou pochette) et renvoie une référence stable `idb-blob:<id>`. */
export async function storeFile(file: Blob): Promise<string> {
    const id = await saveBlob(file)
    return blobRef(id)
}

/** Insère un morceau ; renvoie la ligne complète avec URLs résolues (prête pour l'état React). */
export async function insertTrack(insert: TrackInsert): Promise<TrackRow> {
    const row: TrackRow = {
        id: insert.id ?? uid(),
        title: insert.title,
        artist: insert.artist ?? 'Artiste inconnu',
        album: insert.album ?? 'Album inconnu',
        album_artist: insert.album_artist ?? null,
        genre: insert.genre ?? null,
        year: insert.year ?? null,
        track_no: insert.track_no ?? null,
        disc_no: insert.disc_no ?? null,
        duration: insert.duration ?? 0,
        audio_url: insert.audio_url,
        artwork_url: insert.artwork_url ?? null,
        file_name: insert.file_name ?? null,
        liked: insert.liked ?? false,
        play_count: insert.play_count ?? 0,
        last_played_at: insert.last_played_at ?? null,
        created_at: insert.created_at ?? new Date().toISOString(),
    }
    await putValue('tracks', row)
    return resolveTrack(row)
}

export async function updateTrack(id: string, patch: Partial<TrackRow>): Promise<void> {
    const existing = await getOne<TrackRow>('tracks', id)
    if (!existing) return
    // On ne réécrit jamais les URLs résolues (objectURL) dans le stockage :
    // les champs audio_url/artwork_url conservent leur référence `idb-blob:`.
    const { audio_url, artwork_url, ...safePatch } = patch
    void audio_url
    void artwork_url
    await putValue('tracks', { ...existing, ...safePatch })
}

export async function deleteTrack(id: string): Promise<void> {
    const existing = await getOne<TrackRow>('tracks', id)
    if (existing) {
        await deleteBlobByRef(existing.audio_url)
        await deleteBlobByRef(existing.artwork_url)
    }
    await deleteValue('tracks', id)
    // Cascade : retirer ce morceau de toutes les playlists.
    const membership = await getAll<PlaylistTrackRow>('playlist_tracks')
    await Promise.all(
        membership
            .filter((m) => m.track_id === id)
            .map((m) => deleteValue('playlist_tracks', [m.playlist_id, m.track_id])),
    )
}

export async function insertPlaylist(name: string, description?: string): Promise<PlaylistRow> {
    const row: PlaylistRow = {
        id: uid(),
        name,
        description: description ?? null,
        artwork_url: null,
        created_at: new Date().toISOString(),
    }
    await putValue('playlists', row)
    return row
}

export async function updatePlaylist(id: string, patch: Partial<PlaylistRow>): Promise<void> {
    const existing = await getOne<PlaylistRow>('playlists', id)
    if (!existing) return
    await putValue('playlists', { ...existing, ...patch })
}

export async function deletePlaylist(id: string): Promise<void> {
    await deleteValue('playlists', id)
    const membership = await getAll<PlaylistTrackRow>('playlist_tracks')
    await Promise.all(
        membership
            .filter((m) => m.playlist_id === id)
            .map((m) => deleteValue('playlist_tracks', [m.playlist_id, m.track_id])),
    )
}

export async function insertMembership(rows: Omit<PlaylistTrackRow, 'added_at'>[]): Promise<void> {
    const added_at = new Date().toISOString()
    await Promise.all(rows.map((r) => putValue('playlist_tracks', { ...r, added_at })))
}

export async function deleteMembership(playlistId: string, trackId: string): Promise<void> {
    await deleteValue('playlist_tracks', [playlistId, trackId])
}
