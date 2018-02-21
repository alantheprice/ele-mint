const //ELEMENTS = 'a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|rtc|ruby|s|samp|script|section|select|slot|small|source|span|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr'.split('|'),
    DIRECT_SET_ATTRIBUTES = ['textContent', 'innerText', 'innerHTML', 'className', 'value', 'style'],
    MAPPED_ATTRIBUTES = { class: 'className' }

const handles = {}

const renderer = function() {}

/**
 * Renders the element and children to the DOM
 * 
 * @param {HTMLElement} parentElement
 * @returns {HTMLElement}
 */
renderer.prototype.processRender = function defaultRender(parentElement, comp) {
    let elem = comp.elem 
    if (!elem) {
        elem = document.createElement(comp.tagName)
        parentElement.appendChild(elem)
    }
    Object.keys(comp.attr).forEach((attr) => {
        let name = MAPPED_ATTRIBUTES[attr] || attr
        if (attr.indexOf('on') === 0) {
            elem.addEventListener(name.replace('on', ''), (ev) => comp.attr[attr](ev, elem))
        } else if ((DIRECT_SET_ATTRIBUTES.indexOf(attr) > -1) || (typeof comp.attr[attr] === 'boolean')){
            elem[name] = comp.attr[attr]
            // ignoring virtual properties
        } else if (attr.indexOf(':') !== 0) {
            elem.setAttribute(attr, comp.attr[attr])
        }
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
 * @param {function(HTMLElement, { tagName: string, children: { render: function() }[], attr: {[x: string]: any} }) } [renderOverride]
 * @returns 
 */
export function register(tagName, renderOverride) {
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
                this.elem = this.processRender(ep, comp) 
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
        }, (renderOverride) ? {processRender: renderOverride} : renderer.prototype )
        return comp
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
