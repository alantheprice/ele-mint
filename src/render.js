import { setAttributeFunc, renderChildrenFunc, attachFunc, commitLifecycleEventFunc, renderedChildren, parentComponent, isVirtual, data, element, updateFunc } from "./nameMapping"

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
    const arr = [
        this[element],
        this[data],
        obj => this[updateFunc](obj),
        this]
    this[commitLifecycleEventFunc](["onAttach"].concat(arr))
    this[renderedChildren] = this[renderChildrenFunc](
        elem,
        this[isVirtual] ? this : parentComp
    )
    this[setAttributeFunc]()
    this[commitLifecycleEventFunc](["onRender"].concat(arr))
    return this
}