import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface MenuAction {
    label: string
    icon?: ReactNode
    onClick: () => void
    danger?: boolean
}
export type MenuItem = MenuAction | 'separator'

interface MenuProps {
    items: MenuItem[]
    children: ReactNode
    className?: string
    ariaLabel?: string
}

const MENU_WIDTH = 210

/** Menu contextuel « … » positionné en fixed près du déclencheur. */
export function Menu({ items, children, className, ariaLabel }: MenuProps) {
    const [open, setOpen] = useState(false)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
    const btnRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const close = () => setOpen(false)
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node
            if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return
            setOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        window.addEventListener('mousedown', onDoc)
        window.addEventListener('keydown', onKey)
        window.addEventListener('scroll', close, true)
        window.addEventListener('resize', close)
        return () => {
            window.removeEventListener('mousedown', onDoc)
            window.removeEventListener('keydown', onKey)
            window.removeEventListener('scroll', close, true)
            window.removeEventListener('resize', close)
        }
    }, [open])

    const toggle = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const btn = btnRef.current
        if (!btn) return
        const r = btn.getBoundingClientRect()
        const estHeight = items.length * 34 + 8
        let left = r.right - MENU_WIDTH
        if (left < 8) left = 8
        let top = r.bottom + 6
        if (top + estHeight > window.innerHeight - 8) top = Math.max(8, r.top - estHeight - 6)
        setPos({ top, left })
        setOpen((o) => !o)
    }

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                aria-label={ariaLabel}
                aria-haspopup="menu"
                onClick={toggle}
                className={className}
            >
                {children}
            </button>
            {open && pos && (
                <div
                    ref={menuRef}
                    role="menu"
                    style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
                    className="glass-elevated animate-pop no-select fixed z-[120] overflow-hidden rounded-xl py-1"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {items.map((it, i) =>
                        it === 'separator' ? (
                            <div key={`sep-${i}`} className="my-1 h-px bg-line" />
                        ) : (
                            <button
                                key={it.label}
                                type="button"
                                role="menuitem"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setOpen(false)
                                    it.onClick()
                                }}
                                className={cn(
                                    'flex w-full items-center gap-3 px-3 py-1.5 text-left text-[13px] transition hover:bg-white/10',
                                    it.danger ? 'text-accent' : 'text-ink',
                                )}
                            >
                                {it.icon && (
                                    <span className="grid size-4 shrink-0 place-items-center text-muted">
                                        {it.icon}
                                    </span>
                                )}
                                <span className="truncate">{it.label}</span>
                            </button>
                        ),
                    )}
                </div>
            )}
        </>
    )
}
