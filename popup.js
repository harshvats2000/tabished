const console = chrome.extension.getBackgroundPage()?.console;
const d = document;

let last_user_preferences;

function areObjectsEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2) ? true : false;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { inactiveTabs, user_preferences } = request;

  // msg will keep coming in regular intervals but move ahead only if there is real change
  if (!areObjectsEqual(user_preferences, last_user_preferences)) {
    // Show number of inactive tabs
    d.querySelector('#inactive_tabs').innerHTML = inactiveTabs.length || 0;

    d.querySelector('#user_pref').innerHTML = '';

    let list_node = d.createElement('li');

    for (let i = 0; i < user_preferences.length; i++) {
      // Create para element to show url
      createUrlNode(user_preferences[i].url, list_node);

      // Create input element to show and edit time
      createTimeNode(user_preferences[i].time, list_node);

      // Create button element to remove a user preference
      createRemoveBtnNode(user_preferences[i], list_node);
    }
    d.querySelector('#user_pref').appendChild(list_node);
  }

  last_user_preferences = user_preferences;

  sendResponse(true);
});

function createUrlNode(url, list_node) {
  let node = d.createElement('p');
  node.classList.add('url');
  let url_text_node = d.createTextNode(url);
  node.appendChild(url_text_node);
  list_node.appendChild(node);
}

function createTimeNode(time, list_node) {
  let node = d.createElement('input');
  node.classList.add('time');
  node.value = time;
  list_node.appendChild(node);
}

function createRemoveBtnNode(data, list_node) {
  let node = d.createElement('button');
  node.classList.add('remove_btn');
  node.onclick = () => removeUrl(data);
  node.appendChild(d.createTextNode('Remove'));
  list_node.appendChild(node);
}

function removeUrl({ url, time }) {
  chrome.runtime.sendMessage({ msg: 'REMOVE_URL', data: { url: url, time: time } }, () => {});
}

let add_btn = d.querySelector('#add');
add_btn.addEventListener('click', (e) => {
  let new_url = d.querySelector('#new_url');
  let new_time = d.querySelector('#new_time');
  let data = {
    url: new_url.value,
    time: new_time.value,
  };

  if (new_url.value !== '' && new_time.value !== '') {
    chrome.runtime.sendMessage({ msg: 'ADD_NEW_URL', data: data }, () => {
      // Empty the inputs and change styling
      new_url.value = '';
      new_time.value = '';
      add_btn.innerHTML = 'ADDED';
      add_btn.classList.add('show_success_msg');

      setTimeout(() => {
        add_btn.innerHTML = 'ADD WEBSITE';
        add_btn.classList.remove('show_success_msg');
      }, 1000);
    });
  }
});

let save_btn = d.querySelector('#save');
save_btn.addEventListener('click', (e) => {
  let urls = d.querySelectorAll('.url');
  let time = d.querySelectorAll('.time');
  let data = [];

  for (let i = 0; i < urls.length; i++) {
    data.push({ url: urls[i].innerText, time: time[i].value });
  }

  chrome.runtime.sendMessage({ msg: 'SAVE_USER_PREFERENCES', user_preferences: data }, () => {
    save_btn.innerHTML = 'GOT IT!';
    save_btn.classList.add('show_success_msg');

    setTimeout(() => {
      save_btn.innerHTML = 'SAVE';
      save_btn.classList.remove('show_success_msg');
    }, 1000);
  });
});
