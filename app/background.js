// 
'use strict'

// Fetch selction from contextMenu
chrome.contextMenus.create({
  "title": "Translate",
  "contexts": [ 'selection' ],
  'onclick': fetchSelection
})

function fetchSelection ({ selectionText }) {
  sendMessage(selectionText)
}

// Listen to keyboard shortcuts
chrome.commands.onCommand.addListener(command => {
  sendMessage('__empty__', 'toggleDialog')
})

// Open popup on icon click
chrome.browserAction.onClicked.addListener(tab => 
  sendMessage('__empty__', 'toggleDialog'))

// Talk to the DOM
function sendMessage (selectionText, action = 'openDialog') {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: action,
      word: selectionText
    })
  })
}