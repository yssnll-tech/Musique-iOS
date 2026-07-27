/** Durée courte façon lecteur : 3:07, 12:45. */
export function formatTime(sec: number): string {
    if (!Number.isFinite(sec) || sec <= 0) return '0:00'
    const total = Math.floor(sec)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
}

/** Durée cumulée longue : « 1 h 23 min », « 47 min ». */
export function formatTotalDuration(sec: number): string {
    const total = Math.round(sec)
    const h = Math.floor(total / 3600)
    const m = Math.round((total % 3600) / 60)
    if (h > 0) return `${h} h ${m} min`
    if (m > 0) return `${m} min`
    return `${total} s`
}

/** « 1 morceau » / « 12 morceaux ». */
export function plural(n: number, singular: string, pluralForm?: string): string {
    const p = pluralForm ?? `${singular}s`
    return `${n} ${n > 1 ? p : singular}`
}

/** Initiales pour une pochette de secours. */
export function initials(text: string): string {
    const words = text.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return '♪'
    if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
}
