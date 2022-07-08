import type { GlobalConfig } from './types'

/**
 * Turn a Blob into a base64-encoded data URL.
 *
 * @param blob - the blob to serialise.
 * @returns The data URL.
 */
export default async function blobToDataUrl(blob: Blob, config: GlobalConfig = {}): Promise<string> {
    const glob = config.glob || globalThis
    const binaryString = await new Promise<string>((resolve, reject) => {
        const reader = new glob.FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsBinaryString(blob)
    })
    const dataUrl = `data:${blob.type};base64,${glob.btoa(binaryString)}`
    return dataUrl
}
