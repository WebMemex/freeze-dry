// Some abstractions to easily deal with values that are extracted from strings that can be updated.
// Intended to, for example, create a live view on the URLs inside an element's style or srcset
// attribute, that allows both reading and writing the URLs in place.

import { memoize, mutableProxyFactory } from '../package'
import { Parser, TokenPointer } from './url-attributes/types'

interface ParsedView extends Array<TokenPointer> {
    // Array of course already had a toString() method, but we redefine it, so just to be explicit:
    toString(): string;
}

/**
 * Allows manipulating tokens within a string.
 * @param {string => Object[]} parse - given a string, must return an array of objects { token,
 * index, note? }
 * @=>
 * @param {string} value - the string to be parsed.
 * @returns {Object[]} tokens - the array of { token, index, note? } objects as returned by
 * parse(value), where each token field is writable, and with a special toString() method that
 * reconstructs the original string using the current values of the tokens.
 * @example
 * const view = parsedView(extractUrls)('bla http://example.com blub')
 * view.forEach(tokenInfo => { tokenInfo.token = tokenInfo.token.replace(/^https?:/, 'dat:') })
 * view.toString() // 'bla dat://example.com blub'
 */
export const parsedView: (parse: Parser) => (value: string) => ParsedView = parse => value => {
    const parsedValue = parse(value)

    // Split the string into tokens and 'glue' (the segments before, between and after the tokens).
    const tokens: ParsedView = []
    const glueStrings: string[] = []
    let start = 0
    for (const { token, index, note } of parsedValue) {
        glueStrings.push(value.substring(start, index))
        tokens.push({
            token,
            get index() { return index },
            get note() { return note },
        })
        start = index + token.length
    }
    glueStrings.push(value.substring(start, ))

    tokens.toString = () => {
        // Glue everything back together, with the current values of the tokens.
        let newValue = glueStrings[0]
        tokens.forEach(({ token }, i) => {
            newValue += token + glueStrings[i+1]
        })
        return newValue
    }
    return tokens
}

/**
 * Like parsedView, but helps syncing the string with another variable/state/attribute/...
 * It reads the string using get() at any operation, and afterward writes it back using set(string).
 * @param {string => Object[]} options.parse - parser to apply to the string, should return an array
 * of objects { token, index, note? }
 * @param {() => string} options.get - string getter; invoked whenever a token is accessed.
 * @param {string => void} options.set - string setter; invoked when any of its tokens was modified.
 */
export const syncingParsedView: (kwargs: {
    parse: Parser,
    get: () => string,
    set: (string: string) => void,
}) => ParsedView = ({ parse, get, set }) => deepSyncingProxy(
    transformingCache({
        get,
        set,
        transform: parsedView(parse),
        untransform: stringView => stringView.toString(),
    })
)

/**
 * Transparently handles getting+transforming and untransforming+setting of a variable.
 * The result is nearly equivalent to the following: {
 *   get: () => transform(get()),
 *   set: value => set(untransform(value)),
 * }
 * ..except it remembers the last value to only run transform() or set() when needed.
 * @param {() => T1} options.get - getter for the current untransformed value.
 * @param {T1 => void} options.set - setter to update the current untransformed value.
 * @param {T1 => T2} options.transform - the transformation to apply.
 * @param {T2 => T1} options.untransform - the exact inverse of transformation.
 * @param {(T1, T1) => boolean} [options.isEqual] - compares equality of two untransformed values.
 * Defaults to (new, old) => new === old.
 * @returns {Object} A pair of functions { get, set }.
 */
