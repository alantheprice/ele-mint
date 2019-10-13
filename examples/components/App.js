import { register, Component } from '../../src/eleMint'
import Card from './Card';
const div = register('div'),
  button = register('button'),
  p = register('p'),
  h3 = register('h3'),
  h5 = register('h5'),
  hr = register('hr'),
  h1 = register('h1'),
  input = register('input'),
  textarea = register('textarea'),
  style = register("style")

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

const Note = (note) => (
  Card(
    div(
      h5(note.date)
    ),
    p({class: "padding--vertical"},
      note.message
    ),
  )
)

class App extends Component {
  constructor(props) {
    props.v_text = ""
    super(props)
    setTimeout(() => {
      process.env
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
      div({class: "page"},
        // TODO: Here we can build and test the idea of a follow prop. this works, but it's ugly...
        h1("Testing!"),
        div({class: "test"}, "something"),
        Card(
            p("a bunch of rando contents that could easily be written out with better clarity.")
        ),
        Card(
          h3("Edit Note"),
          textarea({class: "margin--vertical text-area"}),
          div({class: "flx flx--space-btw"},
            button("Save Note"),
            button("Delete Note")
          )
        ),
        h3("Notes"),
        div(
          notes.map(Note)
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
        style(`
          :root {
            --padding: 10px;
          }
          
          .flx {
            width: 100%;
            display: flex;
          }
          .flx--column {
            flex-direction: column;
          }
          .flx--space-btw {
            justify-content: space-between;
          }

          .padding {
            padding: var(--padding);
          }
          .padding--horizontal {
            padding-left: var(--padding);
            padding-right: var(--padding);
          }
          .padding--vertical {
            padding-top: var(--padding);
            padding-bottom: var(--padding);
          }

          .margin {
            margin: var(--padding);
          }
          .margin--vertical {
            margin-top: var(--padding);
            margin-bottom: var(--padding);
          }

          /** components */

          .page {
            padding: 20px;
          }
          .card {
            box-shadow: 3px 3px 10px rgba(80, 80, 80, .3);
            border: 1px solid #CCC; 
            padding: 20px; 
            margin: 20px 0;
            border-radius: 5px;
          }
          .text-area {
            height:180px;
            width: 100%;
            margin-bottom: 20px;
          }
          
        `)
      )
    )
  }
}

export default register(App)
