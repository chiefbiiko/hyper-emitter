var tape = require('tape')
var hyperEmitter = require('./index.js')

tape('reemittin events from event targets', function (t) {
  var input = hyperEmitter(document.creatElement('input'))

  input.on('keyup', function (untrustedE) {
    t.pass('got the keyup event')
    t.end()
  })
  
  input.dispatchEvent(new Event('keyup'))
})