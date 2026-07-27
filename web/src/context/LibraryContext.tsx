import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as store from '@/lib/store'
import type { Album, Artist, Track } from '@/types'
import type { PlaylistRow, PlaylistTrackRow } from '@/types/database'
import { getAudioDuration, parseAudioMetadata, stripExtension } from '@/lib/metadata'
import { albumKey } from '@/lib/keys'

export interface ImportProgress {
    total: number
    done: number
    failed: number
    current: string
}

interface LibraryValue {
    loading: boolean
    tracks: Track[]
    playlists: PlaylistRow[]
    albums: Album[]
    artists: Artist[]
    importing: ImportProgress | null
    refresh: () => Promise<void>
    importFiles: (files: File[]) => Promise<void>
    getTrack: (id: string) => Track | undefined
    albumByKey: (key: string) => Album | undefined
    artistByName: (name: string) => Artist | undefined
    toggleLike: (t: Track) => Promise<void>
    markPlayed: (t: Track) => Promise<void>
    updateTrack: (id: string, patch: Partial<Track>) => Promise<void>
    deleteTrack: (id: string) => Promise<void>
    playlistTrackIds: (playlistId: string) => string[]
    playlistTracks: (playlistId: string) => Track[]
    createPlaylist: (name: string, description?: string) => Promise<PlaylistRow | null>
    renamePlaylist: (id: string, name: string) => Promise<void>
    deletePlaylist: (id: string) => Promise<void>
    addToPlaylist: (playlistId: string, trackIds: string[]) => Promise<void>
    removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>
}

const LibraryContext = createContext<LibraryValue | null>(null)

export function useLibrary(): LibraryValue {
    const ctx = useContext(LibraryContext)
    if (!ctx) throw new Error('useLibrary doit être utilisé dans <LibraryProvider>')
    return ctx
}

