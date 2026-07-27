import { MicVocal } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { ArtistCard } from '@/components/Cards'
import { CardGrid, Spinner } from '@/components/Grid'
import { EmptyState, ImportCta, PageContainer, PageTitle } from '@/components/common'
import { plural } from '@/lib/format'

export function ArtistsPage() {
    const { artists, loading } = useLibrary()

    if (loading) return <Spinner />

    if (artists.length === 0) {
        return (
            <PageContainer>
                <PageTitle>Artistes</PageTitle>
                <EmptyState
                    icon={<MicVocal className="size-10" />}
                    title="Aucun artiste"
                    message="Vos artistes apparaîtront ici dès que vous aurez importé de la musique."
                    action={<ImportCta />}
                />
            </PageContainer>
        )
    }

    return (
        <PageContainer>
            <PageTitle subtitle={plural(artists.length, 'artiste')}>Artistes</PageTitle>
            <CardGrid>
                {artists.map((artist) => (
                    <ArtistCard key={artist.name} artist={artist} />
                ))}
            </CardGrid>
        </PageContainer>
    )
}
