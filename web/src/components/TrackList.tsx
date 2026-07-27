import { Link, useNavigate } from 'react-router-dom'
import { Heart, ListPlus, MoreHorizontal, Pencil, Play, Trash2, User, Disc3, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatTime } from '@/lib/format'
import { albumKey } from '@/lib/keys'
import type { Track } from '@/types'
import { useLibrary } from '@/context/LibraryContext'
import { usePlayer } from '@/context/PlayerContext'
import { useDialogs } from './DialogsProvider'
import { Artwork } from './Artwork'
import { EqBars } from './EqBars'
import { Menu, type MenuItem } from './Menu'

interface TrackListProps {
    tracks: Track[]
    variant?: 'library' | 'album' | 'playlist'
    playlistId?: string
    albumArtist?: string
    showHeader?: boolean
}

export function TrackList({
    tracks,
    variant = 'library',
    playlistId,
    albumArtist,
    showHeader,
}: TrackListProps) {
    return (
        <div className="flex flex-col">
            {showHeader && (
                <div className="mb-1 flex items-center gap-3 border-b border-line px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-faint">
                    <span className="w-6 text-center">#</span>
                    <span className="flex-1">Titre</span>
                    <span className="hidden w-[26%] lg:block">Album</span>
                    <span className="w-10 text-right">Durée</span>
                    <span className="w-14" />
                </div>
            )}
            {tracks.map((track, i) => (
                <Row
                    key={variant === 'playlist' ? `${track.id}-${i}` : track.id}
                    track={track}
                    index={i}
                    tracks={tracks}
                    variant={variant}
                    playlistId={playlistId}
                    albumArtist={albumArtist}
                />
            ))}
        </div>
    )
}

function Row({
    track,
    index,
    tracks,
    variant,
    playlistId,
    albumArtist,
}: {
    track: Track
    index: number
    tracks: Track[]
    variant: 'library' | 'album' | 'playlist'
    playlistId?: string
    albumArtist?: string
}) {
    const player = usePlayer()
    const { toggleLike, deleteTrack, removeFromPlaylist } = useLibrary()
    const dialogs = useDialogs()
    const navigate = useNavigate()

    const isCurrent = player.isCurrent(track.id)
    const isPlayingThis = isCurrent && player.isPlaying
    const artistName = track.album_artist || track.artist
    const showArtistSubtitle = variant !== 'album' || (albumArtist && track.artist !== albumArtist)

    const play = () => player.playContext(tracks, index)

    const menuItems: MenuItem[] = [
        {
            label: 'Ajouter à une playlist',
            icon: <ListPlus className="size-4" />,
            onClick: () => dialogs.addTracksToPlaylist([track.id]),
        },
        {
            label: track.liked ? "Je n'aime plus" : "J'aime",
            icon: <Heart className={cn('size-4', track.liked && 'fill-current')} />,
            onClick: () => void toggleLike(track),
        },
        {
            label: 'Aller à l\'album',
            icon: <Disc3 className="size-4" />,
            onClick: () => navigate(`/albums/${encodeURIComponent(albumKey(track.album, artistName))}`),
        },
        {
            label: "Aller à l'artiste",
            icon: <User className="size-4" />,
            onClick: () => navigate(`/artists/${encodeURIComponent(artistName)}`),
        },
        {
            label: 'Modifier les infos',
            icon: <Pencil className="size-4" />,
            onClick: () => dialogs.editTrack(track),
        },
        'separator',
        ...(playlistId
            ? [
                  {
                      label: 'Retirer de la playlist',
                      icon: <X className="size-4" />,
                      onClick: () => void removeFromPlaylist(playlistId, track.id),
                  } as MenuItem,
              ]
            : []),
        {
            label: 'Supprimer de la bibliothèque',
            icon: <Trash2 className="size-4" />,
            danger: true,
            onClick: () =>
                dialogs.confirm({
                    title: 'Supprimer le morceau',
                    message: `Supprimer « ${track.title} » de votre bibliothèque ? Cette action est définitive.`,
                    confirmLabel: 'Supprimer',
                    danger: true,
                    onConfirm: () => void deleteTrack(track.id),
                }),
        },
    ]

    return (
        <div
            onDoubleClick={play}
            onClick={play}
            className={cn(
                'group flex cursor-default items-center gap-3 rounded-md px-3 py-1.5 transition',
                'hover:bg-white/[0.06]',
                isCurrent && 'bg-white/[0.04]',
            )}
        >
            {/* Indicateur / numéro / bouton lecture */}
            {variant === 'album' ? (
                <div className="grid w-6 shrink-0 place-items-center text-[13px]">
                    {isCurrent ? (
                        <EqBars paused={!player.isPlaying} />
                    ) : (
                        <>
                            <span className="tabular-nums text-muted group-hover:hidden">
                                {track.track_no ?? index + 1}
                            </span>
                            <Play className="hidden size-3.5 fill-current text-ink group-hover:block" />
                        </>
                    )}
                </div>
            ) : (
                <div className="relative size-10 shrink-0">
                    <Artwork
                        url={track.artwork_url}
                        seed={`${track.album} ${artistName}`}
                        className="size-10"
                    />
                    <div
                        className={cn(
                            'absolute inset-0 grid place-items-center rounded-md bg-black/45 transition',
                            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                        )}
                    >
                        {isPlayingThis ? (
                            <EqBars />
                        ) : (
                            <Play className="size-4 fill-current text-white" />
                        )}
                    </div>
                </div>
            )}

            {/* Titre + artiste */}
            <div className="min-w-0 flex-1">
                <div
                    className={cn(
                        'truncate text-[14px]',
                        isCurrent ? 'font-medium text-accent' : 'text-ink',
                    )}
                >
                    {track.title}
                </div>
                {showArtistSubtitle && (
                    <div className="truncate text-[12px] text-muted">{track.artist}</div>
                )}
            </div>

            {/* Album (variante bibliothèque) */}
            {variant !== 'album' && (
                <Link
                    to={`/albums/${encodeURIComponent(albumKey(track.album, artistName))}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hidden w-[26%] truncate text-[13px] text-muted hover:text-ink hover:underline lg:block"
                >
                    {track.album}
                </Link>
            )}

            {/* J'aime */}
            <button
                type="button"
                aria-label={track.liked ? "Je n'aime plus" : "J'aime"}
                onClick={(e) => {
                    e.stopPropagation()
                    void toggleLike(track)
                }}
                className={cn(
                    'shrink-0 transition',
                    track.liked
                        ? 'text-accent'
                        : 'text-muted opacity-0 hover:text-ink group-hover:opacity-100',
                )}
            >
                <Heart className={cn('size-4', track.liked && 'fill-current')} />
            </button>

            {/* Durée */}
            <span className="w-10 shrink-0 text-right text-[13px] tabular-nums text-muted">
                {formatTime(track.duration)}
            </span>

            {/* Menu */}
            <Menu
                items={menuItems}
                ariaLabel="Plus d'options"
                className="grid size-7 shrink-0 place-items-center rounded-full text-muted opacity-0 transition hover:bg-white/10 hover:text-ink group-hover:opacity-100 data-[open=true]:opacity-100"
            >
                <MoreHorizontal className="size-[18px]" />
            </Menu>
        </div>
    )
}
