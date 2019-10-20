const MAPPED_ATTRIBUTES = { class: 'className' }
const DIRECT_SET_ATTRIBUTES = 'textContent|innerText|innerHTML|className|value|style|checked|selected|src|srcdoc|srcset|tabindex|target'.split('|')
        .reduce((agg, next)=> { agg[next] = 1; return agg }, {})
const handles = {}
const prototypeFuncs = {
        'attach': attach,
        'addEventListener': addEventListener,
        'setAttribute': setAttribute,
        'renderChildren': renderChildren,
        'render': render,
        'remove': remove,
        'compareElement': compareElement,
        // TODO: Define and manage updates
        'update': update,
        'mount': mount
    }
const hasPrefix = (name, prefix) => name.slice(0, prefix.length) === prefix
const keys = obj => Object.keys(obj)
const isType = type => val => typeof val === type
// const capitalCase = str => str.slice(0, 1).toUpperCase() + str.slice(1) 
// TODO: this probably isn't really sufficient, but works in a pinch
const isClass = (func) => Object.getOwnPropertyNames(func).length === 3
// const isPrototypeFunction = (func) => Object.getOwnPropertyNames(func).includes('arguments')
// const hadPrototype = (func) => Object.getOwnPropertyNames(func).includes('prototype')
const LIFECYCLE_HOOKS = ['onRender', 'onAttach', 'onDestroy']
const LIFECYCLE_EVENTS_RENDER = LIFECYCLE_HOOKS[0]
const LIFECYCLE_EVENTS_ATTACH = LIFECYCLE_HOOKS[1]
const LIFECYCLE_EVENTS_DESTROY = LIFECYCLE_HOOKS[2]
const isString = isType('string')
const isBool = isType('boolean')
const isFunction = isType('function')
const isObject = isType('object')
const isUndefined = isType('undefined')
const isNull = val => val == null
const ignoreCompare = [
    'element',
    'parentElement',
    'parentComponent',
    'handle',
    'renderedChildren',
    '_events',
    'externalProps',
    'internalProps'
]
const compareObj = (val, val2, name, obj, obj2) => {
    if (isNull(val) && isNull(val2)){
        return true
    }
    if (typeof val !== typeof val2) {
        console.log(name, "typeof", false)
        return false
    }
    // ignoring functions for equality
    if (isFunction(val)) {
        return true
    } else if (Array.isArray(val)) {
        return Array.isArray(val2) && 
            val.reduce(
                (bool, next, index) => bool && compareObj(next, val2[index], `${name}[${index}]`),
             true)
    } else if (isObject(val)) {
        const comparison = compare(val, val2)
        return keys(val).reduce((bool, key) => bool && comparison(key, [name,key].join('.')), true)
    }
    const equal = val === val2
    console.log(name, equal)
    return equal
}
const compare = (obj, obj2) => (name, keyName) => {
    // lets ignore the recursive items and unique handle
    if(ignoreCompare.includes(name) || (isNull(obj) && isNull(obj2))) {
        console.log("ignored: ", keyName, true)
        return true
    }
    if (isNull(obj) || isNull(obj2)) {
        console.log("one null: ", keyName, false)
        return false
    }
    return compareObj(obj[name], obj2[name], keyName || name, obj, obj2)
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
    this.externalProps = props
    this.initialProps = initialProps
    this.props = assign(this.externalProps, this.initialProps)
    this.isVirtual = true
}
const createElementComponent = (props, tagName, overrides) => {
    const comp = new Component(props)
    comp.tagName = tagName
    comp.isVirtual = false
    return assign(comp, overrides)
}

const createComponent = (props, initialProps, overrides) => {
    const comp = new Component(props, initialProps)
    comp.isVirtual = true
    return assign(comp, overrides)
}

// pipe renderer functions to prototype.
keys(prototypeFuncs).forEach((key) => Component.prototype[key] = prototypeFuncs[key])

function addEventListener(evName, handler) {
    if (this.isVirtual) {
        return
    }
    let handle = (ev) => { handler.apply(this, [ev, elem, this])}
    let elem = this.element
    elem.addEventListener(evName, handle)
    return () => elem.removeEventListener(evName, handle)
}

