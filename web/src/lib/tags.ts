// Lecteur de métadonnées audio sans dépendance externe.
// Gère les deux formats les plus courants pour de la musique importée :
//   • ID3v2.2/2.3/2.4 (fichiers MP3)
//   • atomes MP4 / iTunes (fichiers M4A / AAC / ALAC)
// Tout est défensif : au moindre doute on renvoie un champ vide, jamais d'exception.

export interface ParsedMeta {
    title?: string
    artist?: string
    album?: string
    albumArtist?: string
    genre?: string
    year?: number
    trackNo?: number
    discNo?: number
    picture?: Blob
}

const td = {
    latin1: new TextDecoder('iso-8859-1'),
    utf8: new TextDecoder('utf-8'),
    utf16: new TextDecoder('utf-16'), // détecte le BOM (LE/BE)
    utf16be: new TextDecoder('utf-16be'),
}

function clean(s: string): string {
    return s.replace(/\0+$/g, '').trim()
}

function latin1(bytes: Uint8Array, start: number, len: number): string {
    return td.latin1.decode(bytes.subarray(start, start + len))
}

function be32(bytes: Uint8Array, o: number): number {
    return ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0
}

function synchsafe32(bytes: Uint8Array, o: number): number {
    return (
        ((bytes[o] & 0x7f) << 21) |
        ((bytes[o + 1] & 0x7f) << 14) |
        ((bytes[o + 2] & 0x7f) << 7) |
        (bytes[o + 3] & 0x7f)
    )
}

function firstInt(s: string | undefined): number | undefined {
    if (!s) return undefined
    const m = s.match(/\d+/)
    if (!m) return undefined
    const n = parseInt(m[0], 10)
    return Number.isFinite(n) ? n : undefined
}

function year(s: string | undefined): number | undefined {
    if (!s) return undefined
    const m = s.match(/\d{4}/)
    if (!m) return undefined
    const n = parseInt(m[0], 10)
    return Number.isFinite(n) ? n : undefined
}

function pictureBlob(data: Uint8Array, mime?: string): Blob | undefined {
    if (!data.length) return undefined
    let type = mime
    if (!type) {
        if (data[0] === 0xff && data[1] === 0xd8) type = 'image/jpeg'
        else if (data[0] === 0x89 && data[1] === 0x50) type = 'image/png'
        else type = 'image/jpeg'
    }
    try {
        // Cast : un Uint8Array est un BlobPart valide à l'exécution ; la lib DOM
        // récente restreint le générique (ArrayBufferLike vs ArrayBuffer).
        return new Blob([data as unknown as BlobPart], { type })
    } catch {
        return undefined
    }
}

// ---------- ID3v2 (MP3) ----------

function decodeTextFrame(data: Uint8Array): string {
    if (data.length === 0) return ''
    const enc = data[0]
    const body = data.subarray(1)
    let out: string
    switch (enc) {
        case 0:
            out = td.latin1.decode(body)
            break
        case 1:
            out = td.utf16.decode(body)
            break
        case 2:
            out = td.utf16be.decode(body)
            break
        default:
            out = td.utf8.decode(body)
    }
    // Certaines valeurs multi-champs (v2.4) sont séparées par un octet nul.
    return clean(out.split('\0').filter(Boolean)[0] ?? '')
}

function parseApic(data: Uint8Array, v22: boolean): Blob | undefined {
    if (data.length < 4) return undefined
    const enc = data[0]
    let i = 1
    let mime: string
    if (v22) {
        // v2.2 : format image sur 3 caractères (ex. "JPG")
        const fmt = latin1(data, 1, 3).toUpperCase()
        mime = fmt.includes('PNG') ? 'image/png' : 'image/jpeg'
        i = 4
    } else {
        let j = i
        while (j < data.length && data[j] !== 0) j++
        mime = latin1(data, i, j - i)
        i = j + 1
    }
    // type d'image (1 octet)
    i += 1
    // description terminée par nul (double nul en UTF-16)
    if (enc === 1 || enc === 2) {
        while (i + 1 < data.length && !(data[i] === 0 && data[i + 1] === 0)) i += 2
        i += 2
    } else {
        while (i < data.length && data[i] !== 0) i++
        i += 1
    }
    if (i >= data.length) return undefined
    return pictureBlob(data.subarray(i), mime || undefined)
}

