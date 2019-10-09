import { register, Component } from '../../src/eleMint'
import Card from './Card';
const div = register('div'),
  button = register('button'),
  p = register('p'),
  h3 = register('h3'),
  h5 = register('h5'),
  hr = register('hr'),
  h1 = register('h1'),
  input = register('input')

class App extends Component {
  constructor(props) {
    super(props)
    this.props = props
    setTimeout(() => {
      console.log(this)
    }, 4000)
    this.state = {
      testValue: ""
    }
  }

  e_notify(notifyText) {
    alert(notifyText)
  }

  content() {
    return (
      div(
        // TODO: Here we can build and test the idea of a follow prop.
        h1(this.state.testValue),
        div({class: "btn", style: "background-color: brown;"}, "something"),
        Card(
            p("a bunch of rando contents that could easily be written out with better clarity.")
        ),
        Card(
            h3("Title"),
            h5("description"),
            div(
                hr(),
                div(
                    div("some type of content here")
                )
            )
        ),
        Card(
          input({
            placeholder: "enter something here.",
            oninput: (ev, elem, context) => {
            }
          }),
          button({
            onclick: (ev, elem, context) => {
              this.e_notify("someText")
            }
          },
          "CLICK ME!!"
          ),
        ),
      )
    )
  }
}

export default register(App)
