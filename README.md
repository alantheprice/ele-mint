# Ele-Mint

### Ele-Mint has 2 simple goals: 
#### 1. *Make it simple to build the dom in javascript.*
 * To support that main goal, The sytax closely mirrors HTML, but doesn't involve any string parsing. Building the dom is simply calling functions.
#### 2. Keep it light -- just over 2 kilobytes minified(not gzipped) with module support.
  * Because a key goal is keeping it small, the project does not include a few niceties like predefining all existing html elements.  It is simple to do, and will be added to example usages in the future as the documentation and examples become more robust.

[Demo](https://alantheprice.github.io/ele-mint/)

Lets see some examples:  

#### Simple Usage for defining element
```javascript
import { e } from 'ele-mint'

e('div')({class: 'main-container'},
    e('h1')({class: 'hdg-1'}, 'Main site heading'),
    e('hr')(),
    e('p')('some body copy here, what good is a site without content?')
).render(document.body)

```
Which renders out the following within the body tag:
```html
<div class="main-container">
    <h1 class="hdg-1">Main site heading</h1>
    <hr>
    <p>some body copy here, what good is a site without content?</p>
</div>

```
And that definitely works, but it defeats the overall goal of simplicity of syntax.
This is the syntactically preferred way to complete the same task:
```javascript
import { e } from 'ele-mint'
const div = e('div'),
    h1 = e('h1'),
    hr = e('hr'),
    p = e('p')

div({class: 'main-container'},
    h1({class: 'hdg-1'}, 'Main site heading'),
    hr(),
    p('some body copy here, what good is a site without content?')
).render(document.body)
```

#### Example with events: 
Events with eleMint are also very simple, but will be discussed in future commits.

#### Examples building Component 
Component examples and discussion will also be a fast follower.


