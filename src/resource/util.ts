import { GlobalConfig } from '../types/index'

export async function blobToText(blob: Blob, config: Pick<GlobalConfig, 'glob'> = {}): Promise<string> {
    const text = await new Promise<string>((resolve, reject) => {
        const glob = config.glob || globalThis
        const reader = new glob.FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blob) // TODO should we know&tell which encoding to use?
    })
    return text
}
