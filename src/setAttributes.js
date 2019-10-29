import { element, children, isVirtual, data, subscribedEvents, addEventListenerFunc } from "./nameMapping";
import { isBool, hasPrefix, keys } from "./utils";

const MAPPED_ATTRIBUTES = { class: 'className' }
const DIRECT_SET_ATTRIBUTES = 'textContent|innerText|innerHTML|className|value|style|checked|selected|src|srcdoc|srcset|tabindex|target'.split('|')
        .reduce((agg, next)=> { agg[next] = 1; return agg }, {})

/**
 * Set an attribute on the element
 * 
 * @param {HTMLElement} elem
 * @param {string} attributeName 
 * @param {any} value 
 */
 function setAttribute(elem, attributeName, value) {
    if (attributeName === children) { return }
    let mKey = MAPPED_ATTRIBUTES[attributeName] || attributeName
    if (DIRECT_SET_ATTRIBUTES[mKey] || isBool(value)) {
        elem[mKey] = value
    } else {
        elem.setAttribute(mKey, value)
    }
}


export default function setAttributes() {
    // only add attributes for elements
    if (this[isVirtual]) { return }
    (this[subscribedEvents] || []).forEach(rm => rm())
    keys(this[data]).forEach((attr) => {
        let value = this[data][attr]
        // is native event property: 
        if (hasPrefix(attr, "on")) {
            this[subscribedEvents] = this[subscribedEvents] || []
            this[subscribedEvents].push(this[addEventListenerFunc](attr.slice(2), value))
            return
        }
        setAttribute(this[element], attr, value)
    })
}