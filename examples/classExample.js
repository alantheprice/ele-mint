import { register, registerComponent, Component } from '../src/eleMint'
import App from './components/App';
const div = register('div')


const notes = []

notes.push({
  date: new Date().toISOString(),
  message: "I really enjoyed this going here. The food was good, and relatively quick, the server was attentive, but not stiffling. This might become my standby."
})
notes.push({
  date: new Date().toISOString(),
  message: "Nope, Not good!"
})

function test() {
  // startingNotes here is a constant that can't be muttated because there is no component owner of that data. 
  App({ startingNotes: notes }).mount(document.getElementsByClassName("mount-point")[0])
}

// Start this bugger
test()
const effComp = (data, update) => {
  // on Comparison, the text content is not in the second item and there is a children in the data with no values
  return (
    div(
      div("doesn't change"),
      div(
        {
          contentEditable: true,
          oninput: (e) => {
            update({ title: div.innerHTML })
          }
        },
        data.title
      )
    )
  )
}

const efficiencyTest = registerComponent(effComp, { title: "none" })

efficiencyTest().mount(document.getElementsByClassName("mount-point")[0])


