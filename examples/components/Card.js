import { register, Component } from '../../src/eleMint'
const section = register('section');

class Card extends Component {
    content() {
        return (
            section({class: "card flx flx--column"},
                this.props.children,
            )
        )
    }
}

export default register(Card)