import {
    splitByWhitespace, splitByComma, splitByCommaPickFirstTokens,
} from './split-token-list.js'

describe('splitByWhitespace', () => {
    test('should work for a basic case', () => {
        expect(splitByWhitespace('aaa bbb ccc')).toEqual([
            { token: 'aaa', index: 0 },
            { token: 'bbb', index: 4 },
            { token: 'ccc', index: 8 },
        ])
    })

    test('should handle any whitespace', () => {
        expect(splitByWhitespace(' \taaa  bbb \nccc ')).toEqual([
            { token: 'aaa', index: 2 },
            { token: 'bbb', index: 7 },
            { token: 'ccc', index: 12 },
        ])
    })

    test('should work for a single token', () => {
        expect(splitByWhitespace('aaa')).toEqual([
            { token: 'aaa', index: 0 },
        ])
        expect(splitByWhitespace(' aaa ')).toEqual([
            { token: 'aaa', index: 1 },
        ])
    })
})

describe('splitByComma', () => {
    test('should work for a basic case', () => {
        expect(splitByComma('aaa, bbb, ccc')).toEqual([
            { token: 'aaa', index: 0 },
            { token: 'bbb', index: 5 },
            { token: 'ccc', index: 10 },
        ])
    })

    test('should ignore any whitespace', () => {
        expect(splitByComma(' \taaa, bbb\n,\nccc ')).toEqual([
            { token: 'aaa', index: 2 },
            { token: 'bbb', index: 7 },
            { token: 'ccc', index: 13 },
        ])
    })

    test('should work for a single token', () => {
        expect(splitByComma('aaa')).toEqual([
            { token: 'aaa', index: 0 },
        ])
        expect(splitByComma(' aaa ')).toEqual([
            { token: 'aaa', index: 1 },
        ])
    })

    test('should retain whitespace within tokens', () => {
        // Note that whitespace should not actually occur in URLs, but testing this anyhow.
        expect(splitByComma('aaa aaa, bbb\tbbb\nbbb')).toEqual([
            { token: 'aaa aaa', index: 0 },
            { token: 'bbb\tbbb\nbbb', index: 9 },
        ])
    })

    test('should omit empty tokens', () => {
        // These should probably not occur in valid values, but best to handle them neatly.
        expect(splitByComma('aaa,, , ddd')).toEqual([
            { token: 'aaa', index: 0 },
            { token: 'ddd', index: 8 },
        ])
    })
})

describe('splitByCommaPickFirstTokens', () => {
    test('should work for a basic case', () => {
        expect(splitByCommaPickFirstTokens('aaa bbb, ccc ddd eee, fff')).toEqual([
            { token: 'aaa', index: 0 },
            { token: 'ccc', index: 9 },
            { token: 'fff', index: 22 },
        ])
    })

    test('should handle any whitespace', () => {
        expect(splitByCommaPickFirstTokens(' \naaa\tbbb,\nccc\n ddd \teee ,\t fff\t')).toEqual([
            { token: 'aaa', index: 2 },
            { token: 'ccc', index: 11 },
            { token: 'fff', index: 28 },
        ])
    })

    test('should work for a single token', () => {
        expect(splitByCommaPickFirstTokens('aaa')).toEqual([
            { token: 'aaa', index: 0 },
        ])
        expect(splitByCommaPickFirstTokens(' aaa ')).toEqual([
            { token: 'aaa', index: 1 },
        ])
    })
})
