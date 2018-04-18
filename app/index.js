/* Barcodes app for Fitbit OS
Copyright (C) 2017  Terry Yuen

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/
import document from "document";
import {inbox} from "file-transfer";
import {display} from "display";
import {vibration} from "haptics";
import {peerSocket} from "messaging";
import fs from "fs";

var settings = {};
var lastClearedBars = 0;
var selected = 0;

var frgd = document.getElementById("frgd");
var barname = document.getElementById("caption");
var barcode = document.getElementById("barcode");
var bartext = document.getElementById("bartext");
var cNodes = new Array(15*11);
const WIDTH = document.getElementById("main").width;

function init() {
  for(let i = 0; i < 15; i++) {
    let n = document.getElementById(`n${i}`);
    for(let j = 0; j < 11; j++) {
      cNodes[i*11 + j] = n.getElementById(`b${j}`);
    }
  }

  try {
    settings = fs.readFileSync("settings.txt", "json");
  } catch(e) {
    peerSocket.onopen = () => {
      for(let o in settings) return;
      peerSocket.send({getAll: true});
    };    
  }

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
    bartext.text = setBarcode(item.code, item.type);
    display.autoOff = false;
    display.brightnessOverride = settings.bright ? 1 : undefined;
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
      bartext.text = setBarcode(item.code, item.type);
    }, 350);
  }
}

function pendingFiles() {
  let temp;
  while(temp = inbox.nextFile()) {
    vibration.start("nudge");
    display.poke();
    console.log("rcvd");
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

function setBarcode(str, type) {
  let data;
  try {
    if(type === 2) {
      data = toCode39(str);
    } else if(type === 1) {
      data = toCode128(str);      
    } else if(isEAN13(str)) {
      switch(str.length) {
        case 11: data = toEAN13("0" + str + getCheckDigit(str)); break;
        case 12: data = toEAN13("0" + str); break;
        default: data = toEAN13(str);
      }
    } else {
      data = toCode128(str);
    }
  } catch(e) {
    barcode.style.display = "none";
    return e;
  }
  
  let arr = data.arr;
  let sizes = data.sizes;
  let length = data.length;

  if(length > cNodes.length || length*2 > WIDTH - 20) {
    barcode.style.display = "none";
    return "Code too long!";
  }

  barcode.style.display = "inline";

  let w = Math.max(2, Math.floor(WIDTH/(length + 20)));

  if(length < lastClearedBars) {
    for(let i = lastClearedBars - 1; i >= length; i--) {
      cNodes[i].style.display = "none";
    }
  }
  lastClearedBars = length;
  
  let index = length - 1;

  for(let i = arr.length - 1; i >= 0; i--) {
    let block = arr[i];
    for(let j = sizes[i] - 1; j >= 0; j--) {
      let node = cNodes[index];
      if((block & 1) === 1) {
        node.style.display = "inline";
        node.width = w;
        node.x = index*w;
      } else {
        node.style.display = "none";
      }
      block >>= 1;
      index--;
    }
  }

  barcode.x = Math.floor((WIDTH - w*length)/2);
  return str;
}

function toCode39(str) {
  const codes = "a6dd2bb2bd95a6b" + //0~4
    "d35b35a5bd2db2d" +  //6~9
    "d4bb4bda5acbd65b65a9b" +  //abcdefg
    "d4db4dacdd53b53da9ad3" +  //hijklmn
    "d69b69ab3d59b59ad9cab" +  //opqrstu
    "9abcd596bcb59b5" + //vwxyz
    "96d9ad95b925a49cad929949";  //* -$%./+
  let arr = [2413];
  for(let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if(c >= 48 && c <= 57) {  //0~9
      c -= 48;
    } else if(c >= 65 && c <= 90) {  //A~Z
      c -= 55;
    } else {
      c = "* -$%./+".indexOf(str.charAt(i));
      if(c >= 0) {
        c = c + 36;
      } else throw "OOB";
    }
    arr.push(parseInt(codes.substr(c*3, 3), 16));
  }
  arr.push(arr[0]);
  
  let sizes = [];
  for(let i = arr.length - 1; i >= 0; i--) sizes[i] = 13;
  return {arr, sizes, length: arr.length*13};
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
  let sizes = new Array(arr.length - 1);
  for(let i = sizes.length - 1; i >= 0; i--) sizes[i] = 11;
  sizes.push(2);
  return {arr, sizes, length: (arr.length - 1)*11 + 2};
}

function isEAN13(str) {
  let len = str.length;
  if(/^[0-9]+$/.test(str)) {
    if(len === 11) return true;
    if(len === 12 && getCheckDigit(str.substr(0, 11)) === str.charAt(11)*1) return true;
    if(len === 13 && getCheckDigit(str.substr(0, 12)) === str.charAt(12)*1) return true;
  }
  return false;
}

function getCheckDigit(str) {
  let chk = 0;
  let len = str.length;
  let odd = (len % 2 === 1);
  for(let i = 0; i < len; i++) {
    chk += str.charAt(i)*(odd ? 3 : 1);
    odd = !odd;
  }
  return (10 - (chk % 10)) % 10;
}

function toEAN13(str) {
  const L = "0d19133d23312f3b370b";
  const R = "72666c425c4e50444874";
  const G = "27331b211d3905110917";
  const PAT = "00342c1c32260e2a1a16";
  let ptn = parseInt(PAT.substr(str.charAt(0)*2, 2), 16);
  
  let arr = [5];  //Start
  for(let i = 1; i < 7; i++) {
    arr.push(parseInt(((ptn & 1) === 1 ? G : L).substr(str.charAt(i)*2, 2), 16));
    ptn >>= 1;
  }
  arr.push(10);  //Middle
  for(let i = 7; i < 13; i++) {
    arr.push(parseInt(R.substr(str.charAt(i)*2, 2), 16));
  }
  arr.push(5);  //End
  let sizes = new Array(14);
  sizes[0] = 3;
  for(let i = sizes.length - 1; i > 0; i--) sizes[i] = 7;
  sizes[7] = 5;
  sizes.push(3);
  return {arr, sizes, length: 95};
}
