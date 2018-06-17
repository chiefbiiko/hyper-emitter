var EventEmitter = require('events').EventEmitter
var dealias = require('aka-opts')

// make own module
function truth () { return true }
function reemit (only, target, ...sources) {
  sources.forEach(function (source) {
    source.eventNames()
      .filter(only && only.length ? only.includes : truth, only)
      .forEach(function (eventName) {
        source.addListener(eventName, target.emit.bind(target, eventName))
      })
  })
}
// end own module

function processOpts (opts) {
  return Object.assign({
    hiddenPropsPrefix: '_',
    ignoreHiddenProps: true,
    recursive: false
  }, dealias(opts || {}, {
    hiddenPropsPrefix: [
      'hiddenStatePrefix',
      'hiddenPrefix',
      'privatePrefix'
    ],
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
      'cascade',
      'cascading'
    ]
  }))
}

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
  if (target instanceof EventEmitter) reemit([], proxy, target)
  else Object.assign(proxy.__proto__, EventEmitter.prototype)
  return proxy
}

module.exports = hyperEmitter
