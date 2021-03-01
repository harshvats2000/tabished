let badTabs = new Set();
let activeTabId;
let timers = {};
const INACTIVE_TIME = 10 * 1000;

setInterval(() => {
  chrome.tabs.query({ currentWindow: true, active: true }, (activeTab) => {
    let inactiveTabs = new Set(badTabs);
    inactiveTabs.delete(activeTabId);
    chrome.runtime.sendMessage({
      badTabs: [...inactiveTabs],
    });
  });
}, 500);

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
  timers[activeTabId] = setTimeout(() => {
    chrome.tabs.remove([tabId], () => console.log(`${tabId} tab is deleted.`));
  }, INACTIVE_TIME);
};

const isBadTab = (tab) => {
  if (tab.url.indexOf('https://www.google.com/search?q=') === 0) return 1;
  else return 0;
};
