import {
  renderedChildren,
  data,
  compareComponentFunc,
  removeFunc,
  renderFunc,
  isVirtual,
  dataDidChangeFunc,
  externalData,
  commitLifecycleEventFunc,
  contentFunc,
  children,
  updateFunc,
} from "./nameMapping";
import { error, isFunction, assign } from "./utils";

export default function renderChildren(parentElement, parentComponent) {
  if (isFunction(this[contentFunc])) {
    // set the external incoming children for data property, otherwise infinite loop.
    const contentData = assign({}, this[data], {
      children: (this[externalData] || {}).children,
    });
    this[data][children] = [
      this[contentFunc](contentData, (obj) => this[updateFunc](obj)),
    ];
  }
  let previouslyRendered = this[renderedChildren];
  let getExisting = (index) =>
    previouslyRendered ? previouslyRendered[index] : null;
  // The additional thing we need to consider if allowing a child to keep their state values
  // rather than just overriding them..., but maybe that doesn't make sense.
  let childs = this[data][children]
    .filter((child) => child != null)
    .map((child, index) => {
      if (!child[renderFunc]) {
        error("child must have render function");
      }
      // TODO: eventually we should make this more intelligent than just looking at the index
      let current = getExisting(index);
      if (!current) {
        // element doesn't exist, creating
        return child.mount(parentElement, parentComponent);
      }
      let { reusable, identical } = current[compareComponentFunc](child);
      // Virtual elements need to be re-rendered to ensure all child data is updated correctly
      if (identical && current[isVirtual]) {
        previouslyRendered[index] = undefined;
        return current;
      } else if (reusable) {
        // Reused,is also identical
        previouslyRendered[index] = undefined;
        if (
          current[commitLifecycleEventFunc]([
            "onDataUpdated",
            current[externalData],
            child[externalData],
          ])
        ) {
          current[dataDidChangeFunc](child[externalData]);
        }
        return current;
      } else {
        // element doesn't match and isn't reusable, recreating.
        return child.mount(parentElement, parentComponent);
      }
    });
  if (previouslyRendered) {
    // removing items that are we are replacing
    previouslyRendered.forEach((child) => {
      if (child && child[removeFunc]) {
        child[removeFunc]();
      }
    });
  }
  return childs;
}
