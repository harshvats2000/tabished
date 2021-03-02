let badTabs = new Set();
let activeTabId;
let timers = {};
var user_preferences = [
  {
    url: 'https://www.google.com/search?q=',
    time: 3,
  },
  {
    url: 'https://www.youtube.com',
    time: 3,
  },
];

chrome.storage.sync.get(['key'], function (result) {
  let default_user_preferences = user_preferences;
  user_preferences = result.user_preferences || default_user_preferences;
});

setInterval(() => {
  chrome.tabs.query({ currentWindow: true, active: true }, (activeTab) => {
    let inactiveTabs = new Set(badTabs);
    inactiveTabs.delete(activeTabId);
    chrome.runtime.sendMessage({
      badTabs: [...inactiveTabs],
      user_preferences,
    });
  });
}, 100);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    if (isBadTab(tab)) {
      console.log('added to bad tab.');
      badTabs.add(tabId);
    } else if (badTabs.has(tabId)) {
      console.log(`removed from bad tab\ntimer removed for ${tabId}`);
      clearTimeout(timers[tabId]);
      badTabs.delete(tabId);
    }
  }
});

function isBadTab(tab) {
  const urls = user_preferences.map((preference) => preference.url);
  if (urls.filter((url) => tab.url.indexOf(url) !== -1).length) return 1;
  else return 0;
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  if (badTabs.has(activeInfo.tabId) && badTabs.has(activeTabId)) {
    console.log(`bad to other\ntimer starts for ${activeTabId}`);
    deleteTab(activeTabId);
    console.log(`timer removed for ${activeInfo.tabId}`);
    clearTimeout(timers[activeInfo.tabId]);
  } else if (badTabs.has(activeInfo.tabId) && !badTabs.has(activeTabId)) {
    console.log(`other to bad.\ntimer removed for ${activeInfo.tabId}`);
    clearTimeout(timers[activeInfo.tabId]);
  } else if (!badTabs.has(activeInfo.tabId) && badTabs.has(activeTabId)) {
    console.log(`bad to other\ntimer starts for ${activeTabId}`);
    deleteTab(activeTabId);
  } else console.log('other to other');
  activeTabId = activeInfo.tabId;
  console.log({ activeTabId });
});

chrome.tabs.onRemoved.addListener((tabId, closed_tab_info) => {
  if (badTabs.has(tabId)) {
    console.log(`bad to other\ntimer removed for ${tabId}`);
    clearTimeout(timers[tabId]);

    badTabs.delete(tabId);
  } else console.log('other tab is closed.');
});

const deleteTab = (tabId) => {
  chrome.tabs.get(tabId, (tab) => {
    let arr = user_preferences[searchUrlInPreferences(tab.url)];

    timers[tabId] = setTimeout(() => {
      chrome.tabs.remove([tabId], () => console.log(`${tabId} tab is deleted.`));
    }, arr.time * 1000);
  });
};

function searchUrlInPreferences(url) {
  for (var i = 0; i < user_preferences.length; i++) {
    if (url.indexOf(user_preferences[i].url) !== -1) return i;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'SAVE_USER_PREFERENCES') {
    chrome.storage.sync.set({ user_preferences: request.user_preferences }, function () {});
  }
  if (request.msg === 'ADD_NEW_URL') {
    chrome.storage.sync.set({ user_preferences: [...user_preferences, request.data] }, function () {});
  }
  if (request.msg === 'REMOVE_URL') {
    let index = searchUrlInPreferences(request.data.url);
    chrome.storage.sync.set({ user_preferences: user_preferences.splice(index, 1) }, function () {});
  }
  sendResponse(true);
});

// Listen to storage changes
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (var key in changes) {
    var storageChange = changes[key];
    user_preferences = storageChange.newValue;
  }
});
