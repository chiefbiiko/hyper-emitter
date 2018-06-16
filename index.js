var EventEmitter = require('events').EventEmitter

function hyperEmitter (obj, opts) {
  var setup = false
  var handler = {
    defineProperty (target, key, descriptor) {
      var ok = Reflect.defineProperty(target, key, descriptor)
      if (ok) proxy.emit('defineProperty', target, key, descriptor)
      return ok
    },
    deleteProperty (target, property) {
      var ok = Reflect.deleteProperty(target, property)
      if (ok) proxy.emit('deleteProperty', target, property)
      return ok
    },
    set (target, property, value, receiver) {
      var ok = Reflect.set(target, property, value, receiver)
      if (ok) proxy.emit('set', target, property, value, receiver)
      return ok
    },
    setPrototypeOf (target, prototype) {
      var ok = Reflect.setPrototypeOf(target, prototype)
      if (!setup) setup = true
      if (ok && setup) proxy.emit('setPrototypeOf', target, prototype)
      return ok
    }
  }
  var proxy = new Proxy(obj, Object.assign(handler, opts || {}))
  Object.setPrototypeOf(proxy, EventEmitter.prototype)
  return proxy
}

module.exports = hyperEmitter
