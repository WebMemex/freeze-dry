// Parse the given URL relative to the given base URL, and return undefined if this fails.
export default function tryParseUrl(url, baseUrl) {
    try {
        return new URL(url, baseUrl).href
    } catch (err) {
        return undefined
    }
}
