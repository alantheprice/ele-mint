import { override, getHandle} from '../eleMint.js'
const mockRegister = override({attach: attach})
const ELEMENTS = 'a|abbr|address|area|article|aside|audio|b|base|bdi|bdo|blockquote|body|br|button|canvas|caption|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|div|dl|dt|em|embed|fieldset|figcaption|figure|footer|form|h1|h2|h3|h4|h5|h6|head|header|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|meta|meter|nav|noscript|object|ol|optgroup|option|output|p|param|picture|pre|progress|q|rp|rt|rtc|ruby|s|samp|script|section|select|slot|small|source|span|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|u|ul|var|video|wbr'.split('|').reduce((agg, next) => {agg[next] = mockRegister(next); return agg;}, {})

export const elements = ELEMENTS
export const e = mockRegister
export const register = mockRegister
export const createMockElement = mockElement 

function attach(parentElement) {
    this._pe = parentElement
    let element = this.elem
    if (!element) {
        element = mockElement(this.tagName)
        parentElement.appendChild(element)
    }
    return element
}

function mockElement(tagName) {
    return {
        tagName: tagName,
        children: [],
        attributes: {},
        setAttribute: function(name, value) {
            this.attributes[name] = value
        },
        appendChild: function (element) {
            this.children.push(element)
        }
    }
}