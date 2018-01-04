import {outbox} from "file-transfer";
import {settingsStorage as store} from "settings";
import {me} from "companion";

var cards = [];

function trim(s) {
  return (s.charAt && s.charAt(0) === '"') ? s.substr(1, s.length - 2) : s;
}

store.onchange = e => {
  setCard(e.key, e.newValue);
  sendAll();
};

function setCard(name, value) {
  let i = name.substr(-1)*1 - 1;  //e.g., code1,color1
  if(!cards[i]) cards[i] = {};
  name = name.substr(0, name.length - 1);

  if(name === "name" || name === "code") {
    value = JSON.parse(value).name;
  } else if(name === "color") {
    value = trim(value);
  }
  cards[i][name] = value;
}

function init() {
  for(let i = store.length - 1; i >= 0; i--) {
    let k = store.key(i);
    setCard(k, store.getItem(k));
  }

  if(me.launchReasons.settingChanged) sendAll();
}

init();

function sendAll() {
  let tmp = [];
  for(let i = 0; i < cards.length; i++) {
    if(cards[i].code) {
      let o = {code: cards[i].code};
      if(cards[i].name) o.name = encodeURIComponent(cards[i].name);
      if(cards[i].color) o.color = cards[i].color;
      tmp.push(o);
    }
  }
  tmp = JSON.stringify({cards: tmp});
  let data = new Uint8Array(tmp.length);
  for (let i = 0; i < data.length; i++) {
    data[i] = tmp.charCodeAt(i);
  }
  console.log("sending data");
  outbox.enqueue("settings.txt", data);
}
