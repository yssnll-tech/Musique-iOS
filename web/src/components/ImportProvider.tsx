import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Loader2, Upload } from 'lucide-react'
import { useLibrary, type ImportProgress } from '@/context/LibraryContext'

interface ImportValue {
    open: () => void
}
const ImportContext = createContext<ImportValue | null>(null)

export function useImport(): ImportValue {
    const ctx = useContext(ImportContext)
    if (!ctx) throw new Error('useImport doit être utilisé dans <ImportProvider>')
    return ctx
}

export function ImportProvider({ children }: { children: ReactNode }) {
    const { importFiles, importing } = useLibrary()
    const inputRef = useRef<HTMLInputElement>(null)
    const [dragging, setDragging] = useState(false)
    const dragDepth = useRef(0)

    const open = useCallback(() => inputRef.current?.click(), [])

    useEffect(() => {
        const hasFiles = (e: DragEvent) =>
            e.dataTransfer ? Array.from(e.dataTransfer.types).includes('Files') : false

        const onEnter = (e: DragEvent) => {
            if (!hasFiles(e)) return
            e.preventDefault()
            dragDepth.current += 1
            setDragging(true)
        }
        const onOver = (e: DragEvent) => {
            if (!hasFiles(e)) return
            e.preventDefault()
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
        }
        const onLeave = () => {
            dragDepth.current -= 1
            if (dragDepth.current <= 0) {
                dragDepth.current = 0
                setDragging(false)
            }
        }
        const onDrop = (e: DragEvent) => {
            if (!e.dataTransfer) return
            e.preventDefault()
            dragDepth.current = 0
            setDragging(false)
            const files = Array.from(e.dataTransfer.files)
            if (files.length) void importFiles(files)
        }

        window.addEventListener('dragenter', onEnter)
        window.addEventListener('dragover', onOver)
        window.addEventListener('dragleave', onLeave)
        window.addEventListener('drop', onDrop)
        return () => {
            window.removeEventListener('dragenter', onEnter)
            window.removeEventListener('dragover', onOver)
            window.removeEventListener('dragleave', onLeave)
            window.removeEventListener('drop', onDrop)
        }
    }, [importFiles])

    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : []
        if (files.length) void importFiles(files)
        e.target.value = ''
    }

    return (
        <ImportContext.Provider value={{ open }}>
            {children}
            <input
                ref={inputRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.flac,.wav,.aac,.ogg,.opus"
                multiple
                hidden
                onChange={onPick}
            />
            {dragging && (
                <div className="animate-fade pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-accent/70 px-16 py-14">
                        <Upload className="size-12 text-accent" />
                        <p className="text-lg font-semibold">Déposez vos fichiers pour les importer</p>
                        <p className="text-sm text-muted">MP3, M4A, FLAC, WAV, AAC…</p>
                    </div>
                </div>
            )}
            {importing && <ImportToast importing={importing} />}
        </ImportContext.Provider>
    )
}

function ImportToast({ importing }: { importing: ImportProgress }) {
    const { total, done, failed, current } = importing
    const finished = done >= total
    const pct = total ? Math.round((done / total) * 100) : 0
    return (
        <div
            className="glass-elevated animate-pop fixed bottom-4 left-4 right-4 z-[130] rounded-2xl p-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-72"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center gap-3">
                {finished ? (
                    <Check className="size-5 text-[#30d158]" />
                ) : (
                    <Loader2 className="size-5 animate-spin text-accent" />
                )}
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold">
                        {finished ? 'Import terminé' : 'Import en cours…'}
                    </p>
                    <p className="truncate text-[12px] text-muted">
                        {finished
                            ? `${total - failed} ajouté${total - failed > 1 ? 's' : ''}${
                                  failed ? `, ${failed} échec${failed > 1 ? 's' : ''}` : ''
                              }`
                            : current || 'Préparation…'}
                    </p>
                </div>
                <span className="text-[12px] tabular-nums text-muted">
                    {done}/{total}
                </span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
                <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    )
}
