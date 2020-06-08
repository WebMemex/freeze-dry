import { GlobalConfig } from '../types/index'

export async function blobToText(blob: Blob, config: Pick<GlobalConfig, 'glob'>): Promise<string> {
    const text = await new Promise<string>((resolve, reject) => {
        const reader = new config.glob.FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blob) // TODO should we know&tell which encoding to use?
    })
    return text
}
