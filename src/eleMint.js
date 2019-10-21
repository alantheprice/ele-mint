import { compare } from './comparison';
import { error, keys, assign, isFunction, isBool, isString, isArray, isClass, delay } from './utils';
import { attach } from './attach';
import { addEventListener } from './eventListener';
import { render } from './render';
import { attachFunc, addEventListenerFunc, setAttributeFunc, renderChildrenFunc, renderFunc, removeFunc, compareComponentFunc, commitLifecycleEventFunc, externalData, internalData, isVirtual, renderedChildren, parentComponent, parentElement, subscribedEvents } from './nameMapping';

const MAPPED_ATTRIBUTES = { class: 'className' }
const DIRECT_SET_ATTRIBUTES = 'textContent|innerText|innerHTML|className|value|style|checked|selected|src|srcdoc|srcset|tabindex|target'.split('|')
        .reduce((agg, next)=> { agg[next] = 1; return agg }, {})
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
        // These two will likely be called by a user and should be sematic
        'update': update,
        'mount': mount,
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
 *              this.props.children
 *          )
 *      }
 *  }
 *  export Container
 *  ```
 *
 * @param {*} props
 */
export const Component = function(props, initialProps) { 
    // TODO: We should do some magic here to find out if the prop is passed in, or if it is internal to the class....
    // Then we could figure out if we have to emit to the parent, or just handle internally.
    this[externalData] = props
    this[internalData] = initialProps
    this.props = assign({}, props, initialProps)
    this[isVirtual] = true
}
const createElementComponent = (props, tagName, overrides) => {
    const comp = new Component(props)
    comp.tagName = tagName
    comp[isVirtual] = false
    return assign(comp, overrides)
}

const createComponent = (props, initialProps, overrides) => {
    const comp = new Component(props, initialProps)
    comp[isVirtual] = true
    return assign(comp, overrides)
}

// pipe renderer functions to prototype.
keys(prototypeFuncs).forEach((key) => Component.prototype[key] = prototypeFuncs[key])


function mount(parentElement, parentComponent) {
    let c = this[renderFunc](parentElement, parentComponent) 
    this.handle = this.handle || this.props.id || this.props._id || Symbol(c.tagName || 'v')
    if (c.element) {
        c.element[removeFunc] = c[removeFunc]
    }
    handles[this.handle] = c
    return c
}


/**
 * Set an attribute on the element
 * 
 * @param {string} attributeName 
 * @param {any} value 
 */
function setAttribute(attributeName, value) {
    if (attributeName === 'children') { return }
    let mKey = MAPPED_ATTRIBUTES[attributeName] || attributeName,
        elem = this.element
    if (DIRECT_SET_ATTRIBUTES[mKey] || isBool(value)) {
        elem[mKey] = value
    } else {
        elem.setAttribute(mKey, value)
    }
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
        reusable: comparison('tagName')
    }
}

function renderChildren(parentElement, parentComponent) {
    let previouslyRendered = this[renderedChildren]
    let getExisting = (index) =>  previouslyRendered ? previouslyRendered[index] : null
    // The additional thing we need to consider if allowing a child to keep their state values 
    // rather than just overriding them..., but maybe that doesn't make sense.
    // 

    let children = this.props.children
        .filter(child => child != null)
        .map((child, index) => {
            let current = getExisting(index)
            if (current) {
                let comparison = current._ccF(child)
                if (comparison.identical) {
                    previouslyRendered[index] = undefined
                    return current
                } else if (comparison.reusable) {
                    child.element = current.element
                    // this is set so as we go through the hierarchy everything works
                    child[renderedChildren] = current[renderedChildren]
                    // reset values so se can call remove to cleanup
                    current[renderedChildren] = []
                    current.element = undefined
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

function update(obj) {
    let didUpdate = false
    this.props = keys(obj).reduce((agg, key) => {
        if (agg[key] !== obj[key]) {
            agg[key] = obj[key]
            didUpdate = true
        }
        return agg
    }, this.props)
    if (didUpdate) {
        // Using a settimeout to allow this to be asynchrous
        delay(() => { 
            runContentFunc(this)
            this[renderedChildren] = this[renderChildrenFunc](this.element || this._pe, this)
        })
    }
}

function remove() {
    // 
    this[commitLifecycleEventFunc]('onWillRemove')
    // for cleanup of handles to eliminate memory leak -- can make the rest of the child cleanup async somehow
    this[renderedChildren].forEach(c => c[removeFunc]())
    handles[this.handle] = null
    let ep = this[parentElement];
    if (this[subscribedEvents]) {
        this[subscribedEvents].forEach((rm) => rm())
    }
    if (this.element && ep && ep !== this.element) {
        ep.removeChild(this.element)
    }
    this.element = null
    this[parentComponent] = null
    this[parentElement] = null
}

function commitLifecycleEvent(eventName) {
    let event =  this[eventName] || this.props[eventName]
    if (event) {
        event.call(this)
    }
}

function runContentFunc(comp) {
    if (isFunction(comp.content)) {
        comp.props.children = [
            comp.content(
                comp.props, 
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
        const props =  assign({}, attr, {children: children})
        if (isString(tagNameOrComponent)) {
            return createElementComponent(props, tagNameOrComponent, overrides)
        }
        if (isClass(tagNameOrComponent)) {
            return new tagNameOrComponent(props)
        }
        return createComponent(props, {}, assign({}, overrides, {content: tagNameOrComponent}))
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
