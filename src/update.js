import { isFunction, delay, keys, isUndefined } from "./utils";
import {
  updateReducer,
  data,
  externalData,
  internalData,
  parentComponent,
  commitUpdateFunc,
  isVirtual,
} from "./nameMapping";

const getParent = (context) => context[parentComponent];

function getVParent(context) {
  const parent = getParent(context);
  if (!parent) {
    return null;
  }
  if (parent[isVirtual]) {
    return parent;
  }
  return getVParent(parent);
}

export default function update(obj) {
  let reducedObj = obj;
  let didUpdate = false;
  let didUpdateParent = false;
  let parentObj = {};
  // This allows the user to do their own management of updates.
  if (isFunction(this[updateReducer])) {
    reducedObj = this[updateReducer](this[data], obj);
  }
  this[data] = keys(reducedObj).reduce((agg, key) => {
    if (agg[key] !== reducedObj[key]) {
      if (!isUndefined(this[externalData][key])) {
        didUpdateParent = true;
        parentObj[key] = reducedObj[key];
      } else {
        didUpdate = true;
        this[internalData][key] = reducedObj[key];
        agg[key] = reducedObj[key];
      }
    }
    return agg;
  }, this[data]);
  // Find nearest virtual (true non-element component)
  if (didUpdateParent) {
    const vParent = getVParent(this);
    if (vParent) {
      vParent.update(parentObj);
    }
  }
  if (didUpdate && !didUpdateParent) {
    // delay here to allow this to be asynchrous
    // delay(() => {
    this[commitUpdateFunc](this);
    // });
  }
}
