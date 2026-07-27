import { Routes, Route, Navigate } from 'react-router-dom'
import { LibraryProvider } from '@/context/LibraryContext'
import { PlayerProvider } from '@/context/PlayerContext'
import { ImportProvider } from '@/components/ImportProvider'
import { DialogsProvider } from '@/components/DialogsProvider'
import { Layout } from '@/components/Layout'
import { ListenPage } from '@/pages/ListenPage'
import { BrowsePage } from '@/pages/BrowsePage'
import { RadioPage } from '@/pages/RadioPage'
import { RecentsPage } from '@/pages/RecentsPage'
import { SongsPage } from '@/pages/SongsPage'
import { AlbumsPage } from '@/pages/AlbumsPage'
import { AlbumDetailPage } from '@/pages/AlbumDetailPage'
import { ArtistsPage } from '@/pages/ArtistsPage'
import { ArtistDetailPage } from '@/pages/ArtistDetailPage'
import { PlaylistDetailPage } from '@/pages/PlaylistDetailPage'
import { SearchPage } from '@/pages/SearchPage'

export function App() {
    return (
        <LibraryProvider>
            <PlayerProvider>
                <ImportProvider>
                    <DialogsProvider>
                        <Routes>
                            <Route element={<Layout />}>
                                <Route path="/" element={<ListenPage />} />
                                <Route path="/browse" element={<BrowsePage />} />
                                <Route path="/radio" element={<RadioPage />} />
                                <Route path="/recents" element={<RecentsPage />} />
                                <Route path="/songs" element={<SongsPage />} />
                                <Route path="/albums" element={<AlbumsPage />} />
                                <Route path="/albums/:key" element={<AlbumDetailPage />} />
                                <Route path="/artists" element={<ArtistsPage />} />
                                <Route path="/artists/:name" element={<ArtistDetailPage />} />
                                <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
                                <Route path="/search" element={<SearchPage />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Route>
                        </Routes>
                    </DialogsProvider>
                </ImportProvider>
            </PlayerProvider>
        </LibraryProvider>
    )
}
