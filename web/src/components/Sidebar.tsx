import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
    CirclePlay,
    Clock,
    Disc3,
    LayoutGrid,
    MicVocal,
    Music2,
    Plus,
    Radio,
    Search,
    Upload,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLibrary } from '@/context/LibraryContext'
import { useImport } from './ImportProvider'
import { useDialogs } from './DialogsProvider'
import { useUi } from './UiContext'
import { Artwork } from './Artwork'

export function Sidebar() {
    const { playlists, playlistTrackIds } = useLibrary()
    const { open: openImport } = useImport()
    const { newPlaylist } = useDialogs()
    const { navOpen, closeNav } = useUi()
    const navigate = useNavigate()
    const [query, setQuery] = useState('')

    const onSearch = (value: string) => {
        setQuery(value)
        navigate(value.trim() ? `/search?q=${encodeURIComponent(value.trim())}` : '/search')
    }

    return (
        <aside
            className={cn(
                'glass glass-hi flex flex-col border-r border-line pt-[env(safe-area-inset-top)] md:pt-0',
                // Mobile : tiroir coulissant par-dessus le contenu.
                'fixed inset-y-0 left-0 z-50 w-[280px] max-w-[82vw] transition-transform duration-300 ease-out',
                // Bureau / iPad large : colonne fixe dans le flux.
                'md:static md:z-auto md:w-[260px] md:max-w-none md:translate-x-0',
                navOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
            )}
        >
            {/* Recherche */}
            <div className="px-3 pb-2 pt-3">
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 focus-within:bg-white/15">
                    <Search className="size-4 shrink-0 text-muted" />
                    <input
                        value={query}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Rechercher"
                        className="w-full bg-transparent text-[13px] text-ink placeholder:text-faint outline-none"
                    />
                </div>
            </div>

            <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-3" onClick={closeNav}>
                <Section label="Musique">
                    <NavItem to="/" icon={<CirclePlay className="size-[18px]" />} label="Écouter" end />
                    <NavItem to="/browse" icon={<LayoutGrid className="size-[18px]" />} label="Parcourir" />
                    <NavItem to="/radio" icon={<Radio className="size-[18px]" />} label="Radio" />
                </Section>

                <Section label="Bibliothèque">
                    <NavItem to="/recents" icon={<Clock className="size-[18px]" />} label="Ajouts récents" />
                    <NavItem to="/artists" icon={<MicVocal className="size-[18px]" />} label="Artistes" />
                    <NavItem to="/albums" icon={<Disc3 className="size-[18px]" />} label="Albums" />
                    <NavItem to="/songs" icon={<Music2 className="size-[18px]" />} label="Morceaux" />
                </Section>

                <Section
                    label="Playlists"
                    action={
                        <button
                            type="button"
                            aria-label="Nouvelle playlist"
                            onClick={() => newPlaylist((pl) => navigate(`/playlists/${pl.id}`))}
                            className="grid size-5 place-items-center rounded text-muted transition hover:bg-white/10 hover:text-ink"
                        >
                            <Plus className="size-4" />
                        </button>
                    }
                >
                    {playlists.length === 0 && (
                        <p className="px-2 py-1 text-[12px] leading-relaxed text-faint">
                            Créez votre première playlist avec le +.
                        </p>
                    )}
                    {playlists.map((pl) => (
                        <NavLink
                            key={pl.id}
                            to={`/playlists/${pl.id}`}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition',
                                    isActive ? 'bg-white/10 text-ink' : 'text-muted hover:text-ink',
                                )
                            }
                        >
                            <Artwork url={pl.artwork_url} seed={pl.name} className="size-6" rounded="rounded" />
                            <span className="min-w-0 flex-1 truncate">{pl.name}</span>
                            <span className="text-[11px] tabular-nums text-faint">
                                {playlistTrackIds(pl.id).length}
                            </span>
                        </NavLink>
                    ))}
                </Section>
            </nav>

            {/* Importer */}
            <div className="border-t border-line p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <button
                    type="button"
                    onClick={() => {
                        closeNav()
                        openImport()
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent/15 py-2 text-[13px] font-semibold text-accent transition hover:bg-accent/25"
                >
                    <Upload className="size-4" />
                    Importer de la musique
                </button>
            </div>
        </aside>
    )
}

function Section({
    label,
    action,
    children,
}: {
    label: string
    action?: ReactNode
    children: ReactNode
}) {
    return (
        <div className="mb-4">
            <div className="flex items-center justify-between px-2 pb-1">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-faint">{label}</h3>
                {action}
            </div>
            <div className="flex flex-col gap-0.5">{children}</div>
        </div>
    )
}

function NavItem({
    to,
    icon,
    label,
    end,
}: {
    to: string
    icon: ReactNode
    label: string
    end?: boolean
}) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                cn(
                    'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition',
                    isActive ? 'bg-white/10 text-ink' : 'text-ink/85 hover:bg-white/5',
                )
            }
        >
            <span className="text-accent">{icon}</span>
            <span className="truncate">{label}</span>
        </NavLink>
    )
}
