import { register, registerComponent } from "../src/index.js";
const div = register("div"),
  h1 = register("h1"),
  h2 = register("h2"),
  p = register("p"),
  button = register("button"),
  ul = register("ul"),
  li = register("li");

const Clickable = registerComponent(
  (data, update) => {
    return li(
      h2(data.title),
      p(data.message),
      button(
        {
          onclick: () => {
            console.log("clicked");
            update({
              items: data.items.concat([{ title: "something" }]),
              selectedIndex: data.index,
              message: "override",
            });
          },
        },
        "click me"
      )
    );
  },
  { message: "test message" }
);

const List = registerComponent(
  (data, update) => {
    return div(
      h1(`Selected Index: ${data.selectedIndex}`),
      ul(
        data.items.map((item, index) => {
          return Clickable({ ...data, ...item, index: index });
        })
      )
    );
  },
  {
    items: [{ title: "Testing 1" }],
    selectedIndex: -1,
  },
  {
    onDataUpdated: (oldData, newData) => {
      console.log("dataUpdated, Old:", oldData);
      console.log("dataUpdated, New:", newData);
    },
    onAttach: function () {
      console.log("We attached!");
    },
  }
);

List().mount(document.getElementsByClassName("mount-point")[0]);
