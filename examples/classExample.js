import App from './components/App';

const notes = [
  {
    date: new Date().toISOString(),
    message: "I really enjoyed this going here. The food was good, and relatively quick, the server was attentive, but not stiffling. This might become my standby."
  },
  {
    date: new Date().toISOString(),
    message: "I really enjoyed this going here. The food was good, and relatively quick, the server was attentive, but not stiffling. This might become my standby."
  }
]

function test() {
  App({notes: notes}).mount(document.body)
}

// Start this bugger
test()

