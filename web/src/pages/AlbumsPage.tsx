import { Disc3 } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { AlbumCard } from '@/components/Cards'
import { CardGrid, Spinner } from '@/components/Grid'
import { EmptyState, ImportCta, PageContainer, PageTitle } from '@/components/common'
import { plural } from '@/lib/format'

export function AlbumsPage() {
    const { albums, loading } = useLibrary()

    if (loading) return <Spinner />

    if (albums.length === 0) {
        return (
            <PageContainer>
                <PageTitle>Albums</PageTitle>
                <EmptyState
                    icon={<Disc3 className="size-10" />}
                    title="Aucun album"
                    message="Vos albums apparaîtront ici dès que vous aurez importé de la musique."
                    action={<ImportCta />}
                />
            </PageContainer>
        )
    }

    return (
        <PageContainer>
            <PageTitle subtitle={plural(albums.length, 'album')}>Albums</PageTitle>
            <CardGrid>
                {albums.map((album) => (
                    <AlbumCard key={album.key} album={album} />
                ))}
            </CardGrid>
        </PageContainer>
    )
}
