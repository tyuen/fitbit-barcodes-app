import document from "document";
import {inbox} from "file-transfer";
import {display} from "display";
import {vibration} from "haptics";
import fs from "fs";

var settings = {};

var selected = 0;

var frgd = document.getElementById("frgd");
var barname = document.getElementById("caption");
var barcode = document.getElementById("barcode");
var bartext = document.getElementById("bartext");
var cNodes = new Array(15);
const WIDTH = document.getElementById("main").width;

function init() {
  for(let i = 0; i < 15; i++) {
    cNodes[i] = new Array(12);
    let n = document.getElementById(`n${i}`);
    for(let j = 0; j < 11; j++) {
      cNodes[i][j] = n.getElementById(`b${j}`);
    }
    cNodes[i][11] = n;
  }

  try {
    settings = fs.readFileSync("settings.txt", "json");
  } catch(e) {}

  pendingFiles();
  inbox.onnewfile = pendingFiles;

  settingsChanged();

  document.onkeypress = onKeyPress;
}

init();

function settingsChanged() {
  let empty = !settings.cards || (settings.cards.length === 0);
  if(empty) {
    barname.text = "Barcodes";
    display.autoOff = true;
  } else {
    let item = settings.cards[0];
    barname.text = item.name || "";
    frgd.style.fill = item.color || "#12D612";
    bartext.text = item.code;
    setBarcode(item.code);
    display.autoOff = false;
    setTimeout(() => {display.autoOff = true}, 180000);
  }
  barcode.style.display = empty ? "none" : "inline";
  bartext.style.display = empty ? "none" : "inline";
  document.getElementById("intro").style.display = empty ? "inline" : "none";
}

var clickTimer;

function onKeyPress(e) {
  if(settings.cards) {
    let max = settings.cards.length;
    if(e.key === "up") {
      selected--;
      if(selected < 0) selected = max - 1;
    } else if(e.key === "down") {
      selected++;
      if(selected >= max) selected = 0;
    } else return;
  
    let item = settings.cards[selected];
    
    barname.text = item.name || "";
    frgd.style.fill = item.color || "#12D612";

    if(clickTimer) clearTimeout(clickTimer);

    clickTimer = setTimeout(() => {
      clickTimer = null;
      bartext.text = item.code;
      setBarcode(item.code);
    }, 350);
  }
}

function pendingFiles() {
  let temp;
  while(temp = inbox.nextFile()) {
    vibration.start("nudge");
    display.poke();
    console.log("settings recvd");
    settings = fs.readFileSync(temp, "json");
    fs.unlinkSync(temp);
    if(settings.cards) {
      for(let i = 0; i < settings.cards.length; i++) {
        let card = settings.cards[i];
        if(card.name) card.name = decodeURIComponent(card.name);
      }
    }
    fs.writeFileSync("settings.txt", settings, "json");
    settingsChanged();
  }
}

function setBarcode(str) {
  try {
    let arr = toCode128(str);
  } catch(e) {
    for(let i = 0; i < 15; i++) {
      let node = cNodes[i][11].style.display = "none";
    }
    bartext.text = e;
    return;
  }
  if(arr.length > 15) {
    for(let i = 0; i < 15; i++) {
      let node = cNodes[i][11].style.display = "none";
    }
    bartext.text = "Code too long!";
    return;
  }
  let w = Math.max(2, Math.floor(WIDTH/((arr.length - 1)*11 + 22)));
  let i = 0;
  for(; i < arr.length && i < 15; i++) {
    let val = arr[i].toString(2);
    let node = cNodes[i][11];
    node.style.display = "inline";
    node.width = w*11;
    node.x = w*11*i;
    let j = 0;
    for(; j < val.length; j++) {
      let b = cNodes[i][j];
      if(val.charCodeAt(j) === 49) {
        b.style.display = "inline";
        b.width = w;
        b.x = w*j;
      } else {
        b.style.display = "none";
      }
    }
    if(j < 11) {
      for(; j < 11; j++) {
        cNodes[i][j].style.display = "none";
      }
    }
  }
  if(i < 15) {
    for(; i < 15; i++) {
      cNodes[i][11].style.display = "none";
    }
  }
  barcode.x = Math.floor((WIDTH - w*((arr.length - 1)*11 + 2))/2);
}

function toCode128(str) {
  const codes = "6cc66c66649848c44c4c84c446464864462459c4dc4ce5cc4ec4e667265c64e"+
    "6e467476e74c72c7267647347326d86c66365184584465884684626886286225b858e46e5d"+
    "85c647677668e62e6e86e26ee75874671676876271a77a64278a53050c4b048642c4265905"+
    "844d04c24344326126507ba61447a53c4bc49e5e44f44f27a47947926de6f67b657851e45e"+
    "5e85e27a87a25de5ee75e7ae";

  let arr, chk, idx = 1;
  if(str.length < 4 || /[^0-9]/.test(str)) {
    arr = [1680];  //Start B
    chk = 104;  //Pos of Start B
    for(let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i) - 32;
      if(c < 0 || c > 94) throw "OOB";
      arr.push(parseInt(codes.substr(c*3, 3), 16));
      chk += c*idx++;
    }
  } else {
    arr = [1692];  //Start C
    chk = 105;  //Pos of Start C
    let len = str.length;
    if(len % 2 === 1) len--;  //digits encoded in pairs (00~99)
    for(let i = 0; i < len; i += 2) {
      let c = parseInt(str.substr(i, 2), 10);
      arr.push(parseInt(codes.substr(c*3, 3), 16));
      chk += c*idx++;
    }
    if(len < str.length) {
      arr.push(1518);  //Switch to B
      let c = str.charCodeAt(len) - 32;
      if(c < 16 || c > 25) throw "NaN";  //ascii range "0"~"9"
      arr.push(parseInt(codes.substr(c*3, 3), 16));
      chk += 100*(idx++) + c*idx++;
    }
  }
  arr.push(parseInt(codes.substr((chk % 103)*3, 3), 16));
  arr.push(1594);  //Stop
  arr.push(3);
  return arr;
}
