import { register, Component } from '../../src/eleMint2'
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

const Note = register((props, update) => {

  return Card(
    div(
      h5(props.note.date)
    ),
    p({class: "padding--vertical"},
      props.note.message
    ),
  )
})

class App extends Component {
  constructor(props) {
    props.titleText = ""
    super(props)
    setTimeout(() => {
      console.log(this)
    }, 4000)
  }

  /**
   * TODO: Custom events like this should be able to be semantically correct ("onnotify", or "onNotify")
   * Or possibly, we don't even need them if we don't need to notify up the stack at all? I want to rethink this, 
   * but I am definitely tempted to keep them in to make it easier to do internal eventing.
   * We should move to an "update function pattern" which handles eventing without having to explicitly call emit.
  */
  onNotify(notifyText) {
    this.titleText = notifyText
  }

  getClearHandler() {
    return (ev, elem, context) => {
      this.titleText = notifyText
    }
  }

  /**
   * The content function should be re-runable, and when it is re-run via "reload()",it needs to be intelligent
   * For initial testing and prototyping, we can have it reload in simple state by just re-adding all elements, 
   * but eventually it should loop through children and allow the child to control whether it needs to recreate, 
   * or just update.
   */

  content(props, follow, update) {
    return (
      div({class: "page"},
        // TODO: Here we can build and test the idea of a follow prop. this works, but it's ugly...
        h1("Testing!"),
        div({class: "test"}, "something"),
        Card(
            p("a bunch of rando contents that could easily be written out with better clarity.")
        ),
        Card(
          Card(
            Card(
              h3("Edit Note"),
              textarea({class: "margin--vertical text-area"}),
              div({class: "flx flx--space-btw"},
                button("Save Note"),
                button("Delete Note")
              )
            )
          )
        ),
        h3("Notes"),
        div(
          props.notes.map((note) => Note({note: note}))
        ),
        h3({
            // v_text:"",
            // set_text: function(text) {this.element.innerText = text}
          },
          props.titleText
        ),
        input({
          // v_text:"",
          // set_text: function(text) {this.element.value = text},
          placeholder: "enter something here.",
          oninput: (ev, elem, context) => {
            context.emit("notify", elem.value)
          },
          value: follow("titleText")
        }),
        button({
          onclick: this.getClearHandler()
        },
        "CLEAR"
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
