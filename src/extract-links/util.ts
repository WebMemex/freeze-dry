/**
 * Combined map and flatten.
 */
export function flatMap<T,U>(arr: T[], f: (v: T) => (U | U[])): U[] {
    return arr.map(f).reduce<U[]>((newArr, item) => newArr.concat(item), [])
}
