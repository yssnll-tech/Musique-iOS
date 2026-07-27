// Métadonnées d'un fichier audio importé : tags (via lecteur maison) + durée réelle.

import { parseAudioTags, type ParsedMeta } from './tags'

export type { ParsedMeta } from './tags'

export function stripExtension(name: string): string {
    return name.replace(/\.[^/.]+$/, '')
}

export async function parseAudioMetadata(file: File): Promise<ParsedMeta> {
    try {
        return await parseAudioTags(file)
    } catch {
        return {}
    }
}

/** Durée réelle du fichier (secondes), lue localement avant l'upload. */
export function getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
        let settled = false
        const url = URL.createObjectURL(file)
        const audio = document.createElement('audio')
        audio.preload = 'metadata'
        const done = (d: number) => {
            if (settled) return
            settled = true
            URL.revokeObjectURL(url)
            audio.src = ''
            resolve(Number.isFinite(d) && d > 0 ? d : 0)
        }
        audio.onloadedmetadata = () => done(audio.duration)
        audio.onerror = () => done(0)
        // Filet de sécurité si l'événement n'arrive jamais.
        setTimeout(() => done(audio.duration || 0), 15000)
        audio.src = url
    })
}
