import {
    mergeWith, omit, uniq,
} from './util.js'

test('mergeWith', () => {
    const object1 = { a: 1, b: 2 }
    const object2 = { a: 3, c: 4 }
    const sum = (x, y) => x + y
    const result = mergeWith(sum)(object1, object2)
    expect(result).toEqual({ a: 4, b: 2, c: 4 })
})

test('omit', () => {
    const object = { a: 1, b: 2, c: 3 }
    const result = omit('b')(object)
    expect(result).toEqual({ a: 1, c: 3 })
})

test('uniq', () => {
    const result = uniq([1, 2, 2, 2, 3, 4, 1, 5, 2, 6])
    expect(result).toEqual([1, 2, 3, 4, 5, 6])
})
