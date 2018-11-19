import { flatMap } from './util.js'

test('flatMap', () => {
    const result = flatMap([0, 1, 2, 3], v => new Array(v).fill(v))
    expect(result).toEqual([1, 2, 2, 3, 3, 3])
})
