/**
 * Combined map and flatten.
 */
export const flatMap = (arr, f) => arr.map(f).reduce((newArr, item) => newArr.concat(item), [])
