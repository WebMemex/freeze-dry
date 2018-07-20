import { assignProperties, flatMap } from './util'

describe('assignProperties', () => {
    test('should assign from left to right', () => {
        const result = assignProperties({ n: 1 }, { n: 2, k: 5 }, { n: 3 })
        expect(result).toEqual({ n: 3, k: 5 })
    })

    test('should keep getters alive', () => {
        let x
        const a = {
            get x() { return x },
        }
        const b = {
            get x2() { return x * 2 },
        }

        const result = assignProperties(a, b)

        x = 10
        expect(result.x).toEqual(10)
        expect(result.x2).toEqual(20)
    })

    test('should keep setters alive', () => {
        let x
        const a = {
            set x(v) { x = v },
        }
        const c = {
            set x3(v) { x = v / 3 },
        }

        const result = assignProperties(a, c)

        result.x = 123
        expect(x).toEqual(123)

        result.x3 = 300
        expect(x).toEqual(100)
    })
})

test('flatMap', () => {
    const result = flatMap([0, 1, 2, 3], v => new Array(v).fill(v))
    expect(result).toEqual([1, 2, 2, 3, 3, 3])
})
