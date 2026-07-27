import { useMemo, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { AlbumCard } from '@/components/Cards'
import { CardGrid, Spinner } from '@/components/Grid'
import { EmptyState, ImportCta, PageContainer, PageTitle } from '@/components/common'
import { cn } from '@/lib/cn'

export function BrowsePage() {
    const { albums, tracks, loading } = useLibrary()
    const [genre, setGenre] = useState<string | null>(null)

    const genres = useMemo(() => {
        const set = new Set<string>()
        for (const t of tracks) if (t.genre) set.add(t.genre)
        return [...set].sort((a, b) => a.localeCompare(b))
    }, [tracks])

    const shown = useMemo(() => {
        if (!genre) return albums
        return albums.filter((a) => a.tracks.some((t) => t.genre === genre))
    }, [albums, genre])

    if (loading) return <Spinner />

    if (albums.length === 0) {
        return (
            <PageContainer>
                <PageTitle>Parcourir</PageTitle>
                <EmptyState
                    icon={<LayoutGrid className="size-10" />}
                    title="Rien à parcourir"
                    message="Importez de la musique pour explorer votre bibliothèque par genre et par album."
                    action={<ImportCta />}
                />
            </PageContainer>
        )
    }

    return (
        <PageContainer>
            <PageTitle subtitle="Toute votre bibliothèque, par genre">Parcourir</PageTitle>

            {genres.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                    <Chip active={genre === null} onClick={() => setGenre(null)}>
                        Tous
                    </Chip>
                    {genres.map((g) => (
                        <Chip key={g} active={genre === g} onClick={() => setGenre(g)}>
                            {g}
                        </Chip>
                    ))}
                </div>
            )}

            <CardGrid>
                {shown.map((album) => (
                    <AlbumCard key={album.key} album={album} />
                ))}
            </CardGrid>
        </PageContainer>
    )
}

function Chip({
    children,
    active,
    onClick,
}: {
    children: React.ReactNode
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'rounded-full px-4 py-1.5 text-[13px] font-medium transition',
                active ? 'bg-accent text-white' : 'bg-white/10 text-ink hover:bg-white/15',
            )}
        >
            {children}
        </button>
    )
}
