import { hasPrefix, keys } from "./utils"

/**
 * Renders the element and children to the DOM
 * Using a prototype function for performance
 * 
 * @param {HTMLElement} parentElement
 * @returns {any}
 */
export function render(parentElement, parentComponent) {
    let elem = this._aF(parentElement)
    this._pc = parentComponent
    this.element = this._v ? null : elem
    this._lF('onAttach')
    this._rc = this._rcF(elem, this._v ? this : parentComponent)
    const addProps = (attr, index, arr) => {
        let value = this.props[attr]
        // is native event property: 
        if (hasPrefix(attr, 'on')) {
            this._e = this._e || []
            this._e.push(this._aelF(attr.slice(2), value))
            return
        }
        this._saF(attr, value)
    }
    if (!this._v) {
        // only add props for elements
        keys(this.props).forEach(addProps)
    }
    this._lF('onRender')
    return this
}