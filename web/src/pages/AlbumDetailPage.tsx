import { Link, useParams } from 'react-router-dom'
import { useLibrary } from '@/context/LibraryContext'
import { TrackList } from '@/components/TrackList'
import { DetailHeader } from '@/components/DetailHeader'
import { PageContainer, PlayShuffleButtons } from '@/components/common'
import { Spinner } from '@/components/Grid'
import { formatTotalDuration, plural } from '@/lib/format'

export function AlbumDetailPage() {
    const { key = '' } = useParams()
    const { albumByKey, loading } = useLibrary()
    const album = albumByKey(decodeURIComponent(key))

    if (loading) return <Spinner />
    if (!album) {
        return (
            <PageContainer>
                <p className="text-muted">Album introuvable.</p>
                <Link to="/albums" className="mt-2 inline-block text-accent hover:underline">
                    ← Retour aux albums
                </Link>
            </PageContainer>
        )
    }

    const totalDuration = album.tracks.reduce((sum, t) => sum + t.duration, 0)
    const meta = [
        album.year ? String(album.year) : null,
        plural(album.tracks.length, 'morceau', 'morceaux'),
        formatTotalDuration(totalDuration),
    ]
        .filter(Boolean)
        .join(' · ')

    return (
        <PageContainer>
            <DetailHeader
                artworkUrl={album.artworkUrl}
                seed={`${album.title} ${album.artist}`}
                eyebrow="Album"
                title={album.title}
                subtitle={
                    <Link
                        to={`/artists/${encodeURIComponent(album.artist)}`}
                        className="font-medium text-accent hover:underline"
                    >
                        {album.artist}
                    </Link>
                }
                meta={meta}
                actions={<PlayShuffleButtons tracks={album.tracks} />}
            />
            <TrackList tracks={album.tracks} variant="album" albumArtist={album.artist} />
        </PageContainer>
    )
}
