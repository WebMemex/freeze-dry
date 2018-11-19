import {
    parsedView,
    syncingProxy,
    deepSyncingProxy,
    transformingCache,
    makeListenerProxy,
    deepProxy,
} from './parse-tools.js'

const deepClone = object => JSON.parse(JSON.stringify(object))

describe('parsedView', () => {
    const exampleString = 'from "abc" to "xyz".'
    // Hard-code the parse function to give us the quoted pieces in the example string.
    const parse = string => [
        { token: 'abc', index: 6 },
        { token: 'xyz', index: 15 },
    ]

    test('should look like the output of parse()', () => {
        const view = parsedView(parse)(exampleString)
        expect([...view]).toEqual([
            { token: 'abc', index: 6 },
            { token: 'xyz', index: 15 },
        ])
    })

    test('should have toString() return the input string', () => {
        const view = parsedView(parse)(exampleString)
        expect(view.toString()).toEqual(exampleString)
    })

    test('should reflect token modifications in the value of toString()', () => {
        const view = parsedView(parse)(exampleString)
        view[1].token = 'æøå'
        expect(view.toString()).toEqual('from "abc" to "æøå".')
    })
})

describe('syncingProxy', () => {
    let currentObject
    const getCurrentObject = jest.fn(() => deepClone(currentObject))
    const setCurrentObject = jest.fn(value => { currentObject = deepClone(value) })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should mirror the current value of get()', () => {
        currentObject = {}
        const proxy = syncingProxy({ get: getCurrentObject, set: setCurrentObject })

        currentObject = { v: 9 }
        expect(proxy.v).toEqual(9)
        currentObject = { v: 10 }
        expect(proxy.v).toEqual(10)
    })

    test('should write back changes using set()', () => {
        currentObject = {}
        const proxy = syncingProxy({ get: getCurrentObject, set: setCurrentObject })

        proxy.v = 4
        expect(currentObject.v).toEqual(4)
    })

    test('should work with e.g. an array', () => {
        // The proxy needs to be created with an Array as initial target (so the property descriptor
        // for '.length' is correct).
        currentObject = [1, 2, 3]
        const proxy = syncingProxy({ get: getCurrentObject, set: setCurrentObject })

        proxy.push(4) // Would fail if the initial target was not an Array.

        expect(proxy[3]).toEqual(4)
    })
})

describe('deepSyncingProxy', () => {
    let currentObject

    const getCurrentObject = jest.fn(() => deepClone(currentObject))
    const setCurrentObject = jest.fn(value => { currentObject = deepClone(value) })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should deeply mirror the current value of get()', () => {
        currentObject = { t: { u: { v: 2 } } }
        const proxy = deepSyncingProxy({ get: getCurrentObject, set: setCurrentObject })

        const innerProxy = proxy.t.u
        currentObject = { t: { u: { v: 6 } } }

        expect(innerProxy.v).toEqual(6)
    })

    test('should run set() when an inner object is mutated.', () => {
        currentObject = { t: { u: { v: 2 } } }
        const proxy = deepSyncingProxy({ get: getCurrentObject, set: setCurrentObject })

        const innerProxy = proxy.t.u
        innerProxy.v = 3
        expect(innerProxy.v).toEqual(3)
        expect(currentObject.t.u.v).toEqual(3)
    })

    test('by default, should not run set() after non-mutating operations', () => {
        currentObject = { t: { u: { v: 2 } } }
        const proxy = deepSyncingProxy({ get: getCurrentObject, set: setCurrentObject })

        const v = proxy.t.u.v

        expect(setCurrentObject).not.toHaveBeenCalled()
    })

    test('with alwaysSet === true, should run set() also after non-mutating operations', () => {
        currentObject = { t: { u: { v: 2 } } }
        const proxy = deepSyncingProxy({
            get: getCurrentObject,
            set: setCurrentObject,
            alwaysSet: true,
        })

        const v = proxy.t.u

        expect(setCurrentObject).toHaveBeenCalled()
    })

    test('should throw a TypeError when accessing a member object that has disappeared', () => {
        currentObject = { t: { u: { v: 2 } } }
        const proxy = deepSyncingProxy({ get: getCurrentObject, set: setCurrentObject })

        const innerProxy = proxy.t.u

        currentObject = { t: { u: null } }
        expect(() => innerProxy.v).toThrow(
            TypeError('Expected get().t.u to be an object, but get().t.u is null.')
        )

        currentObject = { t: { u: 98 } } // A primitive value cannot be proxied either.
        expect(() => innerProxy.v).toThrow(
            TypeError('Expected get().t.u to be an object, but get().t.u is 98.')
        )

        currentObject = {}
        expect(() => innerProxy.v).toThrow(
            TypeError('Expected get().t.u to be an object, but get().t is undefined.')
        )

        currentObject = null
        expect(() => innerProxy.v).toThrow(
            TypeError('Expected get().t.u to be an object, but get() is null.')
        )
    })
})

