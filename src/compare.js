import { isNull, isFunction, isArray, isObject, keys } from "./utils"
import { parentElement, parentComponent, subscribedEvents, internalData, externalData, renderedChildren, element, handle, tagName, registeredType } from "./nameMapping"

const ignoreCompare = [
    element,
    handle,
    parentElement,
    parentComponent,
    renderedChildren,
    subscribedEvents,
    externalData,
    internalData,
    registeredType
    // TODO: Move to testing against external props
    // - The real trick here is to test against internal props when we are looking at a specific component for their own data,
    // - but not if we are looking at children.
]

// const compareObj = (val, val2, name, obj, obj2) => {
//     if (isNull(val) && isNull(val2)){
//         return true
//     }
//     if (typeof val !== typeof val2) {
//         console.log(name, "typeof", false)
//         return false
//     }
//     // ignoring functions for equality
//     if (isFunction(val)) {
//         return true
//     } else if (isArray(val)) {
//         return isArray(val2) && 
//             val.reduce(
//                 (bool, next, index) => bool && compareObj(next, val2[index], `${name}[${index}]`),
//              true)
//     } else if (isObject(val)) {
//         const comparison = compare(val, val2)
//         return keys(val).reduce((bool, key) => bool && comparison(key, [name,key].join('.')), true)
//     }
//     const equal = val === val2
//     console.log(name, equal)
//     return equal
// }

// const compare = (obj, obj2) => (name, keyName) => {
//     // lets ignore the recursive items and unique handle
//     if(ignoreCompare.includes(name) || (isNull(obj) && isNull(obj2))) {
//         console.log("ignored: ", keyName, true)
//         return true
//     }
//     if (isNull(obj) || isNull(obj2)) {
//         console.log("one null: ", keyName, false)
//         return false
//     }
//     return compareObj(obj[name], obj2[name], keyName || name, obj, obj2)
// }

// Use above for testing when needed

const compareObj = (val, val2) => {
    if (isNull(val) && isNull(val2)){
        return true
    }
    if (typeof val !== typeof val2) {
        return false
    }
    // ignoring functions for equality
    if (isFunction(val)) {
        return true
    } else if (isArray(val)) {
        return isArray(val2) && 
            val.reduce(
                (bool, next, index) => bool && compareObj(next, val2[index]), true)
    } else if (isObject(val)) {
        const comparison = compare(val, val2)
        return keys(val).reduce((bool, key) => bool && comparison(key), true)
    }
    return val === val2
}
const compare = (obj, obj2) => (name) => {
    // lets ignore the recursive items and unique handle
    if(ignoreCompare.includes(name) || (isNull(obj) && isNull(obj2))) {
        return true
    }
    if (isNull(obj) || isNull(obj2)) {
        return false
    }
    return compareObj(obj[name], obj2[name])
}

/**
 * 
 *
 * @param {Component} comp
 * @returns {{identical: boolean, reusable: boolean}}
 */
export default function compareComponent(comp) {
    const comparison = compare(this, comp)
    
    return {
        identical: keys(this).reduce((match, key) => match && comparison(key), true),
        reusable: this[tagName] ? comparison(tagName) : compareObj(this[registeredType], comp[registeredType])
    }
}
