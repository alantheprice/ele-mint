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
    props.v_text = ""
    super(props)
    // this.props = props
    setTimeout(() => {
      console.log(this)
    }, 4000)
    // this.v_text = {
    //   testValue: ""
    // }
  }

  e_notify(notifyText) {
    this.v_text = notifyText
    // alert(notifyText)
  }

  content() {
    return (
      div(
        // TODO: Here we can build and test the idea of a follow prop. this works, but it's ugly...
        h1({
            v_text:"",
            set_text: function(text) {this.elem.innerText = text}
          },
          this.props.v_text
        ),
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
            v_text:"",
            set_text: function(text) {this.elem.value = text},
            placeholder: "enter something here.",
            oninput: (ev, elem, context) => {
              context.emit("notify", elem.value)
            }
          }),
          button({
            onclick: (ev, elem, context) => {
              context.emit("notify", "")
            }
          },
          "CLEAR"
          ),
        ),
      )
    )
  }
}

export default register(App)
