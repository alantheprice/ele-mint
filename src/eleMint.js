import { compare } from './comparison';
import { error, keys, assign, isString, isArray, isClass, runContentFunc } from './utils';
import attach from './attach';
import updateFunc from './update';
import addEventListener from './addEventListener';
import render from './render';
import { attachFunc, addEventListenerFunc, setAttributeFunc, renderChildrenFunc, renderFunc, removeFunc, compareComponentFunc, commitLifecycleEventFunc, externalData, internalData, isVirtual, renderedChildren, parentComponent, parentElement, subscribedEvents, data, tagName, handle, element, updateReducer } from './nameMapping';
import setAttribute from './setAttributes';
import remove from './remove';

const handles = {}

const prototypeFuncs = {
        [attachFunc]: attach,
        [addEventListenerFunc]: addEventListener,
        [setAttributeFunc]: setAttribute,
        [renderChildrenFunc]: renderChildren,
        [renderFunc]: render,
        [removeFunc]: remove,
        [compareComponentFunc]: compareComponent,
        [commitLifecycleEventFunc]: commitLifecycleEvent,
        // These two will able to be called by a user and should be sematic
        'update': updateFunc,
        'mount': mountFunc,
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
 *      content() {
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
    this[externalData] = assign({}, passedInData)
    this[internalData] = assign({}, initialData)
    this[data] = assign({}, passedInData, initialData)
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
    comp[isVirtual] = true
    return assign(comp, overrides)
}

// pipe renderer functions to prototype.
keys(prototypeFuncs).forEach((key) => Component.prototype[key] = prototypeFuncs[key])


function mountFunc(parentElement, parentComponent) {
    let c = this[renderFunc](parentElement, parentComponent) 
    this[handle] = this[handle] || this[data].id || Symbol(c[tagName] || 'v')
    if (c[element]) {
        c[element][removeFunc] = c[removeFunc]
    }
    handles[this[handle]] = c
    return c
}

/**
 * 
 *
 * @param {Component} comp
 * @returns {{identical: boolean, reusable: boolean}}
 */
function compareComponent(comp) {
    const comparison = compare(this, comp)
    return {
        identical: keys(this).reduce((match, key) => match && comparison(key), true),
        reusable: comparison(tagName)
    }
}

function renderChildren(parentElement, parentComponent) {
    let previouslyRendered = this[renderedChildren]
    let getExisting = (index) =>  previouslyRendered ? previouslyRendered[index] : null
    // The additional thing we need to consider if allowing a child to keep their state values 
    // rather than just overriding them..., but maybe that doesn't make sense.

    let children = this[data].children
        .filter(child => child != null)
        .map((child, index) => {
            let current = getExisting(index)
            if (current) {
                let comparison = current[compareComponentFunc](child)
                if (comparison.identical) {
                    previouslyRendered[index] = undefined
                    return current
                } else if (comparison.reusable) {
                    child[element] = current[element]
                    // this is set so as we go through the hierarchy everything works
                    child[renderedChildren] = current[renderedChildren]
                    // reset values so se can call remove to cleanup
                    current[renderedChildren] = []
                    current[element] = undefined
                }
            }
            if (!child[renderFunc]) {
                error('child must have render function') 
            }
            return child.mount(parentElement, parentComponent)
        })
    debugger
    if (previouslyRendered) {
        previouslyRendered.forEach((child) => {
            debugger
            if (child && child[removeFunc]) {
                child[removeFunc]()
            }
        })
    }
    return children
}

function commitLifecycleEvent(eventName) {
    let event =  this[eventName] || this.data[eventName]
    if (event) {
        event.call(this)
    }
}


/**
 * Returns a function closure for building different html elements or components
 * @param {Object} config
 * @param {string} [config.tagName]
 * @param {Function} [config.component]
 * @param {Object} [config.overrides]
 * @param {Object} [config.internalData]
 * @returns 
 */
const internalRegister = (config) => {
    if (!config[tagName] && !config.component) {
        error('tagName or Component must be defined')
    }

    const construct = (...attributes) => {
        // TODO: Since attributes is an array, we could reduce our way to success.
        let attr = attributes[0] || {}
        let children = attributes.slice(1)
        if (isArray (attributes[0])) {
            children = attributes[0]
            attr = {}
        } else if (isString(attributes[0])) {
            attr = {textContent: attributes[0]}
        } else if (attributes[0][renderFunc]) {
            children.unshift(attributes[0])
            attr = {}
        }
        if (isString(children[0])) {
            attr.textContent = children[0]
            children = children.slice(1)
        }
        if (isArray(children[0])) {
            children = children[0]
        }
        const data =  assign({}, attr, {children: children})
        if (isString(config[tagName])) {
            return createElementComponent(data, config[tagName], config.overrides)
        }
        if (isClass(config.component)) {
            return new config.component(data, config.internalData)
        }
        return createComponent(data, config.internalData, assign({}, config.overrides, {content: config.component}))
    }

    /**
     * Create an element definition for tagName or Component and input attributes
     * @param {any} attributes 
     * @param {...FunDom} [children] 
     * @returns {FunDom}
     */
    return function build(...attributes) {
        return runContentFunc(construct(...attributes))
    }
}

export const register = (tag, overrides) => {

    return internalRegister({[tagName]: tag, overrides: overrides})
}

export const registerComponent = (component, internalData, overrides) => {
    return internalRegister({component: component, internalData: internalData, overrides: overrides})
}

window.handles = handles
