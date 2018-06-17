var EventEmitter = require('events').EventEmitter
var {
  listenable,
  problyEventEmitter,
  problyEventTarget,
  problyListenable,
  processOpts,
  reemit
} = require('./utils.js')

// TODO: xtend handler for watching function calls!!!
function hyperEmitter (target, opts) {
  opts = processOpts(opts)
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
      if (opts.ignoreHiddenProps && key.startsWith(opts.hiddenPropsPrefix)) {
        return ok
      }
      if (ok) {
        proxy.emit('didDefineProperty', target, key, descriptor)
        proxy.emit('change')
      }
      return ok
    },
    deleteProperty (target, key) {
      var ok = Reflect.deleteProperty(target, key)
      if (opts.ignoreHiddenProps && key.startsWith(opts.hiddenPropsPrefix)) {
        return ok
      }
      if (ok) {
        proxy.emit('didDeleteProperty', target, key)
        proxy.emit('change')
      }
      return ok
    },
    set (target, key, value, receiver) {
      var ok = Reflect.set(target, key, value, receiver)
      if (opts.ignoreHiddenProps && key.startsWith(opts.hiddenPropsPrefix)) {
        return ok
      }
      if (ok) {
        proxy.emit('didSet', target, key, value, receiver)
        proxy.emit('change')
      }
      return ok
    },
    setPrototypeOf (target, prototype) {
      var ok = Reflect.setPrototypeOf(target, prototype)
      if (ok) {
        proxy.emit('didSetPrototypeOf', target, prototype)
        proxy.emit('change')
      }
      return ok
    }
  }, opts)
  var proxy = new Proxy(target, handler)
  if (problyListenable(target)) reemit([], proxy, listenable(target))
  else Object.assign(proxy.__proto__, EventEmitter.prototype)
  return proxy
}

module.exports = hyperEmitter
