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

function listenable (x) {
  if (problyEventTarget(x)) {
    x.addListener = x.addEventListener
    x.removeListener = x.removeEventListener
  }
  return x
}

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

module.exports = {
  listenable,
  problyListenable,
  processOpts,
  reemit
}
