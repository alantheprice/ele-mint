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

function addEventListener(elem, evName, handler) {
    elem.addEventListener(evName, (ev) => handler.apply(this, [ev, elem]))
}
function setProp(elem, name, value) {
    elem[name] = value
}

/**
 * Set an attribute on the element
 * -- Can be overridden.
 * 
 * @param {HTMLElement} elem 
 * @param {string} attr 
 * @param {any} value 
 */
function setAttribute(elem, attr, value) {
    let name = MAPPED_ATTRIBUTES[attr] || attr
    // is native event property: 
    if (attr.slice(0,2) === 'on') {
        this.addEventListener(elem, name.slice(2), value)
        return
    }
    // is emit handler (custom event handler)
    if (attr.slice(0, 2) === 'e_') {
        return this.addEmitHandler(attr, value)
    }

    let isVirtual = (attr.slice(0, 2) === 'v_') || (attr.slice(0, 4) === 'set_')
    if (DIRECT_SET_ATTRIBUTES[name] || isBool(value)) {
        this.setProp(elem, name, value)
        // ignoring virtual properties
    } else if (isVirtual) {
        this.setVirtual(elem, name, value)
    } else {
        elem.setAttribute(name, value)
    }
    define(this, name, value, isVirtual)
}

function setVirtual(elem, name, value) {
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
    this.renderedChildren = this.renderChildren(elem, this.children)
    Object.keys(this.attr).forEach((attr) => {
        this.setAttribute(elem, attr, this.attr[attr])
    })
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
}

function emit(name) {
    if (!this.parent) { return }
    let eName = `e_${name}`
    let params = Array.from(arguments)
    if (!this.parent[eName]) {
        if (!this.parent.emit) { return }
        this.parent.emit.apply(this.parent, params)
        return
    }
    this.parent[eName].apply(this.parent, params.slice(1))
}

function addEmitHandler(name, handler) {
    this[name] = handler
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
                this.handle = c.attr.id || c.attr.v_id || Symbol(c.tagName)
                if (c.elem) {
                    c.elem.remove = c.remove
                }
                handles[this.handle] = c
                return c
            }
        }, renderPipeline.prototype, overrides)
    }
}

/**
 * Define property, used to set 
 * 
 * @param {any} obj 
 * @param {string} key
 * @param {any} value -- initial value
 * @param {boolean} isVirtual
 * @param {function(any)} [setter]
 */
function define(obj, key, value, isVirtual, setter) {
    let mKey = MAPPED_ATTRIBUTES[key] || key
    var settings = {
      set: (val, override) => {
          if (value === val && !override) { return }
          if (!isVirtual &&  DIRECT_SET_ATTRIBUTES[mKey]) {
            obj.elem[mKey] = val + ''
          } else if (!isVirtual && !isUndefined(obj.attr[key])) {
            obj.elem.setAttribute(key, val)
          }
          value = val
          // don't propogate id's since they should be unique
          if (isVirtual && key !== 'v_id') {
              // Propogate to children
              let getChildren = (p) => (p.renderedChildren || []).reduce((arr, next) => {
                return arr.concat([next], getChildren(next))
              },[])
              getChildren(obj).forEach((child) => {
                  if (obj.hasOwnProperty(key)) {
                      child[key] = val
                  }
                  // TODO: maybe just set this if the prop exists so we don't execute this unless it changes?
                  let setFuncName = key.replace('v_', 'set_')
                  if (child[setFuncName]) {
                      child[setFuncName].apply(child, [val])
                  }
              })
          }
      },
      get: () => (key === 'style' && obj.element) ? obj.element.style || value : value
    }
    if (setter) {
        settings.set = setter
    }
    Object.defineProperty(obj, mKey, settings)
    settings.set(value, true)
    return obj[mKey]
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
        return register(tagName, Object.assign(overrides,secondaryOverride))
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
