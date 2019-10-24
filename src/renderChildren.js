import { renderedChildren, data, compareComponentFunc, element, removeFunc, renderFunc, tagName } from "./nameMapping"


export default function renderChildren(parentElement, parentComponent) {
    let previouslyRendered = this[renderedChildren]
    let getExisting = (index) =>  previouslyRendered ? previouslyRendered[index] : null
    // The additional thing we need to consider if allowing a child to keep their state values 
    // rather than just overriding them..., but maybe that doesn't make sense.
    let children = this[data].children
        .filter(child => child != null)
        .map((child, index) => {
            // TODO: eventually we should make this more intelligent than just looking at the index
            let current = getExisting(index)
            if (current && current[tagName]) {
                let comparison = current[compareComponentFunc](child)
                debugger
                if (comparison.identical) {
                    previouslyRendered[index] = undefined
                    return current
                } else if (comparison.reusable) {
                    child[element] = current[element]
                    // this is set so as we go through the hierarchy everything works
                    child[renderedChildren] = current[renderedChildren]
                    // reset values so se can call remove to cleanup
                    current[renderedChildren] = []
                    current[element] = undefined
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
