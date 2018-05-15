// Some simple helpers inspired by lodash/fp.

// Merge two objects, with a custom function for resolving conflicts.
export const mergeWith = mergeValues => (...objects) => {
    const result = {}
    for (const object of objects) {
        for (const [key, value] of Object.entries(object)) {
            result[key] = result[key] ? mergeValues(result[key], value) : value
        }
    }
    return result
}

// Return a clone of the object with given keys omitted.
export const omit = keys => object => {
    const entries = Object.entries(object)
    const result = {}
    for (const [key, value] of entries) {
        if (!keys.includes(key)) {
            result[key] = value
        }
    }
    return result
}

// Return a clone of the array, with duplicate values removed.
export const uniq = array => {
    const newArray = [];
    const seen = new Set();
    for (const value of array) {
        if (!(seen.has(value))) {
            seen.add(value);
            newArray.push(value)
        }
    }
    return newArray
}
