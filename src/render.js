import { hasPrefix, keys } from "./utils"
import { setAttributeFunc, addEventListenerFunc, renderChildrenFunc, attachFunc, commitLifecycleEventFunc, subscribedEvents, renderedChildren, parentComponent, isVirtual, data, element } from "./nameMapping"

/**
 * Renders the element and children to the DOM
 * Using a prototype function for performance
 * 
 * @param {HTMLElement} parentElement
 * @returns {any}
 */
export default function render(parentElement, parentComp) {
    let elem = this[attachFunc](parentElement)
    this[parentComponent] = parentComp
    this[element] = this[isVirtual] ? null : elem
    this[commitLifecycleEventFunc]('onAttach')
    this[renderedChildren] = this[renderChildrenFunc](elem, this[isVirtual] ? this : parentComp)
    const addProps = (attr, index, arr) => {
        let value = this[data][attr]
        // is native event property: 
        if (hasPrefix(attr, 'on')) {
            this[subscribedEvents] = this[subscribedEvents] || []
            this[subscribedEvents].push(this[addEventListenerFunc](attr.slice(2), value))
            return
        }
        this[setAttributeFunc](attr, value)
    }
    if (!this[isVirtual]) {
        // only add props for elements
        keys(this[data]).forEach(addProps)
    }
    this[commitLifecycleEventFunc]('onRender')
    return this
}