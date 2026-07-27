// Pochette de secours : dégradé déterministe dérivé d'une chaîne (titre/album/artiste).

function hashString(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) {
        h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0
    }
    return Math.abs(h)
}

export interface Gradient {
    from: string
    to: string
    angle: number
}

export function gradientFor(seed: string): Gradient {
    const h = hashString(seed || 'musique')
    const hue1 = h % 360
    const hue2 = (hue1 + 35 + (h % 50)) % 360
    const angle = 120 + (h % 100)
    return {
        from: `hsl(${hue1} 58% 52%)`,
        to: `hsl(${hue2} 62% 34%)`,
        angle,
    }
}

export function gradientCss(seed: string): string {
    const g = gradientFor(seed)
    return `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`
}
