
export const hasPrefix = (name, prefix) => name.slice(0, prefix.length) === prefix
export const keys = obj => Object.keys(obj)
export const isType = type => val => typeof val === type
export const isString = isType('string')
export const isBool = isType('boolean')
export const isFunction = isType('function')
export const isObject = isType('object')
export const isUndefined = isType('undefined')
export const isArray = val => Array.isArray(val)
export const isNull = val => val == null
// const capitalCase = str => str.slice(0, 1).toUpperCase() + str.slice(1) 
export const delay = (func, time) => setTimeout(func, time || 0)

// TODO: this probably isn't really sufficient, but works in a pinch
export const isClass = (func) => Object.getOwnPropertyNames(func).length === 3
// const isPrototypeFunction = (func) => Object.getOwnPropertyNames(func).includes('arguments')
// const hadPrototype = (func) => Object.getOwnPropertyNames(func).includes('prototype')

export function assign() {
    return Object.assign.apply(null, Array.from(arguments))
}

export function error(message) {
    throw new Error(message)
}