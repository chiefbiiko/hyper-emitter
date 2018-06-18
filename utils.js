var dealias = require('aka-opts')

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

function problyEventEmitter (x) {
  return x &&
    typeof x.addListener === 'function' &&
    typeof x.removeListener === 'function' &&
    typeof x.emit === 'function'
}

function problyEventTarget (x) {
  return x &&
    typeof x.addEventListener === 'function' &&
    typeof x.removeEventListener === 'function' &&
    typeof x.dispatchEvent === 'function'
}

function problyListenable (x) {
  return problyEventEmitter(x) || problyEventTarget(x)
}

function maybeListenable (x) {
  if (problyEventTarget(x)) {
    x.addListener = x.addEventListener
    x.removeListener = x.removeEventListener
  }
  return x
}

function processOpts (opts) {
  var options = Object.assign({
    hiddenPropsPrefix: '_',
    ignoreHiddenProps: true,
    recursive: false,
    revocable: false
  }, dealias(Object.assign({}, opts || {}), {
    hiddenPropsPrefix: [
      'hiddenStatePrefix',
      'privateStatePrefix',
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
    ],
    revocable: [
      'revoke'
    ]
  }))

  if (options.recursive && options.revocable) {
    throw new TypeError('cannot create a revocable proxy in recursive mode')
  }

  return options
}

module.exports = {
  maybeListenable,
  problyListenable,
  processOpts,
  reemit
}