export function transformingCache<T1, T2>({
    get,
    set,
    transform,
    untransform,
    isEqual = (a, b) => a === b,
}: {
    get: () => T1,
    set: (value: T1) => void,
    transform: (value: T1) => T2,
    untransform: (transformedValue: T2) => T1,
    isEqual?: (newValue: T1, oldValue: T1) => boolean,
}): {
    get: () => T2,
    set: (transformedValue: T2, options?: { trustCache?: boolean }) => void,
} {
    const uninitialised = Symbol('uninitialised')
    let lastValue: T1 | typeof uninitialised = uninitialised
    let lastTransformedValue: T2 | undefined
    return {
        get() {
            const newValue = get()
            if (lastValue === uninitialised || !isEqual(newValue, lastValue)) {
                lastTransformedValue = transform(newValue)
            }
            lastValue = newValue
            return lastTransformedValue
        },
        // trustCache allows skipping the get(); for optimisation in case you can guarantee that the
        // value has not changed since the previous get or set (e.g. in an atomic update).
        set(transformedValue, { trustCache = false } = {}) {
            // Idea: return directly if the transformed value is equal and known to be immutable.
            const newValue = untransform(transformedValue)
            const currentValue = trustCache ? lastValue : get()
            if (currentValue === uninitialised || !isEqual(newValue, currentValue)) {
                set(newValue)
            }
            lastValue = newValue
            lastTransformedValue = transformedValue
        },
    }
}

type ProxyMethodListener<T> = (method: keyof typeof Reflect, args: [T, ...any[] ]) => void

/**
 * A Proxy that appears as the object returned by get(), *at any moment*, and writes back changes
 * using set(object).
 * @param {() => Object} get - getter for the object; is run before any operation on the object.
 * @param {Object => void} set - setter for the object; is run after any operation on the object.
 * @returns {Proxy} The proxy.
 */
export function syncingProxy<T extends object>({ get, set }: {
    get: () => T,
    set: (value: T) => void,
}): T {
    // Get the current object to ensure the proxy's initial target has correct property descriptors.
    // (changing e.g. from a normal object to an Array causes trouble)
    const initialTarget = get()
    const { proxy, getTarget, setTarget } = mutableProxyFactory(initialTarget)

    const refreshProxyTarget = () => {
        const object = get()
        setTarget(object)
    }
    const writeBack = () => {
        const object = getTarget()
        set(object)
    }

    return makeListenerProxy<T>(refreshProxyTarget, writeBack)(proxy)
}

/**
 * Like syncingProxy, this appears as the object return by get(), at any moment. It also proxies any
 * member object, so that e.g. proxy.a.b will be updated to correspond to get().a.b at any moment.
 * @param {() => Object} get - getter to obtain the object; is run before any operation on the
 * object or any of its members (or members' members, etc.).
 * @param {Object => void} set - setter to update the object; is run after any operation on the
 * object or any of its members (or members' members, etc.).
 * @returns {Proxy} The proxy.
 */
export function deepSyncingProxy<R extends object>({ get, set, alwaysSet = false }: {
    get: () => R,
    set: (value: R) => void,
    alwaysSet?: boolean,
}): R {
    let rootObject: R
    // We will reload the whole object before any operation on any (sub)object.
    const getRootObject = () => { rootObject = get() }
    // We write back the whole object after any operation on any (sub)object.
    const writeBack = () => { set(rootObject) }

    function createProxy<S extends object>(
        object: S,
        path: string
    ): S {
        // Create a mutable proxy, using object as the initial target.
        const { proxy, setTarget } = mutableProxyFactory(object)

        const refreshProxyTarget = () => {
            // Update the root object.
            getRootObject()
            if (!isNonNullObject(rootObject)) throw new TypeError(
                `Expected get()${path} to be an object, but get() is ${rootObject}.`
                )
            // Walk to the corresponding object within the root object.
            let targetWalker: { [key: string]: any } = rootObject
            const properties = path.split('.').slice(1)
            for (let i = 0; i < properties.length; i++) {
                const child: any = targetWalker[properties[i]]
                if (!isNonNullObject(child)) {
                    const pathSoFar = '.' + properties.slice(0, i+1).join('.')
                    throw new TypeError(
                        `Expected get()${path} to be an object, but get()${pathSoFar} is ${child}.`
                    )
                }
                targetWalker = child
            }
            // Swap this proxy's target to the found object (we can leave other proxies outdated).
            setTarget(targetWalker as S) // the object at the given path has the same type as initially.
        }
        const writeBackIfMutating: ProxyMethodListener<S> = (method, args) => {
            // If the operation would have mutated a normal object, trigger a set()-sync
            if (modifyingOperations.includes(method)) {
                writeBack()
            }
        }
        const afterHook = alwaysSet ? writeBack : writeBackIfMutating
        return makeListenerProxy<S>(refreshProxyTarget, afterHook)(proxy)
    }

    // Get the current object to ensure the proxy's initial target has correct property descriptors.
    // (changing e.g. from a normal object to an Array causes trouble)
    const initialRootObject = get()
    return deepProxy(createProxy)(initialRootObject)
}