describe('transformingCache', () => {
    // For testing, we create a cache that turns a JSON string x into an object, and vice versa.
    let x, cache
    const getX = jest.fn(() => x)
    const setX = jest.fn(value => { x = value })
    const transform = jest.fn(x => JSON.parse(x))
    const untransform = jest.fn(obj => JSON.stringify(obj))

    beforeEach(() => {
        jest.clearAllMocks()
        x = undefined
        cache = transformingCache({ get: getX, set: setX, transform, untransform })
    })

    test('should get the transformed value', () => {
        x = '{"b":2}'
        expect(cache.get()).toEqual({ b: 2 })
    })

    test('should set the untransformed value', () => {
        cache.set({ c: 3 })
        expect(x).toEqual('{"c":3}')
    })

    test('should get cached object on get+get', () => {
        x = '{}'
        const object1 = cache.get()
        const object2 = cache.get()
        expect(object1).toBe(object2) // Note we test for identity equality (===) here
    })

    test('should not get stale cache on get+<change>+get', () => {
        x = '{}'
        cache.get()
        x = '{"m":0}'
        const object = cache.get()
        expect(object).toEqual({ m: 0 })
    })

    test('should get cached object on set+get', () => {
        const object = {}
        cache.set(object)
        expect(cache.get()).toBe(object) // Note we test for identity equality (===) here
    })

    test('should not get stale cache on set+<change>+get', () => {
        cache.set({ l: 3 })
        x = '{"q":8}'
        const object = cache.get()
        expect(object).toEqual({ q: 8 })
    })

    test('should omit setX() on get+set', () => {
        x = '{"z":45}'
        const object = cache.get()
        cache.set(object)
        expect(setX).not.toHaveBeenCalled()
    })

    test('should omit setX() when untransformed value is equal', () => {
        x = '{"w":37}'
        cache.set({w: 37})
        expect(setX).not.toHaveBeenCalled()
    })

    test('should not omit setX on get+<change>+set', () => {
        x = '{"n":20}'
        const object = cache.get()
        x = '{"r":1}'
        cache.set(object)
        expect(setX).toHaveBeenCalled()
    })

    test('should not check staleness on get+<change>+set with trustCache', () => {
        // Note: this is not what you usually want to do.
        x = '{"k":76}'
        const object = cache.get()
        x = '{"c":30}'
        cache.set(object, { trustCache: true })
        expect(getX).toHaveBeenCalledTimes(1)
        expect(setX).not.toHaveBeenCalled()
        expect(x).toEqual('{"c":30}')
    })

    test('should omit second setX() on set+set', () => {
        const object = { a: 123 }
        cache.set(object)
        cache.set(object)
        expect(setX).toHaveBeenCalledTimes(1)
    })

    test('should not omit second setX() on set+<change>+set', () => {
        const object = { t: 10 }
        cache.set(object)
        x = '{"t":30}'
        cache.set(object)
        expect(setX).toHaveBeenCalledTimes(2)
        expect(x).toEqual('{"t":10}')
    })

    test('should not check staleness on set+<change>+set with trustCache', () => {
        // Note: this is what you usually want to avoid.
        const object = { t: 10 }
        cache.set(object)
        x = '{"t":30}'
        cache.set(object, { trustCache: true })
        expect(getX).toHaveBeenCalledTimes(1) // only in the first cache.set()
        expect(setX).toHaveBeenCalledTimes(1) // only in the first cache.set()
        expect(x).toEqual('{"t":30}')
    })

    test('should use custom equality comparison when getting', () => {
        cache = transformingCache({
            get: getX, set: setX, transform, untransform,
            // Ignore whitespace when comparing the JSON strings.
            isEqual: (a, b) => a.replace(/\s/g, '') === b.replace(/\s/g, ''),
        })
        x = '{"f":3}'
        const object1 = cache.get()
        x = '{"f" : 3}'
        const object2 = cache.get()
        expect(object1).toBe(object2) // Note we test for identity equality (===) here
    })

    test('should use custom equality comparison when setting', () => {
        cache = transformingCache({
            get: getX, set: setX, transform, untransform,
            // Ignore whitespace when comparing the JSON strings.
            isEqual: (a, b) => a.replace(/\s/g, '') === b.replace(/\s/g, ''),
        })
        x = '{"g" : 94}'
        cache.set({g: 94}) // will transform into '{"g":94}'
        expect(setX).not.toHaveBeenCalled()
    })
})

