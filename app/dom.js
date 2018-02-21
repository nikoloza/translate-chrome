'use strict'

const API = "https://arcane-taiga-34447.herokuapp.com"
let dialogStatus = false

// Apply DOM root object
var rootDOM = document.createElement('dialog')
rootDOM.classList.add('translate_ge_dialog')
window.onload = () => {
  document.body.appendChild(rootDOM)
}

// Receive Chrome background message
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openDialog') openDialog(request.word)
  if (request.action === 'toggleDialog') 
    dialogStatus ? closeDialog() : openDialog(request.word)
  console.log(request.action, request.word)
})

// Templates
const HEADER_TEMPLATE = `
  <header>
    <input placeholder="Word" value="{keyword}"/> 
    <span>×</span>
  </header>
`
const BODY_TEMPLATE = `
  <section>
    <img src="${chrome.extension.getURL("assets/loading.gif")}">
  </section>
`
const ROW_TEMPLATE = `
  <dt class="{language}"><strong>{key}</strong> - {value}</dt>
`
const FOOTER_TEMPLATE = `<footer>{content}</footer>`
const FOOTER_CONTENT_TEMPLATE = `
  Open in
  <a href="http://translate.ge/#search/{keyword}" target="_blank">
    <img src="${chrome.extension.getURL("assets/icon_32.png")}">
    Translate.ge
  </a>
  <a href="https://translate.google.com/#en/ka/{keyword}" target="_blank">
    <img src="${chrome.extension.getURL("assets/google_translate_32.png")}">
    Google Translate
  </a>
`
// Parsing symbols
const TEXT_SEPARATOR_TEMPLATE = ` <span class="separator">・</span> `
const TEXT_NUMERIC_TEMPLATE = ` <span class="numeric">$1</span> `
const TEXT_TYPE_TEMPLATE = ` <span class="type">$1</span> `
// Language templates
const TEXT_ENG_TEMPLATE = `<span class="eng">$1</span>`
const TEXT_GEO_TEMPLATE = `<span class="geo">$1</span>`

rootDOM.innerHTML = HEADER_TEMPLATE + BODY_TEMPLATE 
  + FOOTER_TEMPLATE.replace('{content}', FOOTER_CONTENT_TEMPLATE)

const HEADER = rootDOM.children[0]
const INPUT_FIELD = HEADER.children[0]
const CLOSE_BUTTON = HEADER.children[1]

const FOOTER = rootDOM.children[2]

// Open dialog
function openDialog (word) {
  let selection = checkSelection()
  if (!word && !selection) return
  else if (word === '__empty__' && selection) word = selection
  else if (word === '__empty__' || !word.replace(' ', '')) word = ''
  INPUT_FIELD.select()
  INPUT_FIELD.value = word
  updateContent(word)
  rootDOM.show()
  dialogStatus = true
}

// Close dialog
function closeDialog () {
  rootDOM.classList.add('fade_out')
  let t = window.setTimeout(() => {
    rootDOM.close()
    rootDOM.classList.remove('fade_out')
    dialogStatus = false
    window.clearTimeout(t)
  }, 320)
}

// Listeners
INPUT_FIELD.addEventListener('keyup', debounce(e => {
  if (INPUT_FIELD.value) updateContent(INPUT_FIELD.value)
}), 250)
CLOSE_BUTTON.addEventListener('click', closeDialog)
document.addEventListener('mouseup', updateSelection)

// Check if text is selected
function checkSelection () {
  var selection
  if (window.getSelection) 
    selection = window.getSelection()
  else if (document.selection) 
    selection = document.selection.createRange()
  if (selection && selection.toString() !== '') 
    return selection.toString()
}

function updateSelection () {
  if (!dialogStatus) return 
  openDialog(checkSelection())
}

// Value parsing
function templatingValue (value) {
  return value
    .replace(/([a-zA-Z\’\'\-]+)/g, TEXT_ENG_TEMPLATE)
    .replace(/([ა-ჰ\-]+)/g, TEXT_GEO_TEMPLATE)
    .replace(/(\;\s)/g, TEXT_SEPARATOR_TEMPLATE)
    .replace(/(\d)(\))/g, TEXT_NUMERIC_TEMPLATE)
    .replace(/(adverb|verbal|noun|verb|prefix|prepositional|preposition|adjective|plural|\{.+\})/g, 
      TEXT_TYPE_TEMPLATE)
}

// Update content
function updateContent (word) {
  if (!word) return
  fetchWord(word).then(({ rows }) => {
    let content
    if (rows && rows.length) {
      let newRows = rows.map(({ value }) => {
        return ROW_TEMPLATE
          .replace('{language}', value.DictName)
          .replace('{key}', value.Word)
          .replace('{value}', templatingValue(value.Text))
      }).join('')
      content = `<dl>${newRows}</dl>`
    } else {
      content = '<span class="no_results">No results</span>'
    }

    let body = rootDOM.children[1]
    body.innerHTML = content
  }).catch(error => console.error('Error:', error))

  updateFooter(word)
}

function updateFooter (word) {
  FOOTER.innerHTML = FOOTER_CONTENT_TEMPLATE
    .replace(/\{keyword\}/g, word)
}

// API
function fetchWord (word = 'apple') {
  return fetch(`${API}/${word}`)
    .then(body => body.json())
}

// Helper
function debounce (func, wait, immediate) {
	var timeout
	return function() {
		var context = this, args = arguments
		var later = function() {
			timeout = null
			if (!immediate) func.apply(context, args)
		}
		var callNow = immediate && !timeout
		clearTimeout(timeout)
		timeout = setTimeout(later, wait)
		if (callNow) func.apply(context, args)
	}
}