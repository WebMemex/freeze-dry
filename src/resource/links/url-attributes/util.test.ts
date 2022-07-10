import {
    merge, omit, uniq,
} from './util'

describe('merge', () => {
    test('typical case', () => {
        const object1 = { a: 1, b: 2 }
        const object2 = { a: 3, c: 4 }
        const sum = (x, y) => x + y
        const result = merge([object1, object2], sum)
        expect(result).toEqual({ a: 4, b: 2, c: 4 })
    })

    test('with falsey values', () => {
        const object1 = { a: 0,  b: 10, c: 0 }
        const object2 = { a: 10, b: 0,  d: 10 }
        const movingAverage = (x, y) => x * 0.8 + y * 0.2
        const result = merge([object1, object2], movingAverage)
        expect(result).toEqual({ a: 2, b: 8, c: 0, d: 10 })
    })
})

test('omit', () => {
    const object = { a: 1, b: 2, c: 3 }
    const result = omit(object, ['b'])
    expect(result).toEqual({ a: 1, c: 3 })
})

test('uniq', () => {
    const result = uniq([1, 2, 2, 2, 3, 4, 1, 5, 2, 6])
    expect(result).toEqual([1, 2, 3, 4, 5, 6])
})
