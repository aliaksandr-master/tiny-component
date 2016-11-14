'use strict';

export default () => {
  const listeners = [];

  return {
    $emit (eventName, ...args) {
      const eventListeners = listeners[eventName];

      setTimeout(() => {
        if (eventListeners == null || !eventListeners.length) {
          return;
        }

        eventListeners.forEach((listener) => {
          listener(...args);
        });
      }, 0);
    },

    $on (eventName, callback) {
      let eventListeners = listeners[eventName];

      if (eventListeners == null) {
        eventListeners = listeners[eventName] = [];
      }

      eventListeners.push(callback);

      eventListeners = null;

      let fired = false;

      return () => {
        if (fired) {
          return;
        }

        fired = true;

        let eventListeners = listeners[eventName];

        if (eventListeners == null) {
          return;
        }

        if (callback == null) {
          listeners[eventName] = null;
          return;
        }

        eventListeners = eventListeners.reduce((mem, v) => {
          if (v !== callback) {
            mem.push(v);
          }

          return mem;
        }, []);

        if (!eventListeners.length) {
          eventListeners = null;
        }

        listeners[eventName] = eventListeners;

        eventListeners = null;

        callback = null;
      };
    }
  };
};
