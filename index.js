var EventEmitter = require('events').EventEmitter
var {
  maybeListenable,
  problyListenable,
  processOpts,
  reemit
} = require('./utils.js')

function hyperEmitter (target, opts) {
  opts = processOpts(opts)

  var handler = {
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
  }

  if (typeof target === 'function') {
    Object.assign(handler, {
      apply (target, thisArg, args) {
        var rtn = target.call(thisArg, ...args)
        proxy.emit('didApply', target, thisArg, args)
        return rtn
      },
      construct (Target, args, NewTarget) {
        var rtn = Reflect.construct(Target, args, NewTarget)
        proxy.emit('didConstruct', Target, args, NewTarget)
        return rtn
      }
    })
  }

  var rtn, proxy
  if (opts.revocable) {
    rtn = Proxy.revocable(target, Object.assign(handler, opts))
    proxy = rtn.proxy
  } else {
    rtn = new Proxy(target, Object.assign(handler, opts))
    proxy = rtn
  }

  if (problyListenable(target)) reemit([], proxy, maybeListenable(target))
  else Object.assign(proxy.__proto__, EventEmitter.prototype)

  return rtn
}

module.exports = hyperEmitter
