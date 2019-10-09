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
    setTimeout(() => {
      console.log(this)
    }, 4000)
  }

  /**
   * TODO: Custom events like this should be able to be semantically correct ("onnotify", or "onNotify")
   * Or possibly, we don't even need them if we don't need to notify up the stack at all? I want to rethink this, 
   * but I am definitely tempted to keep them in to make it easier to do internal eventing.
  */
  e_notify(notifyText) {
    this.v_text = notifyText
  }

  /**
   * The content function should be re-runable, and when it is re-run via "reload()",it needs to be intelligent
   * For initial testing and prototyping, we can have it reload in simple state by just re-adding all elements, 
   * but eventually it should loop through children and allow the child to control whether it needs to recreate, 
   * or just update.
   */

  content() {
    return (
      div(
        // TODO: Here we can build and test the idea of a follow prop. this works, but it's ugly...
        h1("Some Testing Here!"),
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
          h3({
              v_text:"",
              set_text: function(text) {this.elem.innerText = text}
            },
            this.props.v_text
          ),
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
