import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Play, Sparkles } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { usePlayer } from '@/context/PlayerContext'
import { AlbumCard, ArtistCard } from '@/components/Cards'
import { Artwork } from '@/components/Artwork'
import { Shelf } from '@/components/Shelf'
import { Spinner } from '@/components/Grid'
import { EmptyState, ImportCta, PageContainer } from '@/components/common'
import { gradientCss } from '@/lib/artwork'
import { plural } from '@/lib/format'

export function ListenPage() {
    const { tracks, albums, artists, playlists, loading, playlistTracks } = useLibrary()
    const player = usePlayer()

    const recentAlbums = useMemo(
        () =>
            [...albums]
                .sort((a, b) => {
                    const la = Math.max(...a.tracks.map((t) => new Date(t.created_at).getTime()))
                    const lb = Math.max(...b.tracks.map((t) => new Date(t.created_at).getTime()))
                    return lb - la
                })
                .slice(0, 12),
        [albums],
    )

    const mostPlayed = useMemo(
        () => [...tracks].filter((t) => t.play_count > 0).sort((a, b) => b.play_count - a.play_count),
        [tracks],
    )

    const heroAlbum = recentAlbums[0]

    if (loading) return <Spinner />

    if (tracks.length === 0) {
        return (
            <PageContainer>
                <EmptyState
                    icon={<Sparkles className="size-10" />}
                    title="Bienvenue dans Musique"
                    message="Votre bibliothèque est vide pour l'instant. Importez vos fichiers audio (MP3, M4A, FLAC…) — glissez-les n'importe où dans la fenêtre, ou utilisez le bouton ci-dessous."
                    action={<ImportCta />}
                />
            </PageContainer>
        )
    }

    return (
        <PageContainer>
            {/* Héros */}
            {heroAlbum && (
                <section className="mb-9">
                    <div className="relative overflow-hidden rounded-2xl">
                        <div
                            className="absolute inset-0"
                            style={{ backgroundImage: gradientCss(`${heroAlbum.title} ${heroAlbum.artist}`) }}
                        />
                        {heroAlbum.artworkUrl && (
                            <div
                                className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
                                style={{ backgroundImage: `url(${heroAlbum.artworkUrl})` }}
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                        <div className="relative flex items-center gap-6 p-6 sm:p-8">
                            <Artwork
                                url={heroAlbum.artworkUrl}
                                seed={`${heroAlbum.title} ${heroAlbum.artist}`}
                                className="size-32 shadow-2xl sm:size-40"
                                rounded="rounded-xl"
                            />
                            <div className="min-w-0 flex-1">
                                <span className="text-[12px] font-semibold uppercase tracking-widest text-white/80">
                                    Dernier ajout
                                </span>
                                <h2 className="mt-1 truncate text-[clamp(22px,3.5vw,36px)] font-bold leading-tight text-white">
                                    {heroAlbum.title}
                                </h2>
                                <p className="truncate text-[15px] text-white/75">{heroAlbum.artist}</p>
                                <button
                                    type="button"
                                    onClick={() => player.playContext(heroAlbum.tracks, 0, false)}
                                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-[14px] font-semibold text-black shadow-lg transition hover:scale-[1.03]"
                                >
                                    <Play className="size-4 fill-current" />
                                    Lire
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Ajouts récents */}
            {recentAlbums.length > 0 && (
                <Shelf title="Ajoutés récemment" to="/recents">
                    {recentAlbums.map((album) => (
                        <div key={album.key} className="w-40 shrink-0 sm:w-44">
                            <AlbumCard album={album} />
                        </div>
                    ))}
                </Shelf>
            )}

            {/* Le plus écouté */}
            {mostPlayed.length >= 4 && (
                <Shelf title="Vous écoutez souvent" to="/songs">
                    {albumsFromTracks(mostPlayed, albums).slice(0, 12).map((album) => (
                        <div key={album.key} className="w-40 shrink-0 sm:w-44">
                            <AlbumCard album={album} />
                        </div>
                    ))}
                </Shelf>
            )}

            {/* Artistes */}
            {artists.length > 0 && (
                <Shelf title="Vos artistes" to="/artists">
                    {artists.slice(0, 12).map((artist) => (
                        <div key={artist.name} className="w-36 shrink-0 sm:w-40">
                            <ArtistCard artist={artist} />
                        </div>
                    ))}
                </Shelf>
            )}

            {/* Playlists */}
            {playlists.length > 0 && (
                <Shelf title="Vos playlists">
                    {playlists.map((pl) => {
                        const cover = pl.artwork_url ?? playlistTracks(pl.id).find((t) => t.artwork_url)?.artwork_url ?? null
                        const count = playlistTracks(pl.id).length
                        return (
                            <Link key={pl.id} to={`/playlists/${pl.id}`} className="group w-40 shrink-0 sm:w-44">
                                <Artwork
                                    url={cover}
                                    seed={pl.name}
                                    className="aspect-square w-full"
                                    rounded="rounded-lg"
                                />
                                <div className="mt-2 truncate text-[13px] font-medium group-hover:underline">
                                    {pl.name}
                                </div>
                                <div className="truncate text-[12px] text-muted">
                                    {plural(count, 'morceau', 'morceaux')}
                                </div>
                            </Link>
                        )
                    })}
                </Shelf>
            )}
        </PageContainer>
    )
}

/** Déduit une liste d'albums (uniques) à partir d'une liste de morceaux ordonnée. */
function albumsFromTracks(orderedTracks: { album: string; album_artist: string | null; artist: string }[], albums: import('@/types').Album[]) {
    const byKey = new Map(albums.map((a) => [a.key, a]))
    const seen = new Set<string>()
    const out: import('@/types').Album[] = []
    for (const t of orderedTracks) {
        const artist = t.album_artist || t.artist
        const key = `${t.album.toLowerCase().trim()}|${artist.toLowerCase().trim()}`
        if (seen.has(key)) continue
        seen.add(key)
        const al = byKey.get(key)
        if (al) out.push(al)
    }
    return out
}
