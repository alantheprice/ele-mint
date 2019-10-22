import { element, isVirtual } from "./nameMapping"

export default function addEventListener(evName, handler) {
    if (this[isVirtual]) {
        return
    }
    let handle = (ev) => { handler.apply(this, [ev, elem, this])}
    let elem = this[element]
    elem.addEventListener(evName, handle)
    return () => elem.removeEventListener(evName, handle)
}