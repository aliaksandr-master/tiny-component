'use strict';

import EventEmitter, { wrap } from './EventEmitter';
import { once, getFirstArgFromString, replaceFirstTagAttrs, hasFirstTag, insertClassIntoAttrStr } from './utils';



let idCounter = Math.floor(Math.random() * 1000);



const calcUniqId = (name = '') => `cmp-${idCounter++}-${name}`;



export const renderToDom = (component, element, init = () => {}, method = 'beforeEnd') => {
  element.insertAdjacentHTML(method, component.toString());

  setTimeout(() => {
    component.init();

    init();
  }, 15); // hack
};



export default (template, onInit) =>
  (componentName = null, data = {}, parentEE = EventEmitter()) => {
    data = Object.assign({}, data);



    const [ ee, destroyEventBus ] = wrap(parentEE);
    const components = [];
    let onDestroy = () => {};




    // nested component
    const $cmp = (componentName, componentBuilder, nestedData = {}, nestedEventBus = ee) => {
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
          id = calcUniqId('id');
          attrsStr = ` id="${id}" ${attrsStr}`;
        }

        return attrsStr;
      });
    };



    let el = null;

    const getEl = () => {
      if (el) {
        return el;
      }

      el = document.getElementById(id);

      return el;
    };

    const clearEl = () => {
      el = null;
    };





    const destroy = once(() => {
      while (components.length) {
        components.pop().destroy();
      }

      const element = getEl();

      if (element) {
        element.parentNode.removeChild(element);
      }

      onDestroy();

      clearEl();

      destroyEventBus();
    });





    const init = once(() => {
      if (onInit) {
        const _onDestroy = onInit(getEl(), data, { on: ee.on, emit: ee.emit, ev: calcUniqId, id, destroy });

        if (typeof _onDestroy === 'function') {
          onDestroy = _onDestroy;
        }
      }

      components.forEach((cmp) => {
        cmp.init();
      });
    });




    return { toString, init, destroy };
  };
