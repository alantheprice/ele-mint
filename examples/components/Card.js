import { register, Component } from '../../src/eleMint'
const section = register('section');

class Card extends Component {
    content() {
        return (
            section({style: "border-radius: 5px; border: 1px solid gray; padding: 20px; margin: 10px;"},
                this.props.children,
            )
        )
    }
}

export default register(Card)