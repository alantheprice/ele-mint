import { register, registerComponent } from "../../src/index.js";
const section = register("section");

export default registerComponent((props) =>
  section({ class: "card flx flx--column" }, props.children)
);
