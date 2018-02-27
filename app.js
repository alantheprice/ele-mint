import { e, register, override, getHandle} from 'ele-mint' //'./src/eleMint.js'
let section = register('section'),
  button = register('button'),
  div = register('div'),
  h1 = register('h1'),
  h2 = register('h2'),
  h3 = register('h3'),
  h4 = register('h4'),
  hr = register('hr'),
  ol = register('ol'),
  li = register('li'),
  input = register('input'),
  p = register('p'),
  pre = register('pre'),
  code = register('code'),
  style = register('style'),
  fSection = getSectionComponent(),
  virtual = getVirtualComponent(),
  eventual = getOverrideEventCompoent(),
  showingContent = true

addStyles()
init()

function init() {
  div({class: 'container', ':id': 'parent'},
    div({':id': 'pageContent'},
      h1('Pitifully styled page'),
      h2('Do go to the store'),
      h3('Do not pass go'),
      input({
          type: 'text', 
          placeholder: 'something', 
          oninput: (ev, elem) => getHandle('head').elem.textContent = elem.value
      }),
      h4({':id': 'head'}, 'Do update this text with the ^ input'),
      div({':id': 'removable', class: 'removable-container'},
        h3('Do not collect 300 dollars'),
        button({':id': 'removableChild', onclick: removeParent
      }, 'Remove my parent')
      ),
      hr(),
      ol(
        ['Item one', 'Item two','Item three','Item 4'].map((val) => li(val)),
        li('one additional Item'),
        li('second additional item')
      ),
      hr(),
      eventual({onbeawesome: (ev) => {
        alert('But I already am awesome')
      }}, 'some awesome eventing here'),
      virtual({logThis: 'this is a virtual element created without an element node'},
        div('This element will be added to the dom without the virtual parent, but could be processed by the virtual parent')
      ),
      h2('A couple of sections registered as components'),
      hr(),
      fSection({
          title: 'Some Great title here', 
          body: 'Got to have some body text', 
          footer: 'you know you have to have a footer'
      }),
      fSection({
          title: 'Secondary Title', 
          body: 'this body should be stouter', 
          footer: 'another lame footer'
      }),
      p("Neutra flexitarian 3 wolf moon fanny pack actually distillery DIY chillwave High Life raw denim synth chambray pug typewriter XOXO yr artisan put a bird on it organic letterpress direct trade  American Apparel semiotics cliche farm-to-table cardigan mustache Williamsburg roof party Carles Shoreditch tote bag Odd Future keffiyeh readymade iPhone Banksy paleo hoodie umami authentic narwhal fap dreamcatcher forage kogi wolf cornhole mixtape wayfarers Pinterest skateboard brunch blog disrupt Intelligentsia post-ironic fixie selvage craft beer quinoa pop-up aesthetic vinyl retro Etsy gentrify sustainable banjo whatever try-hard trust fund butcher lo-fi next level pickled leggings flannel cray Cosby sweater deep v Helvetica mumblecore meggings beard heirloom viral sartorial small batch tattooed vegan biodiesel four loko chia art party Tonx fingerstache +1 PBR&B you probably haven't heard of them pour-over plaid mlkshk seitan keytar freegan bespoke cred Bushwick swag ennui literally jean shorts Brooklyn meh slow-carb YOLO Truffaut VHS food truck crucifix Blue Bottle street art hella messenger bag tousled PBR kitsch sriracha 8-bit Tumblr Pitchfork gastropub Echo Park kale chips tofu ethical irony salvia gluten-free selfies church-key shabby chic stumptown before they sold out scenester hashtag ugh Marfa single-origin coffee fashion axe pork belly Godard asymmetrical photo booth bicycle rights twee Schlitz normcore master cleanse locavore Wes Anderson drinking vinegar banh mi Vice 90's Kickstarter Thundercats occupy Portland lomo squid bitters Austin polaroid McSweeney's"),
      e('span')('you could also define an element with this way.'),
      e('br')(),
    ),
    button({onclick: (ev, el) => {
      showingContent = !showingContent
      showTheCode(el, showingContent)
    }}, 'So, You want to see the code?')
  ).render(document.body)
}