function parseId3(bytes: Uint8Array): ParsedMeta {
    const meta: ParsedMeta = {}
    const versionMajor = bytes[3]
    const v22 = versionMajor === 2
    const v24 = versionMajor === 4
    const flags = bytes[5]
    const size = synchsafe32(bytes, 6)
    let offset = 10
    const end = Math.min(10 + size, bytes.length)

    // Saute un éventuel en-tête étendu (v2.3/2.4).
    if (flags & 0x40) {
        const extSize = v24 ? synchsafe32(bytes, offset) : be32(bytes, offset)
        offset += extSize
    }

    const idLen = v22 ? 3 : 4
    const headerLen = v22 ? 6 : 10

    while (offset + headerLen <= end) {
        const id = latin1(bytes, offset, idLen)
        if (!/^[A-Z0-9]+$/.test(id)) break // padding atteint

        let frameSize: number
        if (v22) {
            frameSize = (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5]
        } else if (v24) {
            frameSize = synchsafe32(bytes, offset + 4)
        } else {
            frameSize = be32(bytes, offset + 4)
        }
        const dataStart = offset + headerLen
        if (frameSize <= 0 || dataStart + frameSize > end) break
        const data = bytes.subarray(dataStart, dataStart + frameSize)

        switch (id) {
            case 'TIT2':
            case 'TT2':
                meta.title = decodeTextFrame(data)
                break
            case 'TPE1':
            case 'TP1':
                meta.artist = decodeTextFrame(data)
                break
            case 'TALB':
            case 'TAL':
                meta.album = decodeTextFrame(data)
                break
            case 'TPE2':
            case 'TP2':
                meta.albumArtist = decodeTextFrame(data)
                break
            case 'TCON':
            case 'TCO': {
                const g = decodeTextFrame(data)
                meta.genre = clean(g.replace(/^\((\d+)\)/, '').trim()) || g
                break
            }
            case 'TYER':
            case 'TYE':
            case 'TDRC':
                meta.year = year(decodeTextFrame(data))
                break
            case 'TRCK':
            case 'TRK':
                meta.trackNo = firstInt(decodeTextFrame(data))
                break
            case 'TPOS':
            case 'TPA':
                meta.discNo = firstInt(decodeTextFrame(data))
                break
            case 'APIC':
            case 'PIC':
                if (!meta.picture) meta.picture = parseApic(data, v22)
                break
        }
        offset = dataStart + frameSize
    }
    return meta
}

// ---------- MP4 / iTunes (M4A) ----------

interface Box {
    start: number // début du contenu (après l'en-tête de 8 octets)
    end: number // fin de la box
}

function findBox(bytes: Uint8Array, from: number, to: number, type: string): Box | null {
    let off = from
    while (off + 8 <= to) {
        const size = be32(bytes, off)
        const t = latin1(bytes, off + 4, 4)
        let contentStart = off + 8
        let boxEnd: number
        if (size === 1) {
            // taille 64 bits : on lit les 32 bits de poids faible (suffisant ici)
            boxEnd = off + be32(bytes, off + 12)
            contentStart = off + 16
        } else if (size === 0) {
            boxEnd = to
        } else {
            boxEnd = off + size
        }
        if (boxEnd <= off || boxEnd > to) break
        if (t === type) return { start: contentStart, end: boxEnd }
        off = boxEnd
    }
    return null
}

function mp4ItemValue(bytes: Uint8Array, itemStart: number, itemEnd: number): Uint8Array | null {
    const data = findBox(bytes, itemStart, itemEnd, 'data')
    if (!data) return null
    // box 'data' : [version+flags:4][reserved/locale:4][valeur…]
    const valueStart = data.start + 8
    if (valueStart > data.end) return null
    return bytes.subarray(valueStart, data.end)
}

function parseMp4(bytes: Uint8Array): ParsedMeta | null {
    const moov = findBox(bytes, 0, bytes.length, 'moov')
    if (!moov) return null
    const udta = findBox(bytes, moov.start, moov.end, 'udta')
    if (!udta) return null
    const metaBox = findBox(bytes, udta.start, udta.end, 'meta')
    if (!metaBox) return null
    // 'meta' est une FullBox : 4 octets (version+flags) avant les enfants.
    const ilst = findBox(bytes, metaBox.start + 4, metaBox.end, 'ilst')
    if (!ilst) return null

    const meta: ParsedMeta = {}
    let off = ilst.start
    while (off + 8 <= ilst.end) {
        const size = be32(bytes, off)
        const name = latin1(bytes, off + 4, 4)
        if (size < 8) break
        const itemEnd = Math.min(off + size, ilst.end)
        const val = mp4ItemValue(bytes, off + 8, itemEnd)
        if (val) {
            switch (name) {
                case '©nam':
                    meta.title = clean(td.utf8.decode(val))
                    break
                case '©ART':
                    meta.artist = clean(td.utf8.decode(val))
                    break
                case '©alb':
                    meta.album = clean(td.utf8.decode(val))
                    break
                case 'aART':
                    meta.albumArtist = clean(td.utf8.decode(val))
                    break
                case '©gen':
                    meta.genre = clean(td.utf8.decode(val))
                    break
                case '©day':
                    meta.year = year(clean(td.utf8.decode(val)))
                    break
                case 'trkn':
                    if (val.length >= 4) meta.trackNo = (val[2] << 8) | val[3]
                    break
                case 'disk':
                    if (val.length >= 4) meta.discNo = (val[2] << 8) | val[3]
                    break
                case 'covr':
                    if (!meta.picture) meta.picture = pictureBlob(val)
                    break
            }
        }
        off = itemEnd
    }
    return meta
}

export async function parseAudioTags(file: File): Promise<ParsedMeta> {
    try {
        const buf = await file.arrayBuffer()
        const bytes = new Uint8Array(buf)
        if (bytes.length >= 10 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
            // "ID3"
            return parseId3(bytes)
        }
        const mp4 = parseMp4(bytes)
        if (mp4) return mp4
    } catch {
        // format non reconnu → on retombera sur le nom de fichier
    }
    return {}
}
