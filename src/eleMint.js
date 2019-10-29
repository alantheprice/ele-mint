import compare from './compare';
import { error, keys, assign, isString, isArray, isClass } from './utils';
import attach from './attach';
import update from './update';
import addEventListener from './addEventListener';
import render from './render';
import { attachFunc, addEventListenerFunc, setAttributeFunc, renderChildrenFunc, renderFunc, removeFunc, compareComponentFunc, commitLifecycleEventFunc, externalData, internalData, isVirtual, data, tagName, handle, element, registeredType, component, overrides, children, dataDidChangeFunc, setDataFunc, updateFunc, mountFunc, commitUpdateFunc, renderedChildren, parentElement } from './nameMapping';
import setAttribute from './setAttributes';
import remove from './remove';
import renderChildren from './renderChildren';

const handles = {}

const prototypeFuncs = {
        [attachFunc]: attach,
        [addEventListenerFunc]: addEventListener,
        [setAttributeFunc]: setAttribute,
        [renderChildrenFunc]: renderChildren,
        [renderFunc]: render,
        [removeFunc]: remove,
        [compareComponentFunc]: compare,
        [commitLifecycleEventFunc]: commitLifecycleEvent,
        [dataDidChangeFunc]: dataDidChange,
        [setDataFunc]: setData,
        [commitUpdateFunc]: commitUpdate,
        [updateFunc]: update,
        [mountFunc]: mount,
    }

/**
 * Base Class/Prototype to extend for class usage
 *  example: 
 *  ```javascript
 *  import { Component, register } from 'ele-mint'
 *  const section = register('section')
 * 
 *  class Container extends Component {
 *  
 *      content(data, update) {
 *          return section({class: 'c-section'}
 *              this.data.children
 *          )
 *      }
 *  }
 *  export Container
 *  ```
 *
 * @param {*} data
 */
export const Component = function(passedInData, initialData) {
    this[setDataFunc](initialData, passedInData)
    this[isVirtual] = true
}

const createElementComponent = (data, tagNameProp, overrides) => {
    const comp = new Component(data)
    comp[tagName] = tagNameProp
    comp[isVirtual] = false
    return assign(comp, overrides)
}

const createComponent = (data, initialData, overrides) => {
    const comp = new Component(data, initialData)
    return assign(comp, overrides)
}

// pipe renderer functions to prototype.
keys(prototypeFuncs).forEach((key) => Component.prototype[key] = prototypeFuncs[key])


function mount(parentElement, parentComponent) {
    let c = this[renderFunc](parentElement, parentComponent) 
    this[handle] = this[handle] || this[data].id || Symbol(c[tagName] || 'v')
    if (c[element]) {
        c[element][removeFunc] = c[removeFunc]
    }
    handles[this[handle]] = c
    return c
}

function commitLifecycleEvent(eventName) {
    let event =  this[eventName]
    if (event) {
        return event.apply(this, [...arguments].slice(1)) || true
    }
    return true
}

function dataDidChange(newData) {
    this[setDataFunc](this[internalData], newData)
    this[commitUpdateFunc]()
}

function setData(intData, extData) {
    this[externalData] = assign({}, extData)
    this[internalData] = assign({}, intData)
    this[data] = assign({}, this[internalData], this[externalData])
}

function commitUpdate() {
    this[renderedChildren] = this[renderChildrenFunc](this[element] || this[parentElement], this)
}


/**
 * Returns a function closure for building different html elements or components
 * @param {Object} config
 * @param {string} [config.tagName]
 * @param {Function} [config.component]  -- actually config[component] so it is using the correct property name
 * @param {Object} [config.overrides]    -- actually config[overrides] so it is using the correct property name
 * @param {Object} [config.internalData] -- actually config[internalData] so it is using the correct property name
 * @returns 
 */
const internalRegister = (config) => {
    if (!config[tagName] && !config[component]) {
        error('tagName or Component must be defined')
    }
    const rType = Symbol('rt')

    const construct = (...attributes) => {
        // TODO: Since attributes is an array, we could reduce our way to success.
        let attr = attributes[0] || {}
        let childs = attributes.slice(1)
        if (isArray (attributes[0])) {
            childs = attributes[0]
            attr = {}
        } else if (isString(attributes[0])) {
            attr = {textContent: attributes[0]}
        } else if ((attributes[0]||{})[renderFunc]) {
            childs.unshift(attributes[0])
            attr = {}
        }
        if (isString(childs[0])) {
            attr.textContent = childs[0]
            childs = childs.slice(1)
        }
        if (isArray(childs[0])) {
            childs = childs[0]
        }
        const data =  assign({}, attr, {[children]: childs})
        if (isString(config[tagName])) {
            return createElementComponent(data, config[tagName], config[overrides])
        }
        if (isClass(config[component])) {
            return new config[component](data, config[internalData])
        }
        return createComponent(data, config[internalData], assign({}, config[overrides], {content: config[component]}))
    }

    /**
     * Create an element definition for tagName or Component and input attributes
     * @param {any} attributes 
     * @param {...FunDom} [children] 
     * @returns {FunDom}
     */
    return function build(...attributes) {
        let comp = construct(...attributes)
        comp[registeredType] = rType
        return comp
    }
}

export const register = (tag, overrideFunctions) => {
    return internalRegister({
        [tagName]: tag, 
        [overrides]: overrideFunctions
    })
}

export const registerComponent = (comp, intData, overrideFunctions) => {
    return internalRegister({
        [component]: comp, 
        [internalData]: intData, 
        [overrides]: overrideFunctions
    })
}

window.handles = handles
