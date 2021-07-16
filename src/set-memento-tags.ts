/**
 * Add provenance metadata to the DOM, using the terminology of the Memento protocol.
 * Note however that the Memento spec only discusses HTTP headers; we take the freedom to use <meta>
 * and <link> tags to 'embed' these headers inside the document itself.
 * @param {Document} doc - The Document to add tags to.
 * @param {Object} options
 * @param {Date} [options.datetime] - The moment the page was snapshotted.
 * @param {string} [options.originalUrl] - The page's original location.
 * @returns nothing; doc is mutated.
 */
export default function setMementoTags(doc: Document, {
    originalUrl,
    datetime
}: {
    originalUrl?: string,
    datetime?: Date,
}) {
    // Ensure a head element exists.
    if (!doc.head) {
        const head = doc.createElement('head')
        doc.documentElement.insertBefore(head, doc.documentElement.firstChild)
    }

    if (originalUrl) {
        // https://tools.ietf.org/html/rfc7089#section-2.2.1
        const linkEl = doc.createElement('link')
        linkEl.setAttribute('rel', 'original')
        linkEl.setAttribute('href', originalUrl)
        doc.head.insertBefore(linkEl, doc.head.firstChild)
    }

    if (datetime) {
        // https://tools.ietf.org/html/rfc7089#section-2.1.1
        const metaEl = doc.createElement('meta')
        metaEl.setAttribute('http-equiv', 'Memento-Datetime')
        metaEl.setAttribute('content', datetimeToString(datetime))
        doc.head.insertBefore(metaEl, doc.head.firstChild)
    }
}

// Produces an RFC 1123 datetime string, hard-coded to use GMT as its timezone, as Memento requires.
function datetimeToString(datetime: Date) {
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ]
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const zeropad = (l: number) => (n: number) => `${n}`.padStart(l, '0')
    const datetimeString =
        weekdays[datetime.getUTCDay()]
        + ', '
        + zeropad(2)(datetime.getUTCDate())
        + ' '
        + months[datetime.getUTCMonth()]
        + ' '
        + zeropad(4)(datetime.getUTCFullYear())
        + ' '
        + zeropad(2)(datetime.getUTCHours())
        + ':'
        + zeropad(2)(datetime.getUTCMinutes())
        + ':'
        + zeropad(2)(datetime.getUTCSeconds())
        + ' GMT'
    return datetimeString
}

export { datetimeToString } // merely for testing
