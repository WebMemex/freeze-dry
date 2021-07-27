import { GlobalConfig } from './types'

/**
 * Turn a Blob into a base64-encoded data URL.
 * @param {boolean} blob - the blob to serialise.
 * @returns {string} dataUrl - the data URL.
 */
export default async function blobToDataUrl(blob: Blob, config: Pick<GlobalConfig, 'glob'>): Promise<string> {
    const binaryString = await new Promise<string>((resolve, reject) => {
        const reader = new config.glob.FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsBinaryString(blob)
    })
    const dataUrl = `data:${blob.type};base64,${config.glob.btoa(binaryString)}`
    return dataUrl
}
