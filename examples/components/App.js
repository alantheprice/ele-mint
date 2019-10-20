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

const Note = register((props) => {
  if (!props.showNotes) {
    return null
  }
  return Card(
    div(
      h5(props.note.date)
    ),
    p({class: "padding--vertical"},
      props.note.message
    ),
  )
})

const styles = () => style(`
  :root {
    --padding: 10px;
  }
  body {
    margin: 0;
    font-family: Helvetica, Arial, san-serif;
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

class App extends Component {
  constructor(props) {
    props.titleText = ""
    super(props, {
      titleText: "",
      notesToggleButtonText: "SHOW NOTES"
    })
  }

  /**
   * TODO: Custom events like this should be able to be semantically correct ("onnotify", or "onNotify")
   * Or possibly, we don't even need them if we don't need to notify up the stack at all? I want to rethink this, 
   * but I am definitely tempted to keep them in to make it easier to do internal eventing.
   * We should move to an "update function pattern" which handles eventing without having to explicitly call emit.
  */
  onNotify(notifyText) {
    this.update({
      titleText: notifyText
    })
  }

  /**
   * The content function should be re-runable, and when it is re-run via "reload()",it needs to be intelligent
   * For initial testing and prototyping, we can have it reload in simple state by just re-adding all elements, 
   * but eventually it should loop through children and allow the child to control whether it needs to recreate, 
   * or just update.
   */

  content(props, update) {
    console.log('titleText:', props.titleText)
    setTimeout(() => {
      update({titleText: Math.random().toString()})
    }, 3000)
    return (
      div({class: "page"},
        // h1("Testing!"),
        div({class: "test"}, props.titleText),
        // Card(
        //     p("a bunch of rando contents that could easily be written out with better clarity.")
        // ),
        // Card(
        //   textarea({
        //     placeholder: "enter something here.",
        //     oninput: (ev, elem, context) => {
        //       update({
        //         titleText: elem.value
        //       })
        //     },
        //     value: props.titleText
        //   }),
        //   button(
        //     {
        //       onclick: () => update({
        //         titleText: ""
        //       })
        //     },
        //     "CLEAR"
        //   ),
        //   h3(
        //     props.titleText
        //   ),
        // ),
        // Card(
        //   Card(
        //     Card(
        //       h3("New Note"),
        //       textarea({class: "margin--vertical text-area"}),
        //       div({class: "flx flx--space-btw"},
        //         button("Save Note"),
        //         button("Delete Note")
        //       )
        //     )
        //   )
        // ),
        // h3("Notes"),
        // button(
        //   {
        //     onclick: () => update({
        //       showNotes: !props.showNotes,
        //       notesToggleButtonText: props.showNotes ? "SHOW NOTES" : "HIDE NOTES"
        //     })
        //   },
        //   props.notesToggleButtonText
        // ),
        // div(
        //   props.notes.map((note) => Note({note: note, showNotes: props.showNotes}))
        // ),
        styles()
      )
    )
  }
}

export default register(App)
