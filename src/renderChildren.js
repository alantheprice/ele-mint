import { renderedChildren, data, compareComponentFunc, element, removeFunc, renderFunc, isVirtual, dataDidChangeFunc, externalData, commitLifecycleEventFunc, contentFunc, children, updateFunc } from "./nameMapping"
import { error, isFunction } from "./utils"


export default function renderChildren(parentElement, parentComponent) {
    runContentFunc(this)
    let previouslyRendered = this[renderedChildren]
    let getExisting = (index) =>  previouslyRendered ? previouslyRendered[index] : null
    // The additional thing we need to consider if allowing a child to keep their state values 
    // rather than just overriding them..., but maybe that doesn't make sense.
    let children = this[data].children
        .filter(child => child != null)
        .map((child, index) => {
            // TODO: eventually we should make this more intelligent than just looking at the index
            let current = getExisting(index)
            if (current) {
                let { reusable, identical } = current[compareComponentFunc](child)
                if (identical) {
                    previouslyRendered[index] = undefined
                    return current
                } else if (reusable) {
                    previouslyRendered[index] = undefined
                    if (current[commitLifecycleEventFunc]("onDataUpdated", current[externalData], child[externalData])) {
                        current[dataDidChangeFunc](child[externalData])
                    }
                    return current
                }
            }
            if (!child[renderFunc]) {
                error('child must have render function') 
            }
            return child.mount(parentElement, parentComponent)
        })
    if (previouslyRendered) {
        previouslyRendered.forEach((child) => {
            if (child && child[removeFunc]) {
                child[removeFunc]()
            }
        })
    }
    return children
}

function runContentFunc(comp) {
    if (isFunction(comp[contentFunc])) {
        comp[data][children] = [
            comp[contentFunc](
                comp[data], 
                (obj) => comp[updateFunc](obj)
            )]
    }
    return comp
}
