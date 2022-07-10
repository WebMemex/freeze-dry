import type { GlobalConfig } from '../types'

/**
 * Obtain a Blob’s contents as a string.
 *
 * The Blob content is assumed to be UTF-8 encoded.
 *
 * @param blob - The Blob to convert.
 * @param config - Optional environment configuration.
 * @returns the blob’s content.
 */
export async function blobToText(blob: Blob, config: GlobalConfig = {}): Promise<string> {
    const text = await new Promise<string>((resolve, reject) => {
        const glob = config.glob || globalThis
        const reader = new glob.FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blob) // TODO should we know&tell which encoding to use?
    })
    return text
}
