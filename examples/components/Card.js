import { register } from '../../src/eleMint2'
const section = register('section');

export default register((props) => 
    section({class: "card flx flx--column"}, props.children))
