import { commitLifecycleEventFunc, renderedChildren, removeFunc, handle, parentElement, subscribedEvents, element, parentComponent } from "./nameMapping";

export default function remove() {
    this[commitLifecycleEventFunc](['onWillRemove'])
    // for cleanup of handles to eliminate memory leak -- can make the rest of the child cleanup async somehow
    this[renderedChildren].forEach(c => c[removeFunc]())
    handles[this[handle]] = null
    let ep = this[parentElement];
    if (this[subscribedEvents]) {
        this[subscribedEvents].forEach(rm => rm())
    }
    if (this[element] && ep && ep !== this[element]) {
        ep.removeChild(this[element])
    }
    this[element] = null
    this[parentComponent] = null
    this[parentElement] = null
}