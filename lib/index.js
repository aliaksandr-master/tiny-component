'use strict';

import EventEmitter, { Wrapper } from './EventEmitter';
import { once, getFirstArgFromString, replaceFirstTagAttrs, hasFirstTag, insertClassIntoAttrStr } from './utils';



const base = Math.floor(Math.random() * 1000).toString(36);
let idCounter = 0;
export const symbol = (name = '') => `u-${name}-${base}-${idCounter++}`;



export const renderToDom = (component, parentDomElement, { onRender = () => {}, method = 'beforeEnd' } = {}) => {
  parentDomElement.insertAdjacentHTML(method, component.toString());

  setTimeout(() => {
    component.init();

    onRender();
  }, 15); // hack
};



const EVENT_INIT = symbol('init');
const EVENT_DESTROY = symbol('destroy');


export default (template, onInit) =>
  (data = {}, options = {}) => {
    const parentEE = options.$$ee ? options.$$ee : EventEmitter();
    const className = options.$class ? String(options.$class) : '';
    let id = '';

    data = Object.assign({}, data);

    const eeWrapper = Wrapper();
    const ee = EventEmitter();

    ee.$emit = parentEE.emit;
    ee.$on = eeWrapper.wrap(parentEE.on);
    ee.on = eeWrapper.wrap(ee.on);

    const childComponent = (componentBuilder, data = {}, options) => {
      const cmp = componentBuilder(data, Object.assign({}, options, { $$ee: ee }));

      ee.on(EVENT_INIT, () => cmp.init());
      ee.on(EVENT_DESTROY, () => cmp.destroy());

      return cmp;
    };





    const toString = () => {
      const html = template(data, childComponent).trim();

      if (!hasFirstTag(html)) {
        throw TypeError('invalid html format. It must have first tag');
      }

      return replaceFirstTagAttrs(html, (attrsStr) => {
        if (className) {
          attrsStr = insertClassIntoAttrStr(attrsStr, className);
        }

        id = getFirstArgFromString(attrsStr);

        if (!id) {
          id = symbol('id');
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




    const destroy = () => {
      // destroy process starts from children
      ee.emit(EVENT_DESTROY);

      // remove all uncleared event listeners
      eeWrapper.clear();

      // remove element from dom
      const element = getEl();

      if (element) {
        element.parentNode.removeChild(element);
        clearEl();
      }
    };




    const init = () => {
      if (onInit) {
        const options = {
          id,
          get el () {
            return getEl();
          },
          set el (value) {
            throw new Error('setting property "el" manually is not allowed');
          },
          events: ee,
          destroy: once(destroy)
        };

        ee.on(EVENT_DESTROY, once(onInit(data, options)));
      }

      ee.emit(EVENT_INIT);
    };




    return { toString, init: once(init), destroy: once(destroy) };
  };
