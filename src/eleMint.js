const MAPPED_ATTRIBUTES = { class: 'className' }
const DIRECT_SET_ATTRIBUTES = 'textContent|innerText|innerHTML|className|value|style|checked|selected|src|srcdoc|srcset|tabindex|target'.split('|')
        .reduce((agg, next)=> { agg[next] = 1; return agg }, {})
const handles = {}
const prototypeFuncs = {
        'attach': attach,
        'addEventListener': addEventListener,
        'setProp': setProp,
        'addEmitHandler': addEmitHandler,
        'setAttribute': setAttribute,
        'renderChildren': renderChildren,
        'render': render,
        'remove': remove,
        'emit': emit,
        'mount': mount
    }
const LIFECYCLE_HOOKS = ['onRender', 'onAttach', 'onDestroy']
const LIFECYCLE_EVENTS_RENDER = LIFECYCLE_HOOKS[0]
const LIFECYCLE_EVENTS_ATTACH = LIFECYCLE_HOOKS[1]
const LIFECYCLE_EVENTS_DESTROY = LIFECYCLE_HOOKS[2]
const isString = isType('string')
const isUndefined = isType('undefined')
const isBool = isType('boolean')
const isFunction = isType('function')

// Base
/**
 * Base Class/Prototype to extend for class usage
 *  example: 
 *  ```javascript
 *  import { Component, register } from "ele-mint"
 *  const section = register("section")
 * 
 *  class Container extents Component {
 *  
 *      content() {
 *          return section({class: "c-section"}
 *              this.props.children
 *          )
 *      }
 *  }
 *  export Container
 *  ```
 *
 * @param {*} props
 */
export const Component = function(props) { this.props = props }

// pipe renderer functions to prototype.
keys(prototypeFuncs).forEach((key) => Component.prototype[key] = prototypeFuncs[key])

function addEventListener(evName, handler) {
    this.elem.addEventListener(evName, (ev) => { handler.apply(this, [ev, this.elem, this])})
}

function setProp(name, value) {
    this.elem[name] = value
}

function mount(parentElement) {
    let c = this.render(parentElement) 
    this.handle = this.handle || this.props.id || this.props._id || Symbol(c.tagName || "v")
    if (c.elem) {
        c.elem.remove = c.remove
    }
    handles[this.handle] = c
    return c
}

/**
 * Renders the element and children to the DOM
 * Using a prototype function instead for performance
 * 
 * @param {HTMLElement} parentElement
 * @returns {any}
 */
function render(parentElement) {
    let elem = this.attach(parentElement)
    this.elem = elem
    this.element = elem
    commitLifecycleEvent(this, LIFECYCLE_EVENTS_ATTACH)
    this.renderedChildren = this.renderChildren(elem)
    const isEventHandling = (name) => hasPrefix(name, 'e_') || hasPrefix(name, 'set_')
    const addProps = (attr) => {
        let value = this.props[attr]
        // lifecycle hooks are handled elsewhere.
        if (LIFECYCLE_HOOKS.indexOf(attr) > -1 || !attr) { return }
        // is native event property: 
        if (hasPrefix(attr, 'on')) {
            return this.addEventListener(attr.slice(2), value)
        }
        // is emit handler (custom event handler)
        if (isEventHandling(attr)) {
            return this.addEmitHandler(attr, value)
        }
        this.setAttribute(attr, value)
    }
    Object.getOwnPropertyNames(this.props.__proto__).forEach(name => {
        if(isEventHandling(name)) {
            this.addEmitHandler(name, this.props[name])
        }
    })
    // TODO: I am pretty sure that I want to back this out and rethink the way that we are eventing data around.
    keys(keys(this.props).reduce((props, next) => {
        props[MAPPED_ATTRIBUTES[next] || next] = props[next]
        return props
    }, assign({}, DIRECT_SET_ATTRIBUTES))).forEach(addProps)

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
    let name = MAPPED_ATTRIBUTES[attributeName] || attributeName
    if (!this.elem) {
        this.props[attributeName] = value
        return
    }
    if (attributeName === "children") {
        return
    }
    define(this, name, value)
}


function renderChildren(parentElement) {
    if (isFunction(this.content)) {
        this.props.children = [this.content()]
    }
    return this.props.children.map((child) => {
        if (!child.render) { 
            error("child must have render function") 
        }
        child.parent = this
        return child.mount(parentElement)
    })
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
    let element = this.tagName ? this.elem : this.parentElement
    if (!element) {
        element = document.createElement(this.tagName)
        parentElement.appendChild(element)
    }
    return element
}

