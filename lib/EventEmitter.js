'use strict';

import { once } from './utils';




const emit = (listeners, eventName, args) => {
  return listeners.hasOwnProperty(eventName) ? listeners[eventName].map((listener) => listener(...args)) : [];
};




const on = (listeners, eventName, callback) => {
  if (typeof callback !== 'function') {
    return;
  }

  if (!listeners.hasOwnProperty(eventName)) {
    listeners[eventName] = [];
  }

  listeners[eventName].push(callback);
};




const off = (listeners, eventName, callback) => {
  if (!listeners.hasOwnProperty(eventName) || typeof callback !== 'function') {
    return;
  }

  listeners[eventName] = listeners[eventName].filter((listener) => listener !== callback);
};




export default () => {
  let listeners = {};
  let count = 0;

  return {
    emit: (eventName, ...args) =>
      emit(listeners, eventName, args),

    on (eventName, callback) {
      on(listeners, eventName, callback);
      count++;

      return once(() => {
        off(listeners, eventName, callback);
        count--;

        if (!count) {
          listeners = {}; // hack for GC
        }
      });
    }
  };
};






export const Wrapper = () => {
  let destroyCallbacks = null;

  return {
    wrap: (eeOn) => (...args) => {
      const off = eeOn(...args);

      if (!destroyCallbacks) {
        destroyCallbacks = [];
      }

      destroyCallbacks.push(off);

      return () => {
        destroyCallbacks = destroyCallbacks.filter((callback) => callback !== off);
        off();
      };
    },
    clear () {
      while (destroyCallbacks.length) {
        destroyCallbacks.pop()();
      }

      destroyCallbacks = null;
    }
  }
};
