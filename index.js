var EventEmitter = require('events').EventEmitter
var dealias = require('aka-opts')

function shouldEmit (ok, only, key) {
  return true && !only.length || ok && only.length && only.indexOf(key) !== -1
}

// TODO:
// + allow exclude aka ignore along with only
// + trap _eventsCount on hyperEmitter and diable emits for it
// + think about a way of observing nested property mutations
function hyperEmitter (target, opts) {
  opts = Object.assign({ only: [] }, dealias(opts || {}, { only: [ 'keys' ] }))
  var setup = false
  var handler = {
    defineProperty (target, key, descriptor) {
      var ok = Reflect.defineProperty(target, key, descriptor)
      if (shouldEmit(ok, opts.only, key)) {
        proxy.emit('didDefineProperty', target, key, descriptor)
      }
      return ok
    },
    deleteProperty (target, key) {
      var ok = Reflect.deleteProperty(target, key)
      if (shouldEmit(ok, opts.only, key)) {
        proxy.emit('didDeleteProperty', target, key)
      }
      return ok
    },
    set (target, key, value, receiver) {
      var ok = Reflect.set(target, key, value, receiver)
      if (shouldEmit(ok, opts.only, key)) {
        proxy.emit('didSet', target, key, value, receiver)
      }
      return ok
    },
    setPrototypeOf (target, prototype) {
      var ok = Reflect.setPrototypeOf(target, prototype)
      if (!setup) setup = true
      if (ok && setup) proxy.emit('didSetPrototypeOf', target, prototype)
      return ok
    }
  }
  var proxy = new Proxy(target, Object.assign(handler, opts))
  Object.setPrototypeOf(proxy, EventEmitter.prototype)
  return proxy
}

module.exports = hyperEmitter