function sortTracksForAlbum(a: Track, b: Track): number {
    const da = a.disc_no ?? 0
    const towb = b.disc_no ?? 0
    if (da !== towb) return da - towb
    const ta = a.track_no ?? 9999
    const tb = b.track_no ?? 9999
    if (ta !== tb) return ta - tb
    return a.title.localeCompare(b.title)
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
    const [tracks, setTracks] = useState<Track[]>([])
    const [playlists, setPlaylists] = useState<PlaylistRow[]>([])
    const [membership, setMembership] = useState<PlaylistTrackRow[]>([])
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState<ImportProgress | null>(null)

    const refresh = useCallback(async () => {
        try {
            const snap = await store.loadLibrary()
            setTracks(snap.tracks as Track[])
            setPlaylists(snap.playlists)
            setMembership(snap.membership)
        } catch (e) {
            console.error('Chargement de la bibliothèque impossible', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    // ---- Regroupements dérivés ----
    const albums = useMemo<Album[]>(() => {
        const map = new Map<string, Album>()
        for (const t of tracks) {
            const artist = t.album_artist || t.artist
            const key = albumKey(t.album, artist)
            let al = map.get(key)
            if (!al) {
                al = { key, title: t.album, artist, artworkUrl: null, year: null, tracks: [] }
                map.set(key, al)
            }
            al.tracks.push(t)
            if (!al.artworkUrl && t.artwork_url) al.artworkUrl = t.artwork_url
            if (t.year && (!al.year || t.year < al.year)) al.year = t.year
        }
        const list = [...map.values()]
        for (const al of list) al.tracks.sort(sortTracksForAlbum)
        list.sort((a, b) => a.title.localeCompare(b.title))
        return list
    }, [tracks])

    const artists = useMemo<Artist[]>(() => {
        const map = new Map<string, Artist & { albums: Set<string> }>()
        for (const t of tracks) {
            const name = t.album_artist || t.artist
            let ar = map.get(name)
            if (!ar) {
                ar = { name, artworkUrl: null, albumCount: 0, trackCount: 0, albums: new Set() }
                map.set(name, ar)
            }
            ar.trackCount += 1
            ar.albums.add(t.album.toLowerCase())
            if (!ar.artworkUrl && t.artwork_url) ar.artworkUrl = t.artwork_url
        }
        const list = [...map.values()].map((a) => ({
            name: a.name,
            artworkUrl: a.artworkUrl,
            trackCount: a.trackCount,
            albumCount: a.albums.size,
        }))
        list.sort((a, b) => a.name.localeCompare(b.name))
        return list
    }, [tracks])

    const getTrack = useCallback((id: string) => tracks.find((t) => t.id === id), [tracks])
    const albumByKey = useCallback((key: string) => albums.find((a) => a.key === key), [albums])
    const artistByName = useCallback(
        (name: string) => artists.find((a) => a.name === name),
        [artists],
    )

    // ---- Import de fichiers ----
    const importFiles = useCallback(
        async (files: File[]) => {
            const audioFiles = files.filter(
                (f) => f.type.startsWith('audio') || /\.(mp3|m4a|aac|wav|flac|ogg|oga|opus)$/i.test(f.name),
            )
            if (audioFiles.length === 0) return
            setImporting({ total: audioFiles.length, done: 0, failed: 0, current: '' })
            const inserted: Track[] = []
            let failed = 0

            for (let i = 0; i < audioFiles.length; i++) {
                const file = audioFiles[i]
                setImporting({ total: audioFiles.length, done: i, failed, current: file.name })
                try {
                    const [meta, duration] = await Promise.all([
                        parseAudioMetadata(file),
                        getAudioDuration(file),
                    ])
                    // Stockage local du fichier audio (Blob dans IndexedDB).
                    const audioUrl = await store.storeFile(file)

                    let artworkUrl: string | null = null
                    if (meta.picture) {
                        try {
                            artworkUrl = await store.storeFile(meta.picture)
                        } catch {
                            artworkUrl = null
                        }
                    }

                    const row = await store.insertTrack({
                        title: meta.title || stripExtension(file.name),
                        artist: meta.artist || 'Artiste inconnu',
                        album: meta.album || 'Album inconnu',
                        album_artist: meta.albumArtist ?? null,
                        genre: meta.genre ?? null,
                        year: meta.year ?? null,
                        track_no: meta.trackNo ?? null,
                        disc_no: meta.discNo ?? null,
                        duration,
                        audio_url: audioUrl,
                        artwork_url: artworkUrl,
                        file_name: file.name,
                    })
                    inserted.push(row as Track)
                } catch (e) {
                    console.error('Import échoué pour', file.name, e)
                    failed += 1
                }
            }

            if (inserted.length) {
                setTracks((prev) => [...inserted.reverse(), ...prev])
            }
            setImporting({
                total: audioFiles.length,
                done: audioFiles.length,
                failed,
                current: '',
            })
            // Laisse le toast final visible un court instant.
            window.setTimeout(() => setImporting(null), 1600)
        },
        [],
    )

    // ---- Mutations morceaux ----
    const toggleLike = useCallback(async (t: Track) => {
        const liked = !t.liked
        setTracks((prev) => prev.map((x) => (x.id === t.id ? { ...x, liked } : x)))
        try {
            await store.updateTrack(t.id, { liked })
        } catch {
            setTracks((prev) => prev.map((x) => (x.id === t.id ? { ...x, liked: t.liked } : x)))
        }
    }, [])

    const markPlayed = useCallback(async (t: Track) => {
        const nowIso = new Date().toISOString()
        setTracks((prev) =>
            prev.map((x) =>
                x.id === t.id ? { ...x, play_count: x.play_count + 1, last_played_at: nowIso } : x,
            ),
        )
        await store.updateTrack(t.id, { play_count: t.play_count + 1, last_played_at: nowIso })
    }, [])

    const updateTrack = useCallback(async (id: string, patch: Partial<Track>) => {
        setTracks((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
        await store.updateTrack(id, patch)
    }, [])

    const deleteTrack = useCallback(async (id: string) => {
        setTracks((prev) => prev.filter((x) => x.id !== id))
        setMembership((prev) => prev.filter((m) => m.track_id !== id))
        await store.deleteTrack(id)
    }, [])

    // ---- Playlists ----
    const playlistTrackIds = useCallback(
        (playlistId: string) =>
            membership
                .filter((m) => m.playlist_id === playlistId)
                .sort((a, b) => a.position - b.position)
                .map((m) => m.track_id),
        [membership],
    )

    const playlistTracks = useCallback(
        (playlistId: string) => {
            const ids = playlistTrackIds(playlistId)
            const byId = new Map(tracks.map((t) => [t.id, t]))
            return ids.map((id) => byId.get(id)).filter((t): t is Track => Boolean(t))
        },
        [playlistTrackIds, tracks],
    )

    const createPlaylist = useCallback(async (name: string, description?: string) => {
        try {
            const row = await store.insertPlaylist(name, description)
            setPlaylists((prev) => [row, ...prev])
            return row
        } catch (e) {
            console.error('Création de playlist impossible', e)
            return null
        }
    }, [])

    const renamePlaylist = useCallback(async (id: string, name: string) => {
        setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
        await store.updatePlaylist(id, { name })
    }, [])

    const deletePlaylist = useCallback(async (id: string) => {
        setPlaylists((prev) => prev.filter((p) => p.id !== id))
        setMembership((prev) => prev.filter((m) => m.playlist_id !== id))
        await store.deletePlaylist(id)
    }, [])

    const addToPlaylist = useCallback(
        async (playlistId: string, trackIds: string[]) => {
            const existing = membership.filter((m) => m.playlist_id === playlistId)
            const have = new Set(existing.map((m) => m.track_id))
            let pos = existing.reduce((max, m) => Math.max(max, m.position), -1)
            const rows = trackIds
                .filter((id) => !have.has(id))
                .map((id) => ({ playlist_id: playlistId, track_id: id, position: ++pos }))
            if (rows.length === 0) return
            setMembership((prev) => [
                ...prev,
                ...rows.map((r) => ({ ...r, added_at: new Date().toISOString() })),
            ])
            try {
                await store.insertMembership(rows)
            } catch (e) {
                console.error('Ajout à la playlist impossible', e)
                await refresh()
            }
        },
        [membership, refresh],
    )

    const removeFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
        setMembership((prev) =>
            prev.filter((m) => !(m.playlist_id === playlistId && m.track_id === trackId)),
        )
        await store.deleteMembership(playlistId, trackId)
    }, [])

    const value: LibraryValue = {
        loading,
        tracks,
        playlists,
        albums,
        artists,
        importing,
        refresh,
        importFiles,
        getTrack,
        albumByKey,
        artistByName,
        toggleLike,
        markPlayed,
        updateTrack,
        deleteTrack,
        playlistTrackIds,
        playlistTracks,
        createPlaylist,
        renamePlaylist,
        deletePlaylist,
        addToPlaylist,
        removeFromPlaylist,
    }

    return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}
