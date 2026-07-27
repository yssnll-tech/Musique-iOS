import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { Album, Artist } from '@/types'
import { usePlayer } from '@/context/PlayerContext'
import { Artwork } from './Artwork'

function PlayFab({ onClick, className }: { onClick: () => void; className?: string }) {
    return (
        <button
            type="button"
            aria-label="Lire"
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onClick()
            }}
            className={cn(
                'absolute bottom-2 right-2 grid size-10 translate-y-1 place-items-center rounded-full bg-accent text-white opacity-0 shadow-lg transition duration-200 hover:brightness-110 group-hover:translate-y-0 group-hover:opacity-100',
                className,
            )}
        >
            <Play className="size-5 translate-x-[1px] fill-current" />
        </button>
    )
}

export function AlbumCard({ album }: { album: Album }) {
    const player = usePlayer()
    const to = `/albums/${encodeURIComponent(album.key)}`
    return (
        <div className="group">
            <div className="relative">
                <Link to={to} className="block">
                    <Artwork
                        url={album.artworkUrl}
                        seed={`${album.title} ${album.artist}`}
                        className="aspect-square w-full"
                        rounded="rounded-lg"
                    />
                </Link>
                <PlayFab onClick={() => player.playContext(album.tracks, 0)} />
            </div>
            <Link
                to={to}
                className="mt-2 block truncate text-[13px] font-medium text-ink hover:underline"
            >
                {album.title}
            </Link>
            <Link
                to={`/artists/${encodeURIComponent(album.artist)}`}
                className="block truncate text-[12px] text-muted hover:underline"
            >
                {album.artist}
            </Link>
        </div>
    )
}

export function ArtistCard({ artist }: { artist: Artist }) {
    const to = `/artists/${encodeURIComponent(artist.name)}`
    return (
        <div className="group flex flex-col items-center text-center">
            <Link to={to} className="block w-full">
                <Artwork
                    url={artist.artworkUrl}
                    seed={artist.name}
                    className="aspect-square w-full"
                    rounded="rounded-full"
                />
            </Link>
            <Link
                to={to}
                className="mt-2 block w-full truncate text-[13px] font-medium text-ink hover:underline"
            >
                {artist.name}
            </Link>
            <span className="truncate text-[12px] text-muted">Artiste</span>
        </div>
    )
}
