const splitByRegex = regex => value => {
    const urls = []
    let remainder = value
    let remainderIndex = 0
    while (remainder.length > 0) {
        const match = remainder.match(regex)
        // No check for match===null needed; the regexes given below produce a match on any string.
        const leadingWhitespace = match[1]
        const url = match[2]
        if (url.length > 0) { // I suppose we can simply omit empty (= invalid?) tokens..
            urls.push({
                url,
                index: remainderIndex + leadingWhitespace.length,
            })
        }
        remainder = remainder.slice(match[0].length,)
        remainderIndex += match[0].length
    }
    return urls
}

// Split by whitespace, return values and their indices
// E.g. 'aaa bbb' => [{ url: 'aaa', index: 0 }, { url: 'bbb', index: 4 }]
export const splitByWhitespace = splitByRegex(/^(\s*)([^]*?)(\s*)(\s|$)/)

// Split string by commas, strip whitespace, and return the index of every found url.
// E.g. splitByComma('aaa, bbb') === [{ url: 'aaa', index: 0 }, { url: 'bbb', index: 5 }]
export const splitByComma = splitByRegex(/^(\s*)([^]*?)(\s*)(,|$)/)

// Split by commas, then split each token by whitespace and only keep the first piece.
// E.g. 'aaa bbb, ccc' => [{ url: 'aaa', index: 0 }, { url: 'ccc', index: 9 }]
// Used for parsing srcset: <img srcset="http://image 2x, http://other-image 1.5x" ...>
export const splitByCommaPickFirstTokens = splitByRegex(/^(\s*)(\S*)([^]*?)(,|$)/)
