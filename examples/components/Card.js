import { register } from '../../src/eleMint'
const section = register('section');

export default register((props) => 
    section({class: "card flx flx--column"}, props.children))
