const //ELEMENTS = 'a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|rtc|ruby|s|samp|script|section|select|slot|small|source|span|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr'.split('|'),
    MAPPED_ATTRIBUTES = { class: 'className' },
    DIRECT_SET_ATTRIBUTES = 'textContent|innerText|innerHTML|className|value|style'.split('|')
        .reduce((agg, next)=> { agg[next] = 1; return agg }, {})

const handles = {}

const renderPipeline = function() {}

/**
 * Attaches the element to the Dom.
 * Could easily be overridden to allow full unit testing
 * 
 * @param {HTMLElement} parentElement 
 * @param {any} comp 
 * @returns 
 */
renderPipeline.prototype.attach = function(parentElement) {
    let element = this.elem 
    if (!element) {
        element = document.createElement(this.tagName)
        parentElement.appendChild(element)
    }
    return element
}

renderPipeline.prototype.addEventListener = function(elem, evName, handler) {
    elem.addEventListener(evName, (ev) => handler(ev, elem))
}

renderPipeline.prototype.setProp = function (elem, name, value) {
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
renderPipeline.prototype.setAttribute = function (elem, attr, value) {
    let name = MAPPED_ATTRIBUTES[attr] || attr
    // is virtual property: 
    if (attr.slice(0,2) === 'on') {
        this.addEventListener(elem, name.slice(2), value)
    } else if (DIRECT_SET_ATTRIBUTES[name] || (typeof value === 'boolean')){
        this.setProp(elem, name, value)
        // ignoring virtual properties
    } else if (attr.slice(0, 1) === ':') {
        this.setVirtual(elem, name, value)
    } else {
        elem.setAttribute(name, value)
    }
}

renderPipeline.prototype.setVirtual = function (elem, name, value) {
    // can be overridden to allow usage
}

renderPipeline.prototype.renderChildren = function (parentElement, children) {
    return children.map((child) => {
        if (!child.render) { 
            error("child must have render function") 
        }
        return child.render(parentElement)
    })
}


/**
 * Renders the element and children to the DOM
 * Using a prototype function instead for performance
 * 
 * @param {HTMLElement} parentElement
 * @returns {HTMLElement}
 */
renderPipeline.prototype.processRender = function defaultRender(parentElement) {//, componentDefinition) {
    let elem = this.attach(parentElement, this)
    this.elem = elem
    Object.keys(this.attr).forEach((attr) => {
        this.setAttribute(elem, attr, this.attr[attr])
    })
    this.renderedChilren = this.renderChildren(elem, this.children)
    return elem
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
                let c = this
                let handle = c.attr.id || c.attr[':id'] || Symbol(c.tagName)
                c.elem = c.processRender(ep) 
                c.remove = () => {
                    // for cleanup of handles to eliminate memory leak
                    c.renderedChilren.forEach(c => c.remove())
                    handles[handle] = null
                    if (ep && ep !== c.elem) {
                        ep.removeChild(c.elem)
                    }
                }
                c.elem.remove = c.remove
                handles[handle] = c
                return c.elem
            }
        }, renderPipeline.prototype, overrides)
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

function isString(val){
    return typeof val === 'string'
}
