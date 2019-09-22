import { register } from './src/eleMint'
const div = register('div'),
  button = register('button');

class Test {
  e_notify(notifyText) {
    alert(notifyText)
  }
}

function test() {
  div(new Test(), 
    div("somethign"),
    div("somethingelse"), 
    button({
      onclick: function() {
        debugger
        this.emit("notify", "someText")
      }
    }, 
    "CLICK ME!!")
  ).render(document.body)
}

// Start this bugger
test()

