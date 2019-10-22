import { parentElement, tagName, element } from "./nameMapping"

/**
 * Attaches the element to the Dom.
 * Could easily be overridden to allow full unit testing 
 * 
 * @param {HTMLElement} parentElem 
 * @returns 
 */
export default function attach(parentElem) {
    this[parentElement] = parentElem
    // if a virtual element, tagName is not defined, thus, element should pass through
    let elem = this[tagName] ? this[element] : this[parentElement]
    if (!elem) {
        elem = document.createElement(this[tagName])
        parentElem.appendChild(elem)
    }
    return elem
}