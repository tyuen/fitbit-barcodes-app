import {outbox} from "file-transfer";
import {settingsStorage as store} from "settings";
import {peerSocket} from "messaging";
import {me} from "companion";

var cards = [];
var bright = false;

function trim(s) {
  return (s.charAt && s.charAt(0) === '"') ? s.substr(1, s.length - 2) : s;
}

peerSocket.onmessage = e => {
  if(e.data && e.data.getAll) sendAll();
};

store.onchange = e => {
  setCard(e.key, e.newValue);
  sendAll();
};

function setCard(name, value) {
  let i = name.substr(-1);  //e.g., code1,color1
  if(/^\d+$/.test(i)) {
    i = i*1 - 1;
    if(!cards[i]) cards[i] = {};
    name = name.substr(0, name.length - 1);

    if(name === "name" || name === "code") {
      value = JSON.parse(value).name;
    } else if(name === "color") {
      value = trim(value);
    } else if(name === "type") {
      value = JSON.parse(value).selected[0];
    }
    cards[i][name] = value;

  } else if(name === "bright") {
    bright = (value === "true");
  }
}

function init() {
  for(let i = store.length - 1; i >= 0; i--) {
    let k = store.key(i);
    setCard(k, store.getItem(k));
  }

  if(me.launchReasons.settingsChanged) sendAll();
}

init();

function sendAll() {
  let tmp = [];
  for(let i = 0; i < cards.length; i++) {
    if(cards[i].code) {
      let o = {code: cards[i].code};
      if(cards[i].name) o.name = encodeURIComponent(cards[i].name);
      if(cards[i].color) o.color = cards[i].color;
      if(cards[i].type) o.type = cards[i].type;
      tmp.push(o);
    }
  }
  tmp = JSON.stringify({cards: tmp, bright: bright});
  let data = new Uint8Array(tmp.length);
  for (let i = 0; i < data.length; i++) {
    data[i] = tmp.charCodeAt(i);
  }
  console.log("sent");
  outbox.enqueue("settings.txt", data);
}
