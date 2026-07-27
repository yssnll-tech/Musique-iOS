import { Clock } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { AlbumCard } from '@/components/Cards'
import { CardGrid, Spinner } from '@/components/Grid'
import { EmptyState, ImportCta, PageContainer, PageTitle } from '@/components/common'

export function RecentsPage() {
    const { albums, tracks, loading } = useLibrary()

    if (loading) return <Spinner />

    if (tracks.length === 0) {
        return (
            <PageContainer>
                <PageTitle>Ajouts récents</PageTitle>
                <EmptyState
                    icon={<Clock className="size-10" />}
                    title="Rien de récent"
                    message="Importez de la musique : vos ajouts les plus récents s'afficheront ici en premier."
                    action={<ImportCta />}
                />
            </PageContainer>
        )
    }

    // Albums triés par ajout le plus récent d'un de leurs morceaux.
    const recentAlbums = [...albums].sort((a, b) => {
        const la = Math.max(...a.tracks.map((t) => new Date(t.created_at).getTime()))
        const lb = Math.max(...b.tracks.map((t) => new Date(t.created_at).getTime()))
        return lb - la
    })

    return (
        <PageContainer>
            <PageTitle subtitle="Ce que vous avez importé dernièrement">Ajouts récents</PageTitle>
            <CardGrid>
                {recentAlbums.map((album) => (
                    <AlbumCard key={album.key} album={album} />
                ))}
            </CardGrid>
        </PageContainer>
    )
}
