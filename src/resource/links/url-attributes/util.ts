// Some simple helpers inspired by lodash etc.

/**
 * Merge two objects, with a custom function for resolving conflicts.
 *
 * @returns A new object, with values of the given objects merged in to it.
 */
export function merge<T extends object, V extends T[keyof T]>(
    /** Objects that will be shallowly merged, starting with the leftmost one */
    objects: T[],
    /**
     * Function to resolve the conflict whenever two objects both have a value for some key. The
     * returned value will be the one used in the resulting object. Default is to take the value of
     * the latter object.
     */
    mergeValues: (a: V, b: V) => V = (_, b) => b,
): T {
    const result: { [key: string]: any } = {}
    for (const object of objects) {
        for (const [key, value] of Object.entries(object)) {
            result[key] = key in result ? mergeValues(result[key], value) : value
        }
    }
    return result as T
}

/**
 * Return a clone of the object with given keys omitted.
 * @param {string[]} keys - The keys to omit when copying the object
 * @=>
 * @param {Object} object
 * @returns {Object} A shallow copy of object without the listed keys
 */
export function omit<T extends object, K extends keyof T>(object: T, keys: K[]): Omit<T, K> {
    const entries = Object.entries(object) as Entry<T>[]
    const entriesToKeep = entries.filter(
        (entry: Entry<T>): entry is Entry<Omit<T, K>> => !(keys as Array<any>).includes(entry[0])
    )
    return ObjectFromEntries(entriesToKeep)
}

type Entry<T> = { [P in keyof T]: [P, T[P]] }[keyof T]
function ObjectFromEntries<T>(entries: Entry<T>[]): T {
    return Object.fromEntries(entries) as Pick<T, keyof T>
}

/**
 * Return a clone of the array, with duplicate values removed.
 * @param {Array} - array
 * @returns {Array} newArray - copy of the array without duplicates
 */
export function uniq<T>(array: Array<T>): Array<T> {
    const newArray = []
    const seen = new Set()
    for (const value of array) {
        if (!(seen.has(value))) {
            seen.add(value)
            newArray.push(value)
        }
    }
    return newArray
}
