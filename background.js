let badTabs = new Set();
let activeTabId;
let timers = {};
var user_preferences = [
  {
    url: 'https://www.google.com/search?q=',
    time: 3,
  },
];

// Get user_preferences from cloud if stored
chrome.storage.sync.get(['user_preferences'], function (result) {
  user_preferences = result.user_preferences || user_preferences;
});

// Keep sending message to popup at a regular interval
setInterval(() => {
  chrome.tabs.query({ currentWindow: true, active: true }, (activeTab) => {
    // All bad tabs are inactive tabs except the one which is active
    let inactiveTabs = new Set(badTabs);
    inactiveTabs.delete(activeTabId);
    chrome.runtime.sendMessage({
      inactiveTabs: [...inactiveTabs],
      user_preferences,
    });
  });
}, 100);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if url exists before sending it to isBadTab function
  if (tab.url) {
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
  let last_active_tabId = activeTabId;
  is_bad_tab = badTabs.has(activeInfo.tabId);
  was_bad_tab = badTabs.has(last_active_tabId);

  bad_to_bad = was_bad_tab && is_bad_tab;
  other_to_bad = !was_bad_tab && is_bad_tab;
  bad_to_other = was_bad_tab && !is_bad_tab;

  if (bad_to_bad) {
    console.log(`bad to bad\ntimer starts for ${last_active_tabId}`);
    startTimer(last_active_tabId);
    console.log(`timer removed for ${activeInfo.tabId}`);
    clearTimeout(timers[activeInfo.tabId]);
  } else if (other_to_bad) {
    console.log(`other to bad.\ntimer removed for ${activeInfo.tabId}`);
    clearTimeout(timers[activeInfo.tabId]);
  } else if (bad_to_other) {
    console.log(`bad to other\ntimer starts for ${last_active_tabId}`);
    startTimer(last_active_tabId);
  } else console.log('other to other');
  activeTabId = activeInfo.tabId;
  console.log({ activeTabId });
});

chrome.tabs.onRemoved.addListener((tabId, closed_tab_info) => {
  if (badTabs.has(tabId)) {
    console.log(`bad tab ${tabId} closed.`);
    badTabs.delete(tabId);
  } else console.log('other tab is closed.');
});

const startTimer = (tabId) => {
  chrome.tabs.get(tabId, (tab) => {
    let arr = user_preferences[getIndexFromUrl(tab.url)];

    timers[tabId] = setTimeout(() => {
      chrome.tabs.remove([tabId], () => console.log(`${tabId} tab is deleted.`));
    }, arr.time * 1000);
  });
};

function getIndexFromUrl(url) {
  for (var i = 0; i < user_preferences.length; i++) {
    if (url.indexOf(user_preferences[i].url) !== -1) return i;
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.msg) {
    case 'SAVE_USER_PREFERENCES':
      chrome.storage.sync.set({ user_preferences: request.user_preferences }, function () {
        console.log('Saved successfully.');
      });
      break;
    case 'ADD_NEW_URL':
      chrome.storage.sync.set({ user_preferences: [...user_preferences, request.data] }, function () {
        console.log('Added successfully.');
      });
      break;
    case 'REMOVE_URL':
      let index = getIndexFromUrl(request.data.url);
      user_preferences.splice(index, 1);
      chrome.storage.sync.set({ user_preferences: user_preferences }, function () {
        console.log('removed successfully.');
      });
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
