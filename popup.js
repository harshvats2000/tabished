chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  document.querySelector('#msg').innerHTML = (request.badTabs.length || 0) + ' inactive tabs.';
});

// chrome.storage.onChanged.addListener((changes, namespace) => {
//   console.log(changes, namespace);
// });
