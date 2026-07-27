// src/types/database.ts — généré à partir de db/migrations/001_init.sql
// Convention Supabase : Row (tout), Insert (défauts/nullables optionnels), Update (tout optionnel).

export interface Database {
    public: {
        Tables: {
            tracks: {
                Row: {
                    id: string
                    title: string
                    artist: string
                    album: string
                    album_artist: string | null
                    genre: string | null
                    year: number | null
                    track_no: number | null
                    disc_no: number | null
                    duration: number
                    audio_url: string
                    artwork_url: string | null
                    file_name: string | null
                    liked: boolean
                    play_count: number
                    last_played_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    artist?: string
                    album?: string
                    album_artist?: string | null
                    genre?: string | null
                    year?: number | null
                    track_no?: number | null
                    disc_no?: number | null
                    duration?: number
                    audio_url: string
                    artwork_url?: string | null
                    file_name?: string | null
                    liked?: boolean
                    play_count?: number
                    last_played_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    artist?: string
                    album?: string
                    album_artist?: string | null
                    genre?: string | null
                    year?: number | null
                    track_no?: number | null
                    disc_no?: number | null
                    duration?: number
                    audio_url?: string
                    artwork_url?: string | null
                    file_name?: string | null
                    liked?: boolean
                    play_count?: number
                    last_played_at?: string | null
                    created_at?: string
                }
            }
            playlists: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    artwork_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    artwork_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    artwork_url?: string | null
                    created_at?: string
                }
            }
            playlist_tracks: {
                Row: {
                    playlist_id: string
                    track_id: string
                    position: number
                    added_at: string
                }
                Insert: {
                    playlist_id: string
                    track_id: string
                    position?: number
                    added_at?: string
                }
                Update: {
                    playlist_id?: string
                    track_id?: string
                    position?: number
                    added_at?: string
                }
            }
        }
    }
}

export type TrackRow = Database['public']['Tables']['tracks']['Row']
export type TrackInsert = Database['public']['Tables']['tracks']['Insert']
export type TrackUpdate = Database['public']['Tables']['tracks']['Update']
export type PlaylistRow = Database['public']['Tables']['playlists']['Row']
export type PlaylistInsert = Database['public']['Tables']['playlists']['Insert']
export type PlaylistTrackRow = Database['public']['Tables']['playlist_tracks']['Row']
