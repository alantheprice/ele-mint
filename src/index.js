import compare from "./compare";
import {
  error,
  keys,
  assign,
  isString,
  isArray,
  isUndefined,
  isObject,
} from "./utils";
import attach from "./attach";
import update from "./update";
import addEventListener from "./addEventListener";
import render from "./render";
import {
  attachFunc,
  addEventListenerFunc,
  setAttributeFunc,
  renderChildrenFunc,
  renderFunc,
  removeFunc,
  compareComponentFunc,
  commitLifecycleEventFunc,
  externalData,
  internalData,
  isVirtual,
  data,
  tagName,
  handle,
  element,
  registeredType,
  component,
  overrides,
  children,
  dataDidChangeFunc,
  setDataFunc,
  updateFunc,
  mountFunc,
  commitUpdateFunc,
  renderedChildren,
  parentElement,
  namespace,
} from "./nameMapping";
import setAttribute from "./setAttributes";
import setupRemove from "./remove";
import renderChildren from "./renderChildren";
const handles = {};
const remove = setupRemove(handles);
const config = { debug: false };
const logCall = function (func, name) {
  return function (...args) {
    if (config.debug) {
      console.log(`${name} called with context: `, this, "args", args);
    }
    return func.apply(this, args);
  };
};

const prototypeFuncs = {
  [attachFunc]: logCall(attach, "attach"),
  [addEventListenerFunc]: logCall(addEventListener, "addEventListener"),
  [setAttributeFunc]: logCall(setAttribute, "setAttribute"),
  [renderChildrenFunc]: logCall(renderChildren, "renderChildren"),
  [renderFunc]: logCall(render, "render"),
  [removeFunc]: logCall(remove, "remove"),
  [compareComponentFunc]: logCall(compare, "compare"),
  [commitLifecycleEventFunc]: logCall(
    commitLifecycleEvent,
    "commitLifecyleEvent"
  ),
  [dataDidChangeFunc]: logCall(dataDidChange, "dataDidChange"),
  [setDataFunc]: logCall(setData, "setData"),
  [commitUpdateFunc]: logCall(commitUpdate, "commitUpdate"),
  [updateFunc]: logCall(update, "update"),
  [mountFunc]: logCall(mount, "mount"),
};

/**
 * Base Class/Prototype to extend for class usage
 *  example:
 *  ```javascript
 *  import { Component, register } from 'ele-mint'
 *  const section = register('section')
 *
 *  class Container extends Component {
 *
 *      content(data, update) {
 *          return section({class: 'c-section'}
 *              this.data.children
 *          )
 *      }
 *  }
 *  export Container
 *  ```
 *
 * @param {*} data
 */
export const Component = function (passedInData, initialData) {
  this[setDataFunc](initialData, passedInData);
  this[isVirtual] = true;
};

const createElementComponent = (data, tagNameProp, overrides) => {
  const comp = new Component(data);
  comp[tagName] = tagNameProp;
  comp[isVirtual] = false;
  return assign(comp, overrides);
};

const createComponent = (data, initialData, overrides) => {
  const comp = new Component(data, initialData);
  return assign(comp, overrides);
};

// pipe renderer functions to prototype.
keys(prototypeFuncs).forEach(
  (key) => (Component.prototype[key] = prototypeFuncs[key])
);

function mount(parentElement, parentComponent) {
  let c = this[renderFunc](parentElement, parentComponent);
  this[handle] = this[handle] || this[data].id || Symbol(c[tagName] || "v");
  if (c[element]) {
    c[element][removeFunc] = c[removeFunc];
  }
  handles[this[handle]] = c;
  return c;
}

function commitLifecycleEvent(args) {
  let event = this[args[0]];
  if (event) {
    let out = event.apply(this, args.slice(1));
    if (!isUndefined(out)) {
      return out;
    }
  }
  return true;
}

function dataDidChange(newData) {
  this[setDataFunc](this[internalData], newData);
  const dataOverride = this[commitLifecycleEventFunc]([
    "onDataChange",
    this[data],
    newData,
  ]);
  if (isObject(dataOverride)) {
    console.log("data is dataOverride", dataOverride);
    this[data] = dataOverride;
  }
  this[setAttributeFunc]();
  this[commitUpdateFunc](this);
}

function setData(intData, extData) {
  this[externalData] = assign({}, extData);
  this[internalData] = assign({}, intData);
  this[data] = assign({}, this[internalData], this[externalData]);
}

function commitUpdate(context) {
  context[renderedChildren] = context[renderChildrenFunc](
    context[element] || context[parentElement],
    context
  );
}

/**
 * Returns a function closure for building different html elements or components
 * @param {Object} config
 * @param {string} [config.tagName]
 * @param {Function} [config.component]  -- actually config[component] so it is using the correct property name
 * @param {Object} [config.overrides]    -- actually config[overrides] so it is using the correct property name
 * @param {Object} [config.internalData] -- actually config[internalData] so it is using the correct property name
 * @returns
 */
const internalRegister = (config) => {
  if (!config[tagName] && !config[component]) {
    error("tagName or Component must be defined");
  }
  const rType = Symbol("rt");

  const construct = (...attributes) => {
    let attr = attributes[0] || {};
    let childs = attributes.slice(1);
    if (isArray(attributes[0])) {
      childs = attributes[0];
      attr = {};
    } else if (isString(attributes[0])) {
      attr = { textContent: attributes[0] };
    } else if ((attributes[0] || {})[renderFunc]) {
      childs.unshift(attributes[0]);
      attr = {};
    }
    if (isString(childs[0])) {
      attr.textContent = childs[0];
      childs = childs.slice(1);
    }
    if (isArray(childs[0])) {
      childs = childs[0];
    }
    const data = assign({}, attr, { [children]: childs });
    if (isString(config[tagName])) {
      return createElementComponent(data, config[tagName], config[overrides]);
    }
    if (config[component].prototype instanceof Component) {
      return new config[component](data, config[internalData]);
    }
    return createComponent(
      data,
      config[internalData],
      assign({}, config[overrides], { content: config[component] })
    );
  };

  /**
   * Create an element definition for tagName or Component and input attributes
   * @param {any} attributes
   * @param {...FunDom} [children]
   * @returns {FunDom}
   */
  return function build(...attributes) {
    let comp = construct(...attributes);
    comp[registeredType] = rType;
    return comp;
  };
};

export const register = (tag, overrideFunctions) => {
  return internalRegister({
    [tagName]: tag,
    [overrides]: overrideFunctions,
  });
};

export const registerSVG = (tag) => {
  return internalRegister({
    [tagName]: tag,
    [overrides]: { [namespace]: "http://www.w3.org/2000/svg" },
  });
};

export const registerComponent = (comp, intData, overrideFunctions) => {
  return internalRegister({
    [component]: comp,
    [internalData]: intData,
    [overrides]: overrideFunctions,
  });
};

// window.eleMint = { handles, config };