function remove() {
    // for cleanup of handles to eliminate memory leak
    this.renderedChildren.forEach(c => c.remove())
    handles[this.handle] = null
    let ep = this.parentElement;
    if (ep && ep !== this.elem) {
        ep.removeChild(this.elem)
    }
    this.parent = null
    this.parentElement = null
    commitLifecycleEvent(this, LIFECYCLE_EVENTS_DESTROY)
}

function emit(name) {
    if (!this.parent) { return }
    let eName = `e_${name}`
    let params = Array.from(arguments)
    if (this.parent[eName]) {
        this.parent[eName].apply(this.parent, params.slice(1))
    }
    if (this.parent.emit) { 
        this.parent.emit.apply(this.parent, params)
    }
}

function addEmitHandler(name, handler) {
    this[name] = handler
}

function commitLifecycleEvent(context, eventName) {
    let event =  context[eventName] || context.props[eventName]
    if (event) {
        event.call(context)
    }
}

/**
 * Define property, used to set values and attributes
 * 
 * @param {any} obj 
 * @param {string} key
 * @param {any} value -- initial value
 */
function define(obj, key, value) {
    let mKey = MAPPED_ATTRIBUTES[key] || key,
        isVirtual = hasPrefix(key, 'v_'),
        isPrivate = hasPrefix(key, '_'),
        elem = obj.elem
    if (isPrivate) {
        obj[mKey] = value
        return value
    }
    var settings = {
      set: (val, override) => {
        if (value === val && !override) { return }

        if (isVirtual) {
            // TODO: Make sure we only propogate to children within the component wall
            // Think through the idea of a follow prop from the parent component that will update consistently, but only when the parent changes.
            let getChildren = (p) => (p.renderedChildren || []).reduce((arr, next) => {
                return arr.concat([next], getChildren(next))
            },[])
            getChildren(obj).forEach((child) => {
                if (!child.hasOwnProperty(key)) { return }

                child[key] = val
                let setFuncName = key.replace('v_', 'set_')
                if (child[setFuncName]) {
                    child[setFuncName].apply(child, [val])
                }
            })
        } else if (DIRECT_SET_ATTRIBUTES[key] || isBool(val)) {
            obj.setProp(key, val)
        } else {
            elem.setAttribute(key, val)
        }
        value = val
      },
      get: () => (key === 'style' && obj.element) ? obj.element.style || value : value
    }
    Object.defineProperty(obj, mKey, settings)
    if (!isUndefined(value)) {
        settings.set(value, 1)
    }
    return obj[mKey]
}

/**
 * Returns a function closure for building different html elements.
 * 
 * @param {string|Function} tagNameOrComponent 
 * @param {any} [overrides] 
 * @returns 
 */
export function register(tagNameOrComponent, overrides) {
    if (!tagNameOrComponent) {
        error('tagName or Component must be defined')
    }

    /**
     * Create an element definition for tagNameOrComponent and input attributes
     * @param {any} attributes 
     * @param {...FunDom} [children] 
     * @returns {FunDom}
     */
    return function construct(attributes) {

        attributes = attributes || {}
        let children = Array.from(arguments).slice(1)
        if (attributes.render || Array.isArray(attributes) && attributes[0].render) {
            children.unshift(attributes)
            attributes = {}
        } else if (isString(attributes)) {
            attributes = {textContent: attributes}
        } else if (isString(children[0])) {
            attributes.textContent = children[0]
            children = children.slice(1)
        }
        const props =  assign(attributes || {}, {children: [].concat.apply([], children)})
        // If tagNameOrComponent is a function, it is 
        if (isFunction(tagNameOrComponent)) {
            if (tagNameOrComponent.constructor) {
                return new tagNameOrComponent(props)
            }
            tagNameOrComponent.prototype = assign(Component.prototype, tagNameOrComponent.prototype, overrides)
            return tagNameOrComponent(props)
        }
        return assign({
            tagName: tagNameOrComponent,
            props: props
        }, Component.prototype, overrides)
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
        return register(tagName, Object.assign({}, overrides, secondaryOverride))
    }
}

export const e = register

export const getHandle = id => handles[id]

/** Util Functions */

function keys(obj) {
    return Object.keys(obj)
}

function assign() {
    return Object.assign.apply(null, Array.from(arguments))
}

function hasPrefix(name, prefix) {
    return name.slice(0, prefix.length) === prefix
}

function error(message) {
    throw new Error(message)
}

function isType(type) {
    return function(val) {
        return typeof val === type
    }
}
