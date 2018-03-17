# Ele-Mint

## Ele-Mint has 2 simple goals

### 1. *Make it simple to build the dom in javascript.*

* To support that main goal, The sytax closely mirrors HTML, but doesn't involve any string parsing. Building the dom is simply calling functions.

### 2. Keep it light -- 1.57kb gzipped (3.9kb minified) with full module support

* Because a key goal is keeping it small, the project does not include a few niceties like predefining all existing html elements.  It is simple to do, and will be added to example usages in the future as the documentation and examples become more robust.

[Demo](https://alantheprice.github.io/ele-mint/)

## Examples

### Simple Usage for defining element

```javascript
import { register } from 'ele-mint'
const div = e('div'),
    h1 = register('h1'),
    hr = register('hr'),
    p = register('p'),
    button = register('button')

div({class: 'main-container'},
    h1({class: 'hdg hdg--1'}, 'Main site heading'),
    hr(),
    button({onclick: handleButtonClick}, 'click me!')),
    p('some body copy here, what good is a site without content?')
).render(document.body)

function handleButtonClick(nativeEvent) {
    console.log('button clicked')
}
```

Which renders out the following within the body tag:

```html
<div class="main-container">
    <h1 class="hdg hdg--1">Main site heading</h1>
    <hr>
    <p>some body copy here, what good is a site without content?</p>
    <button>click me!</button>
</div>
```

#### Example with events

TODO

#### Examples building Component

TODO

#### Examples using virtual properties to hold component/element state

TODO.

#### Examples using custom events to handle and propogate changes

TODO.
