chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getToken') {
    chrome.storage.sync.get(request.key, (result) => {
      if (result[request.key]) {
        sendResponse({ success: true, token: result[request.key] })
      }
      else {
        sendResponse({ success: false, error: 'Token not found' })
      }
    })
  }
  return true
})
