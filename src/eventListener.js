
export function addEventListener(evName, handler) {
    if (this._v) {
        return
    }
    let handle = (ev) => { handler.apply(this, [ev, elem, this])}
    let elem = this.element
    elem.addEventListener(evName, handle)
    return () => elem.removeEventListener(evName, handle)
}