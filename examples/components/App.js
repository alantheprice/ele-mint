import { register, registerComponent, Component } from '../../src/eleMint'
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

const noteFunc = (data, update) => {
  return Card(
    div({
      onclick: () => update({test: "worked", titleText: 'Bam!'})
    },
      h5(data.note.date),
      p(data.test)
    ),
    p({class: "padding--vertical"},
      data.note.message
    ),
  )
}

// TODO: add state as second param
const Note = registerComponent(noteFunc, {test:"1234"}, {
  onDataUpdated: (oldData, newData) => {
  console.log("dataUpdated, Old:", oldData)
  console.log("dataUpdated, New:", newData)
},
  onAttach: () => {
    console.log("We attached!")
  }
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
  constructor(data) {
    super(data, {
      titleText: "",
      notes: data.startingNotes,
      showNotes: false
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

  updateReducer(previousData, newData) {
    return {
      ...previousData,
      ...newData
    }
  }


  /**
   * The content function should be re-runable, and when it is re-run via "reload()",it needs to be intelligent
   * For initial testing and prototyping, we can have it reload in simple state by just re-adding all elements, 
   * but eventually it should loop through children and allow the child to control whether it needs to recreate, 
   * or just update.
   */

  content(data, update) {

    return (
      div({class: "page"},
        h1("Testing!"),
        div({class: "test"}, data.titleText),
        Card(
            p("a bunch of rando contents that could easily be written out with better clarity.")
        ),
        Card(
          textarea({
            placeholder: "enter something here.",
            oninput: (ev, elem, context) => {
              update({
                titleText: elem.value
              })
            },
            value: data.titleText
          }),
          button(
            {
              onclick: () => update({
                titleText: ""
              })
            },
            "CLEAR"
          ),
          h3(
            data.titleText
          ),
        ),
        Card(
          Card(
            Card(
              h3("New Note"),
              textarea({class: "margin--vertical text-area"}),
              div({class: "flx flx--space-btw"},
                button({ 
                  onclick: () => update({
                    notes: data.notes.concat([{
                      date: new Date().toISOString(),
                      message: "New test"
                    }])
                  })
                },"Save Note"),
                button({ 
                  onclick: () => update({
                    notes: []
                  })
                }, "Clear all notes")
              )
            )
          )
        ),
        h3("Notes"),
        button(
          {
            name: "Button",
            onclick: () => update({
              showNotes: !data.showNotes
            })
          },
          data.showNotes ? "HIDE NOTES" : "SHOW NOTES"
        ),
        div(
          data.showNotes ? data.notes.map((note) => Note({
            note: note, 
            titleText: data.titleText
          })) : null
        ),
        styles()
      )
    )
  }
}

export default registerComponent(App)
