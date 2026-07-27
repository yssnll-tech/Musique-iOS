// Clé stable d'un album, partagée entre le regroupement (LibraryContext) et les liens.
export function albumKey(album: string, artist: string): string {
    return `${album.toLowerCase().trim()}|${artist.toLowerCase().trim()}`
}
