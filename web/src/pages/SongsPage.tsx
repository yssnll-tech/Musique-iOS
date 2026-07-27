import { useMemo, useState } from 'react'
import { Music2 } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { TrackList } from '@/components/TrackList'
import {
    EmptyState,
    ImportCta,
    PageContainer,
    PageTitle,
    PlayShuffleButtons,
} from '@/components/common'
import { Spinner } from '@/components/Grid'
import { plural } from '@/lib/format'
import { cn } from '@/lib/cn'

type SortKey = 'title' | 'artist' | 'album' | 'recent'

const SORTS: { key: SortKey; label: string }[] = [
    { key: 'recent', label: 'Ajouts récents' },
    { key: 'title', label: 'Titre' },
    { key: 'artist', label: 'Artiste' },
    { key: 'album', label: 'Album' },
]

export function SongsPage() {
    const { tracks, loading } = useLibrary()
    const [sort, setSort] = useState<SortKey>('recent')

    const sorted = useMemo(() => {
        const copy = [...tracks]
        switch (sort) {
            case 'title':
                return copy.sort((a, b) => a.title.localeCompare(b.title))
            case 'artist':
                return copy.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title))
            case 'album':
                return copy.sort((a, b) => a.album.localeCompare(b.album) || a.title.localeCompare(b.title))
            default:
                return copy // déjà trié par created_at desc
        }
    }, [tracks, sort])

    if (loading) return <Spinner />

    if (tracks.length === 0) {
        return (
            <PageContainer>
                <PageTitle>Morceaux</PageTitle>
                <EmptyState
                    icon={<Music2 className="size-10" />}
                    title="Aucun morceau"
                    message="Importez vos fichiers audio pour construire votre bibliothèque. Glissez-les n'importe où, ou utilisez le bouton ci-dessous."
                    action={<ImportCta />}
                />
            </PageContainer>
        )
    }

    return (
        <PageContainer>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold tracking-tight">Morceaux</h1>
                    <p className="mt-1 text-[14px] text-muted">{plural(tracks.length, 'morceau', 'morceaux')}</p>
                </div>
                <PlayShuffleButtons tracks={sorted} />
            </div>

            <div className="mb-3 flex items-center gap-1.5">
                {SORTS.map((s) => (
                    <button
                        key={s.key}
                        type="button"
                        onClick={() => setSort(s.key)}
                        className={cn(
                            'rounded-full px-3 py-1 text-[12px] font-medium transition',
                            sort === s.key
                                ? 'bg-white/15 text-ink'
                                : 'text-muted hover:bg-white/5 hover:text-ink',
                        )}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <TrackList tracks={sorted} variant="library" showHeader />
        </PageContainer>
    )
}
