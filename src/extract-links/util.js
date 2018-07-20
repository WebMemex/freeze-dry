/**
 * Like Object.assign, but copying property descriptors rather than property values. Also does not
 * mutate any of the objects.
 * @param {...Object} objects - The objects to be merged. Later objects override previous objects in
 * case of conflicting keys.
 * @returns {Object} A new object, with property descriptors copied from the given objects.
 */
export const assignProperties = (...objects) => objects.reduce(assignProperties_inner, {})

const assignProperties_inner = (object1, object2) => {
    for (const propertyName of Object.getOwnPropertyNames(object2)) {
        const propertyDescriptor = Object.getOwnPropertyDescriptor(object2, propertyName)
        // Uncommenting the code below would allow assigning a setter/getter without overwriting
        // the corresponding getter/setter (respectively). Would that behaviour be more desirable?
        // if (propertyDescriptor.get === undefined) {
        //     delete propertyDescriptor.get
        // }
        // if (propertyDescriptor.set === undefined) {
        //     delete propertyDescriptor.set
        // }
        Object.defineProperty(object1, propertyName, propertyDescriptor)
    }
    return object1
}

/**
 * Combined map and flatten.
 */
export const flatMap = (arr, f) => arr.map(f).reduce((newArr, item) => newArr.concat(item), [])
