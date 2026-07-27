import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { AlbumCard, ArtistCard } from '@/components/Cards'
import { CardGrid } from '@/components/Grid'
import { TrackList } from '@/components/TrackList'
import { EmptyState, PageContainer } from '@/components/common'

export function SearchPage() {
    const [params] = useSearchParams()
    const q = (params.get('q') ?? '').trim()
    const query = q.toLowerCase()
    const { tracks, albums, artists } = useLibrary()

    const results = useMemo(() => {
        if (!query) return { tracks: [], albums: [], artists: [] }
        return {
            tracks: tracks
                .filter(
                    (t) =>
                        t.title.toLowerCase().includes(query) ||
                        t.artist.toLowerCase().includes(query) ||
                        t.album.toLowerCase().includes(query),
                )
                .slice(0, 40),
            albums: albums
                .filter(
                    (a) =>
                        a.title.toLowerCase().includes(query) ||
                        a.artist.toLowerCase().includes(query),
                )
                .slice(0, 12),
            artists: artists.filter((a) => a.name.toLowerCase().includes(query)).slice(0, 12),
        }
    }, [query, tracks, albums, artists])

    if (!q) {
        return (
            <PageContainer>
                <EmptyState
                    icon={<SearchIcon className="size-10" />}
                    title="Rechercher dans votre musique"
                    message="Tapez un titre, un artiste ou un album dans le champ de recherche de la barre latérale."
                />
            </PageContainer>
        )
    }

    const total = results.tracks.length + results.albums.length + results.artists.length
    if (total === 0) {
        return (
            <PageContainer>
                <EmptyState
                    icon={<SearchIcon className="size-10" />}
                    title={`Aucun résultat pour « ${q} »`}
                    message="Vérifiez l'orthographe ou essayez d'autres mots-clés."
                />
            </PageContainer>
        )
    }

    return (
        <PageContainer>
            <h1 className="mb-6 text-[28px] font-bold tracking-tight">
                Résultats pour « <span className="text-accent">{q}</span> »
            </h1>

            {results.artists.length > 0 && (
                <section className="mb-9">
                    <h2 className="mb-3 text-[20px] font-bold tracking-tight">Artistes</h2>
                    <CardGrid>
                        {results.artists.map((a) => (
                            <ArtistCard key={a.name} artist={a} />
                        ))}
                    </CardGrid>
                </section>
            )}

            {results.albums.length > 0 && (
                <section className="mb-9">
                    <h2 className="mb-3 text-[20px] font-bold tracking-tight">Albums</h2>
                    <CardGrid>
                        {results.albums.map((a) => (
                            <AlbumCard key={a.key} album={a} />
                        ))}
                    </CardGrid>
                </section>
            )}

            {results.tracks.length > 0 && (
                <section>
                    <h2 className="mb-3 text-[20px] font-bold tracking-tight">Morceaux</h2>
                    <TrackList tracks={results.tracks} variant="library" />
                </section>
            )}
        </PageContainer>
    )
}
