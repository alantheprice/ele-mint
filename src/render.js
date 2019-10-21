import { hasPrefix, keys } from "./utils"
import { setAttributeFunc, addEventListenerFunc, renderChildrenFunc, attachFunc, commitLifecycleEventFunc, subscribedEvents } from "./nameMapping"

/**
 * Renders the element and children to the DOM
 * Using a prototype function for performance
 * 
 * @param {HTMLElement} parentElement
 * @returns {any}
 */
export function render(parentElement, parentComponent) {
    let elem = this[attachFunc](parentElement)
    this._pc = parentComponent
    this.element = this._v ? null : elem
    this._lF('onAttach')
    this._rc = this[renderChildrenFunc](elem, this._v ? this : parentComponent)
    const addProps = (attr, index, arr) => {
        let value = this.props[attr]
        // is native event property: 
        if (hasPrefix(attr, 'on')) {
            this[subscribedEvents] = this[subscribedEvents] || []
            this[subscribedEvents].push(this[addEventListenerFunc](attr.slice(2), value))
            return
        }
        this[setAttributeFunc](attr, value)
    }
    if (!this._v) {
        // only add props for elements
        keys(this.props).forEach(addProps)
    }
    this[commitLifecycleEventFunc]('onRender')
    return this
}