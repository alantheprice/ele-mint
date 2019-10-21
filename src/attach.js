
/**
 * Attaches the element to the Dom.
 * Could easily be overridden to allow full unit testing 
 * 
 * @param {HTMLElement} parentElement 
 * @returns 
 */
export function attach(parentElement) {
    this._pe = parentElement
    // if a virtual element, tagName is not defined, thus, element should pass through
    let element = this.tagName ? this.element : this._pe
    if (!element) {
        element = document.createElement(this.tagName)
        parentElement.appendChild(element)
    }
    return element
}