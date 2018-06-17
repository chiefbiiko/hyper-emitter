var EventEmitter = require('events').EventEmitter
var dealias = require('aka-opts')

function processOpts (opts) {
  return Object.assign({
    ignoreHiddenProps: true,
    recursive: false
  }, dealias(opts || {}, {
    ignoreHiddenProps: [
      'ignoreHidden',
      'ignorePrivate',
      'ignorePrivateProps' ,
      'ignoreHiddenState',
      'ignorePrivateState'
    ],
    recursive: [
      'recurse',
      'deep',
      'nested',
      'cascade'
    ]
  }))
}

function hyperEmitter (target, opts) {
  opts = processOpts(opts)
  var setup = false
  var handler = Object.assign({
    get (target, key, receiver) {
      if (opts.recursive) {
        try {
          return new Proxy(target[key], handler)
        } catch (_) {
          return Reflect.get(target, key, receiver)
        }
      } else {
        return Reflect.get(target, key, receiver)
      }
    },
    defineProperty (target, key, descriptor) {
      var ok = Reflect.defineProperty(target, key, descriptor)
      if (opts.ignoreHiddenProps && key[0] === '_') return ok
      if (ok) proxy.emit('didDefineProperty', target, key, descriptor)
      return ok
    },
    deleteProperty (target, key) {
      var ok = Reflect.deleteProperty(target, key)
      if (opts.ignoreHiddenProps && key[0] === '_') return ok
      if (ok) proxy.emit('didDeleteProperty', target, key)
      return ok
    },
    set (target, key, value, receiver) {
      var ok = Reflect.set(target, key, value, receiver)
      if (opts.ignoreHiddenProps && key[0] === '_') return ok
      if (ok) proxy.emit('didSet', target, key, value, receiver)
      return ok
    },
    setPrototypeOf (target, prototype) {
      var ok = Reflect.setPrototypeOf(target, prototype)
      if (!setup) setup = true
      if (ok && setup) proxy.emit('didSetPrototypeOf', target, prototype)
      return ok
    }
  }, opts)
  var proxy = new Proxy(target, handler)
  Object.setPrototypeOf(proxy, EventEmitter.prototype)
  return proxy
}

module.exports = hyperEmitter
