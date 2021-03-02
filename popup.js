const console = chrome.extension.getBackgroundPage()?.console;

let last_user_preferences;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  document.querySelector('#inactive_tabs').innerHTML = request.badTabs.length || 0;
  const { user_preferences } = request;

  if (JSON.stringify(last_user_preferences) !== JSON.stringify(user_preferences)) {
    document.querySelector('#user_pref').innerHTML = '';

    for (let i = 0; i < user_preferences.length; i++) {
      let node = document.createElement('li');

      let url_node = document.createElement('p');
      url_node.classList.add('url');
      url_node.setAttribute('row_no', i);
      url_node.style.display = 'inline-block';
      url_node.style.marginRight = '15px';
      let url_text_node = document.createTextNode(user_preferences[i].url);
      url_node.appendChild(url_text_node);
      node.appendChild(url_node);

      let time_node = document.createElement('input');
      time_node.classList.add('time');
      time_node.setAttribute('row_no', i);
      time_node.value = user_preferences[i].time;
      node.appendChild(time_node);

      let remove_node = document.createElement('button');
      remove_node.classList.add('remove_btn');
      remove_node.setAttribute('row_no', i);
      remove_node.onclick = () => removeUrl(user_preferences[i]);
      remove_node.appendChild(document.createTextNode('Remove'));
      node.appendChild(remove_node);

      document.querySelector('#user_pref').appendChild(node);
    }
  }

  last_user_preferences = user_preferences;
  sendResponse(true);
});

function removeUrl({ url, time }) {
  chrome.runtime.sendMessage({ msg: 'REMOVE_URL', data: { url: url, time: time } }, () => {
    console.log('removed successfully.');
  });
}

let add_btn = document.querySelector('#add');
add_btn.addEventListener('click', (e) => {
  let new_url = document.querySelector('#new_url');
  let new_time = document.querySelector('#new_time');
  if (new_url.value !== '' && new_time.value !== '') {
    chrome.runtime.sendMessage({ msg: 'ADD_NEW_URL', data: { url: new_url.value, time: new_time.value } }, () => {
      console.log('Added successfully.');
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

let save_btn = document.querySelector('#save');
save_btn.addEventListener('click', (e) => {
  let urls = document.querySelectorAll('.url');
  let time = document.querySelectorAll('.time');
  let data = [];
  for (let i = 0; i < urls.length; i++) {
    data.push({ url: urls[i].innerText, time: time[i].value });
  }
  chrome.runtime.sendMessage({ msg: 'SAVE_USER_PREFERENCES', user_preferences: data }, () => {
    console.log('Saved successfully.');
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
