import { hasPrefix, keys } from "./utils"
import { setAttributeFunc, addEventListenerFunc, renderChildrenFunc, attachFunc, commitLifecycleEventFunc, subscribedEvents, renderedChildren, parentComponent, isVirtual, data, element, updateFunc } from "./nameMapping"

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
    this[commitLifecycleEventFunc](
        "onAttach", 
        this[element], 
        this[data], 
        obj => this[updateFunc](obj), 
        this
    )
    this[renderedChildren] = this[renderChildrenFunc](
        elem, 
        this[isVirtual] ? this : parentComp
    )
    this[setAttributeFunc]()
    this[commitLifecycleEventFunc](
        'onRender', 
        this[element], 
        this[data], 
        obj => this[updateFunc](obj), 
        this
    )
    return this
}