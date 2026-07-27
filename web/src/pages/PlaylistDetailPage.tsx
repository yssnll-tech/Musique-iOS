import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, ListPlus, ListMusic, MoreHorizontal, Pencil, Search, Trash2 } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import { useDialogs } from '@/components/DialogsProvider'
import { TrackList } from '@/components/TrackList'
import { DetailHeader } from '@/components/DetailHeader'
import { EmptyState, ImportCta, PageContainer, PlayShuffleButtons } from '@/components/common'
import { Spinner } from '@/components/Grid'
import { Menu, type MenuItem } from '@/components/Menu'
import { Modal } from '@/components/Modal'
import { Artwork } from '@/components/Artwork'
import { formatTime, formatTotalDuration, plural } from '@/lib/format'
import type { Track } from '@/types'

export function PlaylistDetailPage() {
    const { id = '' } = useParams()
    const navigate = useNavigate()
    const { playlists, playlistTracks, loading, renamePlaylist, deletePlaylist, tracks } = useLibrary()
    const dialogs = useDialogs()
    const [renaming, setRenaming] = useState(false)
    const [nameDraft, setNameDraft] = useState('')
    const [addOpen, setAddOpen] = useState(false)

    const playlist = playlists.find((p) => p.id === id)
    const list = useMemo(() => (playlist ? playlistTracks(playlist.id) : []), [playlist, playlistTracks])

    if (loading) return <Spinner />
    if (!playlist) {
        return (
            <PageContainer>
                <p className="text-muted">Playlist introuvable.</p>
                <Link to="/" className="mt-2 inline-block text-accent hover:underline">
                    ← Accueil
                </Link>
            </PageContainer>
        )
    }

    const artworkUrl = playlist.artwork_url ?? list.find((t) => t.artwork_url)?.artwork_url ?? null
    const totalDuration = list.reduce((sum, t) => sum + t.duration, 0)
    const meta = list.length
        ? `${plural(list.length, 'morceau', 'morceaux')} · ${formatTotalDuration(totalDuration)}`
        : 'Playlist vide'

    const submitRename = () => {
        const next = nameDraft.trim()
        if (next && next !== playlist.name) void renamePlaylist(playlist.id, next)
        setRenaming(false)
    }

    const menuItems: MenuItem[] = [
        {
            label: 'Ajouter des morceaux',
            icon: <ListPlus className="size-4" />,
            onClick: () => setAddOpen(true),
        },
        {
            label: 'Renommer',
            icon: <Pencil className="size-4" />,
            onClick: () => {
                setNameDraft(playlist.name)
                setRenaming(true)
            },
        },
        'separator',
        {
            label: 'Supprimer la playlist',
            icon: <Trash2 className="size-4" />,
            danger: true,
            onClick: () =>
                dialogs.confirm({
                    title: 'Supprimer la playlist',
                    message: `Supprimer « ${playlist.name} » ? Les morceaux restent dans votre bibliothèque.`,
                    confirmLabel: 'Supprimer',
                    danger: true,
                    onConfirm: () => {
                        void deletePlaylist(playlist.id)
                        navigate('/')
                    },
                }),
        },
    ]

    return (
        <PageContainer>
            <DetailHeader
                artworkUrl={artworkUrl}
                seed={playlist.name}
                eyebrow="Playlist"
                title={
                    renaming ? (
                        <input
                            autoFocus
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            onBlur={submitRename}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') submitRename()
                                if (e.key === 'Escape') setRenaming(false)
                            }}
                            className="w-full max-w-md rounded-lg border border-line bg-black/30 px-2 py-1 text-[32px] font-bold outline-none focus:border-accent"
                        />
                    ) : (
                        playlist.name
                    )
                }
                subtitle={playlist.description || undefined}
                meta={meta}
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        {list.length > 0 && <PlayShuffleButtons tracks={list} />}
                        <button
                            type="button"
                            onClick={() => setAddOpen(true)}
                            className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-[14px] font-semibold text-ink transition hover:bg-white/15"
                        >
                            <ListPlus className="size-4" />
                            Ajouter
                        </button>
                        <Menu
                            items={menuItems}
                            ariaLabel="Options de la playlist"
                            className="grid size-9 place-items-center rounded-full bg-white/10 text-ink transition hover:bg-white/15"
                        >
                            <MoreHorizontal className="size-5" />
                        </Menu>
                    </div>
                }
            />

            {list.length === 0 ? (
                <EmptyState
                    icon={<ListMusic className="size-10" />}
                    title="Playlist vide"
                    message="Ajoutez des morceaux depuis votre bibliothèque avec le bouton « Ajouter », ou via le menu « … » d'un morceau."
                    action={tracks.length === 0 ? <ImportCta /> : undefined}
                />
            ) : (
                <TrackList tracks={list} variant="playlist" playlistId={playlist.id} showHeader />
            )}

            <AddTracksSheet
                open={addOpen}
                onClose={() => setAddOpen(false)}
                playlistId={playlist.id}
                existingIds={new Set(list.map((t) => t.id))}
            />
        </PageContainer>
    )
}

/** Panneau modal : choisir des morceaux de la bibliothèque à ajouter à la playlist. */
function AddTracksSheet({
    open,
    onClose,
    playlistId,
    existingIds,
}: {
    open: boolean
    onClose: () => void
    playlistId: string
    existingIds: Set<string>
}) {
    const { tracks, addToPlaylist } = useLibrary()
    const [query, setQuery] = useState('')
    const [added, setAdded] = useState<Set<string>>(new Set())

    const candidates = useMemo(() => {
        const q = query.trim().toLowerCase()
        return tracks.filter((t) => {
            if (!q) return true
            return (
                t.title.toLowerCase().includes(q) ||
                t.artist.toLowerCase().includes(q) ||
                t.album.toLowerCase().includes(q)
            )
        })
    }, [tracks, query])

    const handleAdd = async (t: Track) => {
        setAdded((prev) => new Set(prev).add(t.id))
        await addToPlaylist(playlistId, [t.id])
    }

    return (
        <Modal open={open} onClose={onClose} title="Ajouter des morceaux" wide>
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2">
                <Search className="size-4 text-muted" />
                <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher dans la bibliothèque"
                    className="w-full bg-transparent text-[14px] outline-none placeholder:text-faint"
                />
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
                {candidates.length === 0 && (
                    <p className="py-6 text-center text-[13px] text-muted">Aucun morceau.</p>
                )}
                {candidates.map((t) => {
                    const inPlaylist = existingIds.has(t.id) || added.has(t.id)
                    return (
                        <div
                            key={t.id}
                            className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5"
                        >
                            <Artwork
                                url={t.artwork_url}
                                seed={`${t.album} ${t.artist}`}
                                className="size-10"
                            />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[14px] font-medium">{t.title}</div>
                                <div className="truncate text-[12px] text-muted">{t.artist}</div>
                            </div>
                            <span className="text-[12px] tabular-nums text-faint">
                                {formatTime(t.duration)}
                            </span>
                            <button
                                type="button"
                                disabled={inPlaylist}
                                onClick={() => void handleAdd(t)}
                                className={
                                    inPlaylist
                                        ? 'grid size-8 place-items-center rounded-full text-[#30d158]'
                                        : 'grid size-8 place-items-center rounded-full bg-accent text-white transition hover:brightness-110'
                                }
                                aria-label={inPlaylist ? 'Déjà ajouté' : 'Ajouter'}
                            >
                                {inPlaylist ? <Check className="size-4" /> : <ListPlus className="size-4" />}
                            </button>
                        </div>
                    )
                })}
            </div>
        </Modal>
    )
}
