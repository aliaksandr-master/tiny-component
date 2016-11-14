'use strict';

import { once } from './utils';




const emit = (listeners, eventName, ...args) => {
  const eventListeners = listeners[eventName];

  if (eventListeners == null || !eventListeners.length) {
    return;
  }

  eventListeners.forEach((listener) => {
    listener(...args);
  });
};




const on = (listeners, eventName, callback) => {
  let eventListeners = listeners[eventName];

  if (eventListeners == null) {
    eventListeners = listeners[eventName] = [];
  }

  eventListeners.push(callback);
};




const off = (listeners, eventName, callback) => {
  if (listeners[eventName] == null) {
    return;
  }

  listeners[eventName] = listeners[eventName].filter((listener) => listener !== callback);
};




export const wrap = (globalEE) => {
  const ee = {};
  const destroyCallbacks = [];
  let destroyed = false;

  ee.emit = (...args) => {
    if (destroyed) {
      return;
    }

    globalEE.emit(...args);
  };

  ee.on = (...args) => {
    if (destroyed) {
      return () => {};
    }

    const off = globalEE.on(...args);

    destroyCallbacks.push(off);

    return off;
  };

  const off = once(() => {
    destroyed = true;

    while (destroyCallbacks.length) {
      destroyCallbacks.pop()();
    }
  });

  return [ ee, off ];
};




export default () => {
  const listeners = {};

  return {
    emit (eventName, ...args) {
      emit(listeners, eventName, ...args);
    },

    on (eventName, callback) {
      if (!eventName || !callback) {
        return () => {};
      }

      on(listeners, eventName, callback);

      return once(() => {
        off(listeners, eventName, callback);
      });
    }
  };
};
