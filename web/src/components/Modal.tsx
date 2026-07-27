import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ModalProps {
    open: boolean
    onClose: () => void
    title: string
    children: ReactNode
    footer?: ReactNode
    wide?: boolean
}

export function Modal({ open, onClose, title, children, footer, wide }: ModalProps) {
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="animate-fade fixed inset-0 z-[100] flex items-center justify-center p-4"
            onMouseDown={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className={cn(
                    'glass-elevated animate-pop relative z-10 w-full rounded-2xl',
                    wide ? 'max-w-lg' : 'max-w-sm',
                )}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 pb-2 pt-4">
                    <h2 className="text-[15px] font-semibold">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-white/10 hover:text-ink"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <div className="px-5 pb-4">{children}</div>
                {footer && (
                    <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>
                )}
            </div>
        </div>
    )
}

/** Bouton d'action réutilisable dans les modales. */
export function DialogButton({
    children,
    onClick,
    variant = 'secondary',
    disabled,
    type = 'button',
}: {
    children: ReactNode
    onClick?: () => void
    variant?: 'primary' | 'secondary' | 'danger'
    disabled?: boolean
    type?: 'button' | 'submit'
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'rounded-lg px-4 py-1.5 text-[13px] font-medium transition disabled:opacity-40',
                variant === 'primary' && 'bg-accent text-white hover:brightness-110',
                variant === 'secondary' && 'bg-white/10 text-ink hover:bg-white/15',
                variant === 'danger' && 'bg-accent text-white hover:brightness-110',
            )}
        >
            {children}
        </button>
    )
}
