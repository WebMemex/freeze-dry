const splitByRegex = regex => value => {
    const tokens = []
    let remainder = value
    let remainderIndex = 0
    while (remainder.length > 0) {
        const match = remainder.match(regex)
        // No check for match===null needed; the regexes given below produce a match on any string.
        const leadingWhitespace = match[1]
        const token = match[2]
        if (token.length > 0) { // I suppose we can simply omit empty (= invalid?) tokens..
            tokens.push({
                token,
                index: remainderIndex + leadingWhitespace.length,
            })
        }
        const charactersSeen = match[0].length
        remainder = remainder.slice(charactersSeen, )
        remainderIndex += charactersSeen
    }
    return tokens
}

// Split by whitespace, return values and their indices
// E.g. 'aaa bbb' => [{ token: 'aaa', index: 0 }, { token: 'bbb', index: 4 }]
export const splitByWhitespace = splitByRegex(/^(\s*)([^]*?)(\s*)(\s|$)/)

// Split string by commas, strip whitespace, and return the index of every found token.
// E.g. splitByComma('aaa, bbb') === [{ token: 'aaa', index: 0 }, { token: 'bbb', index: 5 }]
export const splitByComma = splitByRegex(/^(\s*)([^]*?)(\s*)(,|$)/)

// Split by commas, then split each token by whitespace and only keep the first piece.
// E.g. 'aaa bbb, ccc' => [{ token: 'aaa', index: 0 }, { token: 'ccc', index: 9 }]
// Used for parsing srcset: <img srcset="http://image 2x, http://other-image 1.5x" ...>
export const splitByCommaPickFirstTokens = splitByRegex(/^(\s*)(\S*)([^]*?)(,|$)/)
