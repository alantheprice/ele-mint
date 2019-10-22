import { element, children } from "./nameMapping";
import { isBool } from "./utils";

const MAPPED_ATTRIBUTES = { class: 'className' }
const DIRECT_SET_ATTRIBUTES = 'textContent|innerText|innerHTML|className|value|style|checked|selected|src|srcdoc|srcset|tabindex|target'.split('|')
        .reduce((agg, next)=> { agg[next] = 1; return agg }, {})

/**
 * Set an attribute on the element
 * 
 * @param {string} attributeName 
 * @param {any} value 
 */
export default function setAttribute(attributeName, value) {
    if (attributeName === children) { return }
    let mKey = MAPPED_ATTRIBUTES[attributeName] || attributeName,
        elem = this[element]
    if (DIRECT_SET_ATTRIBUTES[mKey] || isBool(value)) {
        elem[mKey] = value
    } else {
        elem.setAttribute(mKey, value)
    }
}