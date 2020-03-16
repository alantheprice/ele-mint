
export const hasPrefix = (name, prefix) => name.slice(0, prefix.length) === prefix
export const keys = obj => Object.keys(obj || {})
export const isType = type => val => typeof val === type
export const isString = isType('string')
export const isBool = isType('boolean')
export const isFunction = isType('function')
export const isObject = isType('object')
export const isUndefined = isType('undefined')
export const isArray = val => Array.isArray(val)
export const isNull = val => val == null
// const capitalCase = str => str.slice(0, 1).toUpperCase() + str.slice(1) 

/**
 * Delay function wrapping a setimeout 
 *
 * @param {Function} func
 * @param {number} [time]
 */
export const delay = (func, time) => setTimeout(func, time || 0)

export function assign() {
    return Object.assign.apply(null, Array.from(arguments))
}

export function error(message) {
    throw new Error(message)
}