const //ELEMENTS = 'a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|rtc|ruby|s|samp|script|section|select|slot|small|source|span|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr'.split('|'),
    DIRECT_SET_ATTRIBUTES = ['textContent', 'innerText', 'innerHTML', 'className', 'value', 'style'],
    MAPPED_ATTRIBUTES = { class: 'className' }

const handles = {}

const renderPipeline = function() {}

renderPipeline.prototype.attach = function(parentElement, comp) {
    let el = comp.elem 
    if (!el) {
        el = document.createElement(comp.tagName)
        parentElement.appendChild(el)
    }
    return el
}

renderPipeline.prototype.addEventListener = function(elem, evName, handler) {
    elem.addEventListener(evName, (ev) => handler(ev, elem))
}

renderPipeline.prototype.setProp = function (elem, name, value) {
    elem[name] = value
}

renderPipeline.prototype.setAttribute = function (elem, name, value) {
    elem.setAttribute(name, value)
}

renderPipeline.prototype.setVirtual = function (elem, name, value) {
}


/**
 * Renders the element and children to the DOM
 * Using a prototype function instead for performance
 * 
 * @param {HTMLElement} parentElement
 * @returns {HTMLElement}
 */
renderPipeline.prototype.processRender = function defaultRender(parentElement, comp) {
    let elem = this.attach(parentElement, comp)
    Object.keys(comp.attr).forEach((attr) => {
        let name = MAPPED_ATTRIBUTES[attr] || attr
        // is virtual property: 
        let func = 'setVirtual' 
        if (attr.slice(0,2) === 'on') {
            name = name.slice(2)
            func = 'addEventListener'
        } else if ((DIRECT_SET_ATTRIBUTES.indexOf(attr) > -1) || (typeof comp.attr[attr] === 'boolean')){
            func = 'setProp'
            // ignoring virtual properties
        } else if (attr.slice(0, 1) !== ':') {
            func = 'setAttribute'
        }
        this[func](elem, name, comp.attr[attr])
    })
    comp.renderedChilren = comp.children.map((child) => {
        if (!child.render) { 
            error("child must have render function") 
        }
        return child.render(elem)
    })
    comp.elem = elem
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
        const comp = Object.assign({
            tagName: tagName,
            // flatten if children were passed in as arrays.
            children: [].concat.apply([], children),
            attr: attributes || {},
            render: function(ep) {
                let handle = comp.attr.id || comp.attr[':id'] || Symbol(this.tagName)
                this.elem = this.processRender(ep, comp, overrides) 
                this.remove = () => {
                    // for cleanup of handles to eliminate memory leak
                    comp.renderedChilren.forEach(c => c.remove())
                    handles[handle] = null
                    if (ep && ep !== this.elem) {
                        ep.removeChild(this.elem)
                    }
                }
                this.elem.remove = this.remove
                handles[handle] = comp
                return this.elem
            }
        }, renderPipeline.prototype, overrides)
        return comp
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
