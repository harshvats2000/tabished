const console = chrome.extension.getBackgroundPage()?.console;
const d = document;

let last_user_preferences;

function areObjectsEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2) ? true : false;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Show number of inactive tabs
  d.querySelector('#inactive_tabs').innerHTML = request.inactiveTabs.length || 0;

  const { user_preferences } = request;

  // msg will keep coming in regular intervals but move ahead only if there is real change
  if (!areObjectsEqual(user_preferences, last_user_preferences)) {
    d.querySelector('#user_pref').innerHTML = '';

    for (let i = 0; i < user_preferences.length; i++) {
      let node = d.createElement('li');

      let url_node = d.createElement('p');
      url_node.classList.add('url');
      let url_text_node = d.createTextNode(user_preferences[i].url);
      url_node.appendChild(url_text_node);
      node.appendChild(url_node);

      let time_node = d.createElement('input');
      time_node.classList.add('time');
      time_node.value = user_preferences[i].time;
      node.appendChild(time_node);

      let remove_node = d.createElement('button');
      remove_node.classList.add('remove_btn');
      remove_node.onclick = () => removeUrl(user_preferences[i]);
      remove_node.appendChild(d.createTextNode('Remove'));
      node.appendChild(remove_node);

      d.querySelector('#user_pref').appendChild(node);
    }
  }

  last_user_preferences = user_preferences;
  sendResponse(true);
});

function removeUrl({ url, time }) {
  chrome.runtime.sendMessage({ msg: 'REMOVE_URL', data: { url: url, time: time } }, () => {});
}

let add_btn = d.querySelector('#add');
add_btn.addEventListener('click', (e) => {
  let new_url = d.querySelector('#new_url');
  let new_time = d.querySelector('#new_time');
  if (new_url.value !== '' && new_time.value !== '') {
    chrome.runtime.sendMessage({ msg: 'ADD_NEW_URL', data: { url: new_url.value, time: new_time.value } }, () => {
      // Empty the inputs and change styling
      new_url.value = '';
      new_time.value = '';
      add_btn.innerHTML = 'ADDED';
      add_btn.style.backgroundColor = 'green';
      add_btn.style.color = 'white';
      setTimeout(() => {
        add_btn.innerHTML = 'ADD WEBSITE';
        add_btn.style.backgroundColor = 'lightgray';
        add_btn.style.color = 'black';
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
    save_btn.style.backgroundColor = 'green';
    save_btn.style.color = 'white';
    setTimeout(() => {
      save_btn.innerHTML = 'SAVE';
      save_btn.style.backgroundColor = 'lightgray';
      save_btn.style.color = 'black';
    }, 1000);
  });
});