function removeParent() {
  let childExists = getHandle('removableChild') ? 'child reference exists' : 'child reference is gone'
  getHandle('removable').remove()
  console.log(getHandle('removable'))
  let childStillExists = getHandle('removableChild') ? 'child reference exists' : 'child reference is gone'
  console.log([childExists, 'after parent removal', childStillExists].join(', '))
}

function getSectionComponent() {

  let customRegister = override({
    setAttribute: (el, name, val) => {
      console.log('set that attribute')
      el.setAttribute(name, val)
    },
    setProp: (el, name, val) => {
      console.log('set the props')
      el[name] = val
    },
    addEventListener: (el, name, handler) => {
      console.log('Adding event listener')
      el.addEventListener(name, (ev) => handler(ev, el))
    }
  })
  let cDiv = customRegister('div')
  let cH3 = customRegister('h3')
  let cP = customRegister('p')
  let cButton = customRegister('button')
  let cHr = customRegister('hr')

  /**
   * 
   * @returns {function({title: string, body: string, footer: string})}
   */
  return register('f-section', {
    processRender: (elementParent, def) => {
      // using symbol for uniqueness here to track instances.
      let handle = Symbol('fun-section-h3')
      let count = 0;
      return section(
        cH3({':id': handle},def.attr.title),
        cP(def.attr.body), 
        cDiv(def.attr.footer),
        cButton({onclick: (ev, elem) => {
            count++;
            getHandle(handle).elem.textContent = `Clicked: ${count} times`
            elem.textContent = 'oh, how nice, you clicked me! Again?'
        }}, 'Click me, Click me!'),
        cHr()
      ).render(elementParent)
    }
  })
}

function getVirtualComponent() {
  return register('virtual', {
    processRender: (elementParent, def) => {
      console.log(def.attr)
      def.children.forEach(child => child.render(elementParent))
      return elementParent
    }
  })
}

function getOverrideEventCompoent() {
  return register('div', {
    addEventListener: (elem, eventName, handler) => {
      // just for fun completely ignoring input event and doing our own thing
      // basically illustrating overriding a part of the rendering pipeline.
      elem.addEventListener('click', ev => handler(ev))
    }
  })
}

function showTheCode(elem, showingContent) {
  elem.textContent = (!showingContent)? 'Nah, lets go back' : 'So, You want to see the code?'
  if (!showingContent) {
    getHandle('pageContent').elem.style = 'display: none'
    if (getHandle('code')) {
      getHandle('code').elem.style = 'display: block'
      return
    }
    let theCodes = div({':id': 'code'},
      [{title: 'DOM building function', func: init},
       {title: 'Get Virtual Component:', func: getVirtualComponent},
       {title: 'Get Section Component:', func: getSectionComponent},
       {title: 'Get EventOverride Component', func: getOverrideEventCompoent}
      ].map((i) => {
        return getVirtualComponent()(
          div(i.title),
          pre(code(i.func.toString())),
          hr(),
          e('br')()
        )
      })
    ).render(getHandle('parent').elem)
  } else {
    getHandle('pageContent').elem.style = 'display: block'
    getHandle('code').elem.style = 'display: none'
  }
}

/**
 * It should be noted that this is definitely not the preferred pattern for doing styles, but eleMint allows it to work.  
 * And we are demoing options and features, not necessarily best practices. 
 * 
 */
function addStyles() {
  style(`
    body {
      margin: 0;
      font-family: Arial;
      color: rgb(40,40,50);
    }
    div { 
      margin-bottom: 10px; 
    }
    button {
      font-size: 1.1em;
      display: block;
      padding: 8px 22px;
      border-radius: 5px;
      background-color: rgb(80, 120, 200);
      color: #FFF;
      margin-bottom: 10px;
    }
    pre {
      background-color: rgb(220, 220, 220);
      padding: 20px 10px;
    }
    input {
      padding: 9px 20px;
      border-radius: 5px;
      outline: none;
    }
    .container {
      margin: 10px;
    }
    .removable-container {
      padding: 10px 20px;
      background-color: #999;
    }
  `).render(document.head)
}