function mount(parentElement, parentComponent) {
    let c = this.render(parentElement, parentComponent) 
    this.handle = this.handle || this.props.id || this.props._id || Symbol(c.tagName || 'v')
    if (c.element) {
        c.element.remove = c.remove
    }
    handles[this.handle] = c
    return c
}

/**
 * Attaches the element to the Dom.
 * Could easily be overridden to allow full unit testing 
 * 
 * @param {HTMLElement} parentElement 
 * @returns 
 */
function attach(parentElement) {
    this.parentElement = parentElement
    // if a virtual element, tagName is not defined, thus, element should pass through
    let element = this.tagName ? this.element : this.parentElement
    if (!element) {
        element = document.createElement(this.tagName)
        parentElement.appendChild(element)
    }
    return element
}

/**
 * Renders the element and children to the DOM
 * Using a prototype function for performance
 * 
 * @param {HTMLElement} parentElement
 * @returns {any}
 */
function render(parentElement, parentComponent) {
    let elem = this.attach(parentElement)
    this.parentComponent = parentComponent
    this.element = this.isVirtual ? null : elem
    commitLifecycleEvent(this, LIFECYCLE_EVENTS_ATTACH)
    this.renderedChildren = this.renderChildren(elem, this.isVirtual ? this : parentComponent)
    const addProps = (attr, index, arr) => {
        let value = this.props[attr]
        // is native event property: 
        if (hasPrefix(attr, 'on')) {
            this._events = this._events || []
            this._events.push(this.addEventListener(attr.slice(2), value))
            return
        }
        this.setAttribute(attr, value)
    }
    if (!this.isVirtual) {
        // only add props for elements
        keys(this.props).forEach(addProps)
    }
    commitLifecycleEvent(this, LIFECYCLE_EVENTS_RENDER)
    return this
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
function compareElement(comp) {
    const comparison = compare(this, comp)
    return {
        identical: keys(this).reduce((match, key) => match && comparison(key), true),
        reusable: comparison('tagName')
    }
}

function renderChildren(parentElement, parentComponent) {
    let previouslyRendered = this.renderedChildren
    let getExisting = (index) =>  previouslyRendered ? previouslyRendered[index] : null

    let children = this.props.children
        .filter(child => child != null)
        .map((child, index) => {
            let current = getExisting(index)
            if (current) {
                let comparison = current.compareElement(child)
                if (comparison.identical) {
                    previouslyRendered[index] = undefined
                    return current
                } else if (comparison.reusable) {
                    child.element = current.element
                    // this is set so as we go through the hierarchy everything works
                    child.renderedChildren = current.renderedChildren
                    // reset values so se can call remove to cleanup
                    current.renderedChildren = []
                    current.element = undefined
                }
            }
            if (!child.render) { 
                let test = this
                debugger
                error('child must have render function') 
            }
            return child.mount(parentElement, parentComponent)
        })
    
    if (previouslyRendered) {
        previouslyRendered.forEach((child) => {
            if (child && child.remove) {
                child.remove()
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
        setTimeout(() => { 
            runContentFunc(this)
            this.renderedChildren = this.renderChildren(this.element || this.parentElement, this)
        })
    }
}

function remove() {
    // for cleanup of handles to eliminate memory leak -- can make the rest of the child cleanup async somehow
    this.renderedChildren.forEach(c => c.remove())
    handles[this.handle] = null
    let ep = this.parentElement;
    if (this._events) {
        this._events.forEach((rm) => rm())
    }
    if (this.element && ep && ep !== this.element) {
        ep.removeChild(this.element)
    }
    this.element = null
    this.parentComponent = null
    this.parentElement = null
    commitLifecycleEvent(this, LIFECYCLE_EVENTS_DESTROY)
}

function commitLifecycleEvent(context, eventName) {
    let event =  context[eventName] || context.props[eventName]
    if (event) {
        event.call(context)
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
        if (Array.isArray(attributes[0])) {
            children = attributes[0]
            attr = {}
        } else if (isString(attributes[0])) {
            attr = {textContent: attributes[0]}
        } else if (attributes[0].render) {
            children.unshift(attributes[0])
            attr = {}
        }
        if (isString(children[0])) {
            attr.textContent = children[0]
            children = children.slice(1)
        }
        if (Array.isArray(children[0])) {
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

/** Util Functions */
function assign() {
    return Object.assign.apply(null, Array.from(arguments))
}

function error(message) {
    throw new Error(message)
}

window.handles = handles