function isNonNullObject(value: any): value is object {
    return (typeof value === 'object' && value !== null)
}

// Operations which modify an object (if not performing tricks with getters or Proxies)
// (XXX hand-picked from the Reflect.* methods, potentially misguided)
const modifyingOperations = [
    'set', 'delete', 'defineProperty', 'deleteProperty', 'preventExtensions', 'setPrototypeOf',
]

/**
 * A proxy to the object, that runs the given hooks before and after every operation on the object.
 * @param {(method: string, args[]) => void} before - is run before any operation on the object.
 * Gets passed the name of the method that will be invoked, and its arguments.
 * @param {(method: string, args[]) => void} after - is run after any operation on the object.
 * Gets passed the name of the method that will be invoked, and its arguments.
 * @=>
 * @param {Object} object - the object to be proxied.
 * @returns {Proxy} The proxy to the given object.
 */
export function makeListenerProxy<T extends object>(
    before: ProxyMethodListener<T> = () => {},
    after: ProxyMethodListener<T> = () => {},
): (object: T) => T {
    return (object: T) => {
        const handler = Object.assign(
            {},
            ...Object.getOwnPropertyNames(Reflect).map((method: keyof typeof Reflect) => ({
                [method](...args: [T, ...any[]]) {
                    before(method, args)
                    const result = Reflect[method].apply(null, args)
                    after(method, args)
                    return result
                },
            })),
        )
        return new Proxy(object, handler)
    }
}

/**
 * A higher order proxy to have a proxy also wrap every attribute in the same type of proxy.
 * @param {(Object, path: string) => Proxy} createProxy
 * @=>
 * @param {Object} object - the object which, and whose members, will be wrapped using createProxy.
 * @returns {Proxy} A proxy around the proxy of the object.
 */
export function deepProxy<T extends object>(
    createProxy: (object: T, path: string) => T
): (object: T) => T {
    let createDeepProxy: (object: T, path: string) => T = (object, path) => {
        const target = createProxy(object, path)
        return new Proxy(target, {
            // Trap the get() method, to also wrap any subobjects using createProxy.
            get(target, property, receiver) {
                const value = Reflect.get(target, property, receiver)
                if (
                    value instanceof Object
                    && target.hasOwnProperty(property) // ignore .prototype, etc.
                    && typeof property === 'string' // would we want to support Symbols?
                ) {
                    // Wrap the object using createProxy; but recursively.
                    const innerProxy = createDeepProxy(value, `${path}.${property}`)
                    return innerProxy
                } else {
                    return value
                }
            },
        })
    }
    // Memoize to not create duplicate proxies of the same object (so that proxy.x === proxy.x).
    // FIXME Path could be an array, but then memoize should deep-compare arrays. For now, do not
    // put periods into property names!
    // (note that we do want path to be part of the memoization key: if two paths currently hold the
    // same object, they should result in two proxies because this situation might change)
    createDeepProxy = memoize(createDeepProxy)

    return object => createDeepProxy(object, '')
}