describe('makeListenerProxy', () => {
    test('should call before() and after() before and after an operation, respectively', () => {
        // expect().toHaveReturnedWith() seems to have disappeared from jest, hence using variables.
        let xBefore, xAfter
        const before = jest.fn((method, [target, ...args]) => { xBefore = target.x })
        const after = jest.fn((method, [target, ...args]) => { xAfter = target.x })

        const object = { x: 1, y: 2 }
        const proxy = makeListenerProxy(before, after)(object)

        proxy.x = 4

        expect(xBefore).toEqual(1)
        expect(xAfter).toEqual(4)
        expect(object).toEqual({ x: 4, y: 2 })
    })
})

describe('deepProxy', () => {
    // A simple proxy creator that multiplies every set value by ten.
    const bigFish = object => new Proxy(object, {
        set: (target, property, value) => {
            target[property] = value * 10
            return true
        },
    })

    test('should wrap member objects using the same proxy creator', () => {
        const object = { x: 1, innerObject: { y: 2 } }
        const proxy = deepProxy(bigFish)(object)

        proxy.x = 3
        proxy.innerObject.y = 4

        expect(object).toEqual({ x: 30, innerObject: { y: 40 } })
    })

    test('should recursively wrap member objects using the same proxy creator', () => {
        const object = { x: 1, innerObject: { y: { z: 2 } } }
        const proxy = deepProxy(bigFish)(object)

        proxy.innerObject.y.z = 5

        expect(object).toEqual({ x: 1, innerObject: { y: { z: 50 } } })
    })

    test('should memoize proxies for inner objects', () => {
        const object = { x: 1, innerObject: { y: 2 } }
        const proxy = deepProxy(bigFish)(object)

        const innerProxy1 = proxy.innerObject
        const innerProxy2 = proxy.innerObject

        expect(innerProxy1).toBe(innerProxy2)
    })

    test("should pass the sub-object's path to the proxy creator", () => {
        const countOccurrences = (string, substring) => string.split(substring).length - 1

        // Alternatingly wraps or does not wrap inner objects.
        const proxyCreator = (object, path) => {
            if (countOccurrences(path, '.') % 2 === 0) {
                return bigFish(object)
            } else {
                return object // no proxy.
            }
        }
        const object = { inner1: { inner2: { inner3: {} } } }
        const proxy = deepProxy(proxyCreator)(object)

        proxy.v = 1
        proxy.inner1.v = 2
        proxy.inner1.inner2.v = 3
        proxy.inner1.inner2.inner3.v = 4
        expect(object).toEqual({ v: 10, inner1: { v: 2, inner2: { v: 30, inner3: { v: 4 } } } })
    })
})
