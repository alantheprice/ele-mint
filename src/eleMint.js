const //ELEMENTS = 'a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|rtc|ruby|s|samp|script|section|select|slot|small|source|span|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr'.split('|'),
    MAPPED_ATTRIBUTES = { class: 'className' },
    DIRECT_SET_ATTRIBUTES = 'textContent|innerText|innerHTML|className|value|style'.split('|')
        .reduce((agg, next)=> { agg[next] = 1; return agg }, {}),
    handles = {},
    prototypeFuncs = {
        'attach': attach,
        'addEventListener': addEventListener,
        'setProp': setProp,
        'addEmitHandler': addEmitHandler,
        'setAttribute': setAttribute,
        'setVirtual': setVirtual,
        'renderChildren': renderChildren,
        'processRender': processRender,
        'remove': remove,
        'emit': emit
    },
    LIFECYCLE_HOOKS = ['onRender', 'onAttach', 'onDestroy'],
    LIFECYCLE_EVENTS = {
        RENDER: LIFECYCLE_HOOKS[0],
        ATTACH: LIFECYCLE_HOOKS[1],
        DESTROY: LIFECYCLE_HOOKS[2]
    },
    isString = isType('string'),
    isUndefined = isType('undefined'),
    isBool = isType('boolean'),
    renderPipeline = function() {}

// pipe renderer functions to prototype.
Object.keys(prototypeFuncs).forEach((key) => renderPipeline.prototype[key] = prototypeFuncs[key])

/**
 * Attaches the element to the Dom.
 * Could easily be overridden to allow full unit testing 
 * 
 * @param {HTMLElement} parentElement 
 * @returns 
 */
function attach(parentElement) {
    this.parentElement = parentElement
    let element = this.elem
    if (!element) {
        element = document.createElement(this.tagName)
        parentElement.appendChild(element)
    }
    return element
}

function addEventListener(evName, handler) {
    let _this = this
    this.elem.addEventListener(evName, function (ev) { handler.apply(_this, [ev, _this.elem])})
}

function setProp(name, value) {
    this.elem[name] = value
}

/**
 * Set an attribute on the element
 * -- Can be overridden.
 * 
 * @param {string} attributeName 
 * @param {any} value 
 */
function setAttribute(attributeName, value) {
    let name = MAPPED_ATTRIBUTES[attributeName] || attributeName
    if (!this.elem) {
        this.attr[attributeName] = value
        return
    }
    define(this, name, value)
}

function setVirtual(name, value) {
    // can be overridden to allow usage
}

function renderChildren(parentElement, children) {
    return children.map((child) => {
        if (!child.render) { 
            error("child must have render function") 
        }
        child.parent = this
        return child.render(parentElement)
    })
}


/**
 * Renders the element and children to the DOM
 * Using a prototype function instead for performance
 * 
 * @param {HTMLElement} parentElement
 * @returns {any}
 */
function processRender(parentElement) {
    let elem = this.attach(parentElement, this)
    this.elem = elem
    this.element = elem
    commitLifecycleEvent(this, LIFECYCLE_EVENTS.ATTACH)
    this.renderedChildren = this.renderChildren(elem, this.children)
    const isEventHandling = (name) => hasPrefix(name, 'e_') || hasPrefix(name, 'set_')
    const addProps = (attr) => {
        let value = this.attr[attr]
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
    Object.getOwnPropertyNames(this.attr.__proto__).forEach(name => {
        if(isEventHandling(name)) {
            this.addEmitHandler(name, this.attr[name])
        }
    })
    Object.keys(this.attr).forEach(addProps)

    commitLifecycleEvent(this, LIFECYCLE_EVENTS.RENDER)
    return this
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
    commitLifecycleEvent(this, LIFECYCLE_EVENTS.DESTROY)
}

function emit(name) {
    if (!this.parent) { return }
    let eName = `e_${name}`
    let params = Array.from(arguments)
    if (this.parent[eName]) {
        this.parent[eName].apply(this.parent, params.slice(1))
    }
    if ((this.parent || {}).emit) { 
        this.parent.emit.apply(this.parent, params)
    }
}

function addEmitHandler(name, handler) {
    this[name] = handler
}

function commitLifecycleEvent(context, eventName) {
    if (context.attr[eventName]) {
        context.attr[eventName].call(context)
    }
}

/**
 * Define property, used to set 
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
            obj.setVirtual(key, val)
            // Propogate to children
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
    settings.set(value, 1)
    return obj[mKey]
}

/**
 * Returns a function closure for building different html elements.
 * 
 * @param {string} tagName 
 * @param {any} [overrides] 
 * @returns 
 */
export function register(tagName, overrides) {
    if (!tagName) {
        error('tagName must be defined')
    }

    /**
     * Create an element definition for tagName and input attributes
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
        return Object.assign({
            tagName: tagName,
            // flatten if children were passed in as arrays.
            children: [].concat.apply([], children),
            attr: attributes || {},
            render: function(ep) {
                let c = this.processRender(ep) 
                this.handle = this.handle || c.attr.id || c.attr._id || Symbol(c.tagName)
                if (c.elem) {
                    c.elem.remove = c.remove
                }
                handles[this.handle] = c
                return c
            }
        }, renderPipeline.prototype, overrides)
    }
}

function hasPrefix(name, prefix) {
    return name.slice(0, prefix.length) === prefix
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

export function getHandle(id) {
    return handles[id]
}

function error(message) {
    throw new Error(message)
}

function isType(type) {
    return function(val) {
        return typeof val === type
    }
}
