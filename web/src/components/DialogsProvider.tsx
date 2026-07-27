import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { ListPlus, Plus } from 'lucide-react'
import { useLibrary } from '@/context/LibraryContext'
import type { PlaylistRow, Track } from '@/types'
import { Artwork } from './Artwork'
import { Modal, DialogButton } from './Modal'
import { cn } from '@/lib/cn'

interface ConfirmOptions {
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
    onConfirm: () => void
}

interface DialogsValue {
    addTracksToPlaylist: (trackIds: string[]) => void
    editTrack: (track: Track) => void
    newPlaylist: (onCreated?: (pl: PlaylistRow) => void) => void
    confirm: (opts: ConfirmOptions) => void
}

const DialogsContext = createContext<DialogsValue | null>(null)

export function useDialogs(): DialogsValue {
    const ctx = useContext(DialogsContext)
    if (!ctx) throw new Error('useDialogs doit être utilisé dans <DialogsProvider>')
    return ctx
}

const inputClass =
    'w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-[14px] text-ink placeholder:text-faint outline-none transition focus:border-accent'

export function DialogsProvider({ children }: { children: ReactNode }) {
    const library = useLibrary()
    const [pickerIds, setPickerIds] = useState<string[] | null>(null)
    const [creatingInPicker, setCreatingInPicker] = useState(false)
    const [pickerNewName, setPickerNewName] = useState('')

    const [editing, setEditing] = useState<Track | null>(null)
    const [editForm, setEditForm] = useState({
        title: '',
        artist: '',
        album: '',
        year: '',
        genre: '',
    })

    const [newPlaylistState, setNewPlaylistState] = useState<{
        open: boolean
        onCreated?: (pl: PlaylistRow) => void
    }>({ open: false })
    const [newName, setNewName] = useState('')

    const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null)

    const addTracksToPlaylist = useCallback((trackIds: string[]) => {
        if (!trackIds.length) return
        setCreatingInPicker(false)
        setPickerNewName('')
        setPickerIds(trackIds)
    }, [])

    const editTrack = useCallback((track: Track) => {
        setEditForm({
            title: track.title,
            artist: track.artist,
            album: track.album,
            year: track.year ? String(track.year) : '',
            genre: track.genre ?? '',
        })
        setEditing(track)
    }, [])

    const newPlaylist = useCallback((onCreated?: (pl: PlaylistRow) => void) => {
        setNewName('')
        setNewPlaylistState({ open: true, onCreated })
    }, [])

    const confirm = useCallback((opts: ConfirmOptions) => setConfirmState(opts), [])

    // ---- Actions ----
    const chooseExisting = async (pl: PlaylistRow) => {
        if (pickerIds) await library.addToPlaylist(pl.id, pickerIds)
        setPickerIds(null)
    }

    const createFromPicker = async () => {
        const name = pickerNewName.trim()
        if (!name) return
        const pl = await library.createPlaylist(name)
        if (pl && pickerIds) await library.addToPlaylist(pl.id, pickerIds)
        setPickerIds(null)
    }

    const saveEdit = async () => {
        if (!editing) return
        const yearNum = parseInt(editForm.year, 10)
        await library.updateTrack(editing.id, {
            title: editForm.title.trim() || editing.title,
            artist: editForm.artist.trim() || 'Artiste inconnu',
            album: editForm.album.trim() || 'Album inconnu',
            year: Number.isFinite(yearNum) ? yearNum : null,
            genre: editForm.genre.trim() || null,
        })
        setEditing(null)
    }

    const createStandalone = async () => {
        const name = newName.trim()
        if (!name) return
        const pl = await library.createPlaylist(name)
        const cb = newPlaylistState.onCreated
        setNewPlaylistState({ open: false })
        if (pl && cb) cb(pl)
    }

    const value: DialogsValue = { addTracksToPlaylist, editTrack, newPlaylist, confirm }

    return (
        <DialogsContext.Provider value={value}>
            {children}

            {/* Ajouter à une playlist */}
            <Modal
                open={pickerIds !== null}
                onClose={() => setPickerIds(null)}
                title={
                    pickerIds && pickerIds.length > 1
                        ? `Ajouter ${pickerIds.length} morceaux à…`
                        : 'Ajouter à une playlist'
                }
            >
                <div className="flex flex-col gap-1">
                    <button
                        type="button"
                        onClick={() => setCreatingInPicker((v) => !v)}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/10"
                    >
                        <span className="grid size-11 place-items-center rounded-md bg-white/10 text-accent">
                            <Plus className="size-5" />
                        </span>
                        <span className="text-[14px] font-medium">Nouvelle playlist</span>
                    </button>

                    {creatingInPicker && (
                        <div className="flex gap-2 px-2 pb-2">
                            <input
                                autoFocus
                                value={pickerNewName}
                                onChange={(e) => setPickerNewName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && createFromPicker()}
                                placeholder="Nom de la playlist"
                                className={inputClass}
                            />
                            <DialogButton variant="primary" onClick={createFromPicker}>
                                Créer
                            </DialogButton>
                        </div>
                    )}

                    <div className="mt-1 max-h-72 overflow-y-auto">
                        {library.playlists.length === 0 && !creatingInPicker && (
                            <p className="px-2 py-4 text-center text-[13px] text-muted">
                                Aucune playlist pour l'instant.
                            </p>
                        )}
                        {library.playlists.map((pl) => (
                            <button
                                key={pl.id}
                                type="button"
                                onClick={() => chooseExisting(pl)}
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/10"
                            >
                                <Artwork
                                    url={pl.artwork_url}
                                    seed={pl.name}
                                    className="size-11"
                                    rounded="rounded-md"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[14px] font-medium">
                                        {pl.name}
                                    </span>
                                    <span className="block truncate text-[12px] text-muted">
                                        {library.playlistTrackIds(pl.id).length} morceaux
                                    </span>
                                </span>
                                <ListPlus className="size-4 text-muted" />
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* Modifier les infos */}
            <Modal
                open={editing !== null}
                onClose={() => setEditing(null)}
                title="Informations"
                footer={
                    <>
                        <DialogButton onClick={() => setEditing(null)}>Annuler</DialogButton>
                        <DialogButton variant="primary" onClick={saveEdit}>
                            Enregistrer
                        </DialogButton>
                    </>
                }
            >
                {editing && (
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-center pb-1">
                            <Artwork
                                url={editing.artwork_url}
                                seed={`${editing.album} ${editing.artist}`}
                                className="size-28"
                                rounded="rounded-lg"
                            />
                        </div>
                        <Field label="Titre">
                            <input
                                value={editForm.title}
                                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                                className={inputClass}
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Artiste">
                                <input
                                    value={editForm.artist}
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, artist: e.target.value }))
                                    }
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Album">
                                <input
                                    value={editForm.album}
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, album: e.target.value }))
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Année">
                                <input
                                    value={editForm.year}
                                    inputMode="numeric"
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, year: e.target.value }))
                                    }
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Genre">
                                <input
                                    value={editForm.genre}
                                    onChange={(e) =>
                                        setEditForm((f) => ({ ...f, genre: e.target.value }))
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Nouvelle playlist (autonome) */}
            <Modal
                open={newPlaylistState.open}
                onClose={() => setNewPlaylistState({ open: false })}
                title="Nouvelle playlist"
                footer={
                    <>
                        <DialogButton onClick={() => setNewPlaylistState({ open: false })}>
                            Annuler
                        </DialogButton>
                        <DialogButton variant="primary" onClick={createStandalone}>
                            Créer
                        </DialogButton>
                    </>
                }
            >
                <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createStandalone()}
                    placeholder="Nom de la playlist"
                    className={inputClass}
                />
            </Modal>

            {/* Confirmation */}
            <Modal
                open={confirmState !== null}
                onClose={() => setConfirmState(null)}
                title={confirmState?.title ?? ''}
                footer={
                    <>
                        <DialogButton onClick={() => setConfirmState(null)}>Annuler</DialogButton>
                        <DialogButton
                            variant={confirmState?.danger ? 'danger' : 'primary'}
                            onClick={() => {
                                confirmState?.onConfirm()
                                setConfirmState(null)
                            }}
                        >
                            {confirmState?.confirmLabel ?? 'Confirmer'}
                        </DialogButton>
                    </>
                }
            >
                <p className="text-[14px] leading-relaxed text-muted">{confirmState?.message}</p>
            </Modal>
        </DialogsContext.Provider>
    )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <label className={cn('flex flex-col gap-1.5')}>
            <span className="text-[11px] font-medium uppercase tracking-wide text-faint">{label}</span>
            {children}
        </label>
    )
}
