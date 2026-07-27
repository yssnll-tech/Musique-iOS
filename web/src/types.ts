// Types de domaine de l'app. La source des types base est src/types/database.ts.
export * from './types/database'
import type { TrackRow } from './types/database'

export type Track = TrackRow

/** Un album = regroupement de morceaux par (album + artiste d'album). */
export interface Album {
    key: string
    title: string
    artist: string
    artworkUrl: string | null
    year: number | null
    tracks: Track[]
}

/** Un artiste = regroupement de morceaux par artiste d'album (ou artiste). */
export interface Artist {
    name: string
    artworkUrl: string | null
    albumCount: number
    trackCount: number
}

export type RepeatMode = 'off' | 'all' | 'one'
