import { compare } from './comparison';
import { error, keys, assign, isFunction, isBool, isString, isArray, isClass, delay } from './utils';
import attach from './attach';
import addEventListener from './addEventListener';
import render from './render';
import { attachFunc, addEventListenerFunc, setAttributeFunc, renderChildrenFunc, renderFunc, removeFunc, compareComponentFunc, commitLifecycleEventFunc, externalDataProps, internalDataProps, isVirtual, renderedChildren, parentComponent, parentElement, subscribedEvents, data, tagName, handle, element, updateReducer } from './nameMapping';
import setAttribute from './setAttributes';

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

// Base
/**
 * Base Class/Prototype to extend for class usage
 *  example: 
 *  ```javascript
 *  import { Component, register } from 'ele-mint'
 *  const section = register('section')
 * 
 *  class Container extents Component {
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
    // TODO: We should do some magic here to find out if the prop is passed in, or if it is internal to the class....
    // Then we could figure out if we have to emit to the parent, or just handle internally.
    this[externalDataProps] = keys(passedInData)
    this[internalDataProps] = keys(initialData)
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
    
    if (previouslyRendered) {
        previouslyRendered.forEach((child) => {
            if (child && child[removeFunc]) {
                child[removeFunc]()
            }
        })
    }
    return children
}

function updateFunc(obj) {
    let reducedObj = obj
    // This allows the user 
    if (isFunction(this[updateReducer])) {
        reducedObj = this[updateReducer](this[data], obj)
    }
    
    let didUpdate = false
    let didUpdateParent = false
    // TODO: We need to intelligently manage how we pass data up, and how we handle it when it is passed up.
    let parentObj = {}
    this[data] = keys(reducedObj).reduce((agg, key) => {
        if (agg[key] !== reducedObj[key]) {
            if (this[externalDataProps].indexOf(key) > -1) {
                didUpdateParent = true
                parentObj[key] = reducedObj[key]
            } else {
                agg[key] = reducedObj[key]
                didUpdate = true
            }
        }
        return agg
    }, this[data])
    if (didUpdateParent && this[parentComponent]) {
        this[parentComponent].update(parentObj)
        return
    }
    if (didUpdate  && !didUpdateParent) {
        // Using a settimeout to allow this to be asynchrous
        delay(() => { 
            runContentFunc(this)
            this[renderedChildren] = this[renderChildrenFunc](this.element || this[parentElement], this)
        })
    }
}

function remove() {
    // 
    this[commitLifecycleEventFunc]('onWillRemove')
    // for cleanup of handles to eliminate memory leak -- can make the rest of the child cleanup async somehow
    this[renderedChildren].forEach(c => c[removeFunc]())
    handles[this[handle]] = null
    let ep = this[parentElement];
    if (this[subscribedEvents]) {
        this[subscribedEvents].forEach((rm) => rm())
    }
    if (this[element] && ep && ep !== this[element]) {
        ep.removeChild(this[element])
    }
    this[element] = null
    this[parentComponent] = null
    this[parentElement] = null
}

function commitLifecycleEvent(eventName) {
    let event =  this[eventName] || this.data[eventName]
    if (event) {
        event.call(this)
    }
}

function runContentFunc(comp) {
    if (isFunction(comp.content)) {
        comp.data.children = [
            comp.content(
                comp[data], 
                (obj) => comp.update(obj)
            )]
    }
    return comp
}

/**
 * Returns a function closure for building different html elements.
 * 
 * @param {string|Function} tagNameOrComponent 
 * @returns 
 */
export function register(tagNameOrComponent, overrides) {
    if (!tagNameOrComponent) {
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
        if (isString(tagNameOrComponent)) {
            return createElementComponent(data, tagNameOrComponent, overrides)
        }
        if (isClass(tagNameOrComponent)) {
            return new tagNameOrComponent(data)
        }
        return createComponent(data, {}, assign({}, overrides, {content: tagNameOrComponent}))
    }

    /**
     * Create an element definition for tagNameOrComponent and input attributes
     * @param {any} attributes 
     * @param {...FunDom} [children] 
     * @returns {FunDom}
     */
    return function build(...attributes) {
        return runContentFunc(construct(...attributes))
    }
}

/**
 * override function to allow overriding parts of the rendering pipeline, or even the whole rendering
 * 
 * @export
 * @param {any} overrides 
 * @returns 
 */
export function override(overrides) {
    return function(tagName, secondaryOverride) {
        return register(tagName, assign({}, overrides, secondaryOverride))
    }
}
window.handles = handles
