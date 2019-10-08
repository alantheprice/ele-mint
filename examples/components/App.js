import { register, Component } from '../../src/eleMint'
import Card from './Card';
const div = register('div'),
  button = register('button'),
  p = register('p'),
  h3 = register('h3'),
  h5 = register('h5'),
  hr = register('hr')

class App extends Component {
  constructor(props) {
    super(props)
    this.props = props
    setTimeout(() => {
      console.log(this)
    }, 4000)
  }

  e_notify(notifyText) {
    alert(notifyText)
  }

  content() {
    return (
      div(
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
        button({
          onclick: () => {
            this.e_notify("someText")
          }
        }, 
        "CLICK ME!!"),
      )
    )
  }
}

export default register(App)
