import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, Shuffle } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { usePlayer } from '@/context/PlayerContext'
import { AlbumCard } from '@/components/Cards'
import { CardGrid, Spinner } from '@/components/Grid'
import { TrackList } from '@/components/TrackList'
import { Artwork } from '@/components/Artwork'
import { PageContainer } from '@/components/common'
import { plural } from '@/lib/format'

export function ArtistDetailPage() {
    const { name = '' } = useParams()
    const artistName = decodeURIComponent(name)
    const { albums, tracks, loading } = useLibrary()
    const player = usePlayer()

    const artistAlbums = useMemo(
        () => albums.filter((a) => a.artist === artistName),
        [albums, artistName],
    )
    const artistTracks = useMemo(
        () => tracks.filter((t) => (t.album_artist || t.artist) === artistName),
        [tracks, artistName],
    )
    const topTracks = useMemo(
        () => [...artistTracks].sort((a, b) => b.play_count - a.play_count).slice(0, 5),
        [artistTracks],
    )
    const artworkUrl = artistAlbums.find((a) => a.artworkUrl)?.artworkUrl ?? null

    if (loading) return <Spinner />
    if (artistTracks.length === 0) {
        return (
            <PageContainer>
                <p className="text-muted">Artiste introuvable.</p>
                <Link to="/artists" className="mt-2 inline-block text-accent hover:underline">
                    ← Retour aux artistes
                </Link>
            </PageContainer>
        )
    }

    return (
        <div>
            {/* Bannière */}
            <div className="relative h-60 overflow-hidden">
                <Artwork
                    url={artworkUrl}
                    seed={artistName}
                    rounded="rounded-none"
                    className="absolute inset-0 h-full w-full scale-110 blur-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-black/20" />
                <div className="absolute inset-x-0 bottom-0 flex items-end gap-5 px-6 pb-5 lg:px-8">
                    <Artwork
                        url={artworkUrl}
                        seed={artistName}
                        rounded="rounded-full"
                        className="size-32 shadow-2xl"
                    />
                    <div className="min-w-0 flex-1 pb-1">
                        <span className="text-[12px] font-semibold uppercase tracking-widest text-accent">
                            Artiste
                        </span>
                        <h1 className="truncate text-[clamp(28px,5vw,46px)] font-bold leading-tight tracking-tight">
                            {artistName}
                        </h1>
                        <p className="text-[13px] text-muted">
                            {plural(artistAlbums.length, 'album')} ·{' '}
                            {plural(artistTracks.length, 'morceau', 'morceaux')}
                        </p>
                    </div>
                    <div className="hidden shrink-0 gap-3 pb-1 sm:flex">
                        <button
                            type="button"
                            onClick={() => player.playContext(artistTracks, 0, false)}
                            className="flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-[14px] font-semibold text-white shadow-lg transition hover:brightness-110"
                        >
                            <Play className="size-4 fill-current" />
                            Lire
                        </button>
                        <button
                            type="button"
                            onClick={() => player.playContext(artistTracks, 0, true)}
                            className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-[14px] font-semibold text-ink transition hover:bg-white/25"
                        >
                            <Shuffle className="size-4" />
                            Aléatoire
                        </button>
                    </div>
                </div>
            </div>

            <PageContainer>
                {/* Populaires */}
                {topTracks.some((t) => t.play_count > 0) && (
                    <section className="mb-9">
                        <h2 className="mb-3 text-[20px] font-bold tracking-tight">Populaires</h2>
                        <TrackList tracks={topTracks} variant="library" />
                    </section>
                )}

                {/* Albums */}
                <section>
                    <h2 className="mb-3 text-[20px] font-bold tracking-tight">Albums</h2>
                    <CardGrid>
                        {artistAlbums.map((album) => (
                            <AlbumCard key={album.key} album={album} />
                        ))}
                    </CardGrid>
                </section>
            </PageContainer>
        </div>
    )
}
