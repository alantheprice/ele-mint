const MAPPED_ATTRIBUTES = { class: 'className' }
const DIRECT_SET_ATTRIBUTES = 'textContent|innerText|innerHTML|className|value|style|checked|selected|src|srcdoc|srcset|tabindex|target'.split('|')
        .reduce((agg, next)=> { agg[next] = 1; return agg }, {})
const handles = {}
const prototypeFuncs = {
        'attach': attach,
        'addEventListener': addEventListener,
        'setProp': setProp,
        // 'addEmitHandler': addEmitHandler,
        'setAttribute': setAttribute,
        'renderChildren': renderChildren,
        'render': render,
        'remove': remove,
        // 'emit': emit,
        // TODO: Define and manage updates
        'update': () => {},
        'follow': follow,
        'mount': mount
    }
const hasPrefix = (name, prefix) => name.slice(0, prefix.length) === prefix
const keys = obj => Object.keys(obj)
const isType = type => val => typeof val === type
const capitalCase = str => str.slice(0, 1).toUpperCase() + str.slice(1) 
// TODO: this probably isn't really sufficient, but works in a pinch
const isClass = (func) => Object.getOwnPropertyNames(func).length === 3
// const isPrototypeFunction = (func) => Object.getOwnPropertyNames(func).includes('arguments')
// const hadPrototype = (func) => Object.getOwnPropertyNames(func).includes('prototype')
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
export const Component = function(props, tagName, overrides) { 
    // TODO: We should do some magic here to find out if the prop is passed in, or if it is internal to the class....
    // Then we could figure out if we have to emit to the parent, or just handle internally.
    this.props = props
    this.tagName = tagName
    this.isVirtual = !this.tagName
    if (overrides) {
        assign(this, overrides)
    }
}

// pipe renderer functions to prototype.
keys(prototypeFuncs).forEach((key) => Component.prototype[key] = prototypeFuncs[key])

function addEventListener(evName, handler) {
    if (this.isVirtual) {
        return
    }
    this.element.addEventListener(evName, (ev) => { handler.apply(this, [ev, this.element, this])})
}

function setProp(name, value) {
    this.element[name] = value
}

function mount(parentElement, parentComponent) {
    let c = this.render(parentElement, parentComponent) 
    this.handle = this.handle || this.props.id || this.props._id || Symbol(c.tagName || "v")
    if (c.element) {
        c.element.remove = c.remove
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
function render(parentElement, parentComponent) {
    let elem = this.attach(parentElement)
    this.parentComponent = parentComponent
    this.element = this.isVirtual ? null : elem
    commitLifecycleEvent(this, LIFECYCLE_EVENTS_ATTACH)
    this.renderedChildren = this.renderChildren(elem, this.isVirtual ? this : parentComponent)
    // const isEventHandling = (name) => hasPrefix(name, 'e_') || hasPrefix(name, 'set_')
    const addProps = (attr) => {
        let value = this.props[attr]
        // lifecycle hooks are handled elsewhere.
        if (LIFECYCLE_HOOKS.indexOf(attr) > -1 || !attr) { return }
        // is native event property: 
        if (hasPrefix(attr, 'on')) {
            return this.addEventListener(attr.slice(2), value)
        }

        // With the this.update() function, we should be able to handle all emits within it with no need for another function
        // ------------
        // is emit handler (custom event handler)
        // if (isEventHandling(attr)) {
        //     return this.addEmitHandler(attr, value)
        // }
        // ----------------

        // TODO: This should probably only be happening when we are directly wrapping an element, and not when we are in a component.
        this.setAttribute(attr, value)
    }
    keys(this.props).forEach(addProps)

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
    if (!this.element) {
        this.props[attributeName] = value
        return
    }
    // if (attributeName === "children") {
    //     return
    // }
    // Rethink the whole define pattern.
    elementDefine(this, name, value)
}


function renderChildren(parentElement, parentComponent) {
    if (isFunction(this.content)) {
        this.props.children = [this.content(this.props, this.follow(this.props), this.update)]
    }
    return this.props.children.map((child) => {
        if (!child.render) { 
            error("child must have render function") 
        }
        return child.mount(parentElement, parentComponent)
    })
}

function follow(props) {
    return (key) => {
        return {
            // setter: elementDefine(this, key, props[key]),
            // innerValue: "TODO_FIGURE_OUT_WHAT_WE_WANT_THE_FOLLOW_TO_LOOK_LIKE",
        }
    }
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

function remove() {
    // for cleanup of handles to eliminate memory leak -- can make the rest of the child cleanup async somehow
    this.renderedChildren.forEach(c => c.remove())
    handles[this.handle] = null
    let ep = this.parentElement;
    if (ep && ep !== this.element) {
        ep.removeChild(this.element)
    }
    this.element = null
    this.parentComponent = null
    this.parentElement = null
    commitLifecycleEvent(this, LIFECYCLE_EVENTS_DESTROY)
}

// We Should probably just completely get rid of emitting.
// function emit(name) {
//     const eName = `on${capitalCase(name)}`
//     const params = Array.from(arguments)
//     const parentComponent = this.parentComponent || {props: {}}
//     const func = parentComponent[eName] || parentComponent.props[eName]
//     debugger
//     if (func) {
//         return func.apply(parentComponent, params.slice(1))
//     }
// }

// function addEmitHandler(name, handler) {
//     this[name] = handler
// }

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
function elementDefine(obj, key, value) {
    // TODO: We should rethink all of this with the update pattern
    let mKey = MAPPED_ATTRIBUTES[key] || key,
        elem = obj.element
    var settings = {
      set: (val, override) => {
        if (value === val && !override) { return }
        if (DIRECT_SET_ATTRIBUTES[key] || isBool(val)) {
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
        if (isString(tagNameOrComponent)) {
            return new Component(props, tagNameOrComponent)
        }
        if (isClass(tagNameOrComponent)) {
            return new tagNameOrComponent(props)
        }
        return new Component(props, null, {content: tagNameOrComponent})
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
function assign() {
    return Object.assign.apply(null, Array.from(arguments))
}

function error(message) {
    throw new Error(message)
}
