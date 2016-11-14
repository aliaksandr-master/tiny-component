'use strict';

import EventEmitter from './EventEmitter';
import { getFirstArgFromString, replaceFirstTagAttrs, hasFirstTag, insertClassIntoAttrStr } from './utils';



let idCounter = Math.floor(Math.random() * 1000);



export const renderToDom = (component, element, init = () => {}) => {
  element.insertAdjacentHTML('beforeEnd', component.toString());

  setTimeout(() => {
    component.init();

    init();
  }, 15); // hack
};


const wrapEE = (globalEE) => {
  const ee = {};
  const _listeners = [];

  ee.$emit = (...args) => {
    if (!globalEE) {
      return;
    }

    globalEE.$emit(...args);
  };

  ee.$on = (...args) => {
    if (!globalEE) {
      return () => {};
    }

    const off = globalEE.$on(...args);

    _listeners.push(off);

    return off;
  };

  ee.$wrap = () =>
    globalEE.$wrap();

  const off = () => {
    if (!globalEE) {
      return;
    }

    globalEE = null;

    while (_listeners.length) {
      const off = _listeners.pop();

      off();
    }
  };

  return [ ee, off ];
};


export default (template, onInit) =>
  (componentName = null, data = {}, parentEE = EventEmitter()) => {
    data = Object.assign({}, data);



    const [ eventBus, destroyEventBus ] = wrapEE(parentEE);
    const components = [];
    let onDestroy = () => {};




    // nested component
    const $cmp = (componentName, componentBuilder, nestedData = {}, nestedEventBus = eventBus) => {
      const cmp = componentBuilder(componentName, nestedData, nestedEventBus);

      components.push(cmp);

      return cmp;
    };





    // component
    let id = null;

    const toString = () => {
      const html = template(data, $cmp).trim();

      if (!hasFirstTag(html)) {
        throw TypeError('invalid html format. It must have first tag');
      }

      return replaceFirstTagAttrs(html, (attrsStr) => {
        if (componentName) {
          attrsStr = insertClassIntoAttrStr(attrsStr, componentName);
        }

        id = getFirstArgFromString(attrsStr);

        if (!id) {
          id = `cmp-${++idCounter}`;
          attrsStr = ` id="${id}" ${attrsStr}`;
        }

        return attrsStr;
      });
    };





    let destroyed = 0;

    const destroy = () => {
      if (destroyed++) {
        return;
      }

      while (components.length) {
        components.pop().destroy();
      }

      const element = document.getElementById(id);

      if (element) {
        element.parentNode.removeChild(element);
      }

      onDestroy();

      destroyEventBus();
    };





    let initialized = 0;

    const init = () => {
      if (initialized++) {
        return;
      }

      if (onInit) {
        const _onDestroy = onInit(document.getElementById(id), data, { $on: eventBus.$on, $emit: eventBus.$emit, id, destroy });

        if (typeof _onDestroy === 'function') {
          onDestroy = _onDestroy;
        }
      }

      components.forEach((cmp) => {
        cmp.init();
      });
    };




    return { toString, init, destroy };
  };
