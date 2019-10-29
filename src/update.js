import { isFunction, delay, keys, isUndefined } from "./utils"
import { updateReducer, element, data, externalData, internalData, parentComponent, renderChildrenFunc, renderedChildren, parentElement, commitUpdateFunc } from "./nameMapping"

export default function update(obj) {
    let reducedObj = obj
    let didUpdate = false
    let didUpdateParent = false
    let parentObj = {}
    // This allows the user to do their own management of updates.
    if (isFunction (this[updateReducer])) {
        reducedObj = this[updateReducer](this[data], obj)
    }
    this[data] = keys(reducedObj).reduce((agg, key) => {
        if (agg[key] !== reducedObj[key]) {
            if (!isUndefined(this[externalData][key])) {
                didUpdateParent = true
                parentObj[key] = reducedObj[key]
            } else {
                didUpdate = true
                this[internalData][key] = reducedObj[key]
                agg[key] = reducedObj[key]
            }
        }
        return agg
    }, this[data])
    if (didUpdateParent && this[parentComponent]) {
        this[parentComponent].update(parentObj)
    }
    if (didUpdate  && !didUpdateParent) {
        // delay here to allow this to be asynchrous
        delay(() => {
            this[commitUpdateFunc]()
        })
    }
}