import * as THREE from 'three';
import {box, cyl, lathe, rbox, sph, tube} from './geo.js';
import {cv, glowCanvas, marbleCanvas, tex} from './tex.js';

var COS = { o: ["Tee", "Polo", "Blazer", "Hoodie", "Shirt + tie", "Varsity Jacket", "Tracksuit", "Tuxedo", "Leather Jacket", "Jersey", "Hawaiian Shirt", "Puffer Vest", "Gold Suit", "Flannel", "Denim Jacket", "Chef Jacket", "Camo Jacket", "Lab Coat", "Zebra Blazer", "Neon Grid Tee", "Flame Hoodie", "Checkered Racer", "Kimono Robe", "Money Print Shirt", "Galaxy Suit", "Royal Robe", "Astronaut Suit", "Holo Jacket", "Diamond Suit", "Cozy Sweater"], k: ["Crimson", "Black", "White", "Royal", "Emerald", "Gold", "Violet", "Orange", "Teal", "Tan", "Metallic Gold", "Chrome", "Gloss Black", "Neon Pink", "Neon Cyan", "Crimson Velvet", "Midnight Blue", "Lime", "Hot Pink", "Ice Blue", "Bronze", "Rose Gold", "Pearl", "Toxic Glow", "Obsidian", "Lava Glow", "Prismatic"], s: ["Skin 1", "Skin 2", "Skin 3", "Skin 4", "Skin 5", "Skin 6", "Solid Gold", "Diamond", "Bronze Statue", "Chrome", "Hologram", "Galaxy"], H: ["None", "Beanie", "Backwards Cap", "Bucket Hat", "Cowboy Hat", "Top Hat", "Headband", "Party Hat", "Grad Cap", "Viking Helmet", "Pirate Hat", "Halo", "Crown", "Diamond Crown", "Traffic Cone", "Beret", "Chef Hat", "Ninja Headband", "Propeller Cap", "Bunny Ears", "Fedora", "Santa Hat", "Devil Horns", "Gold Snapback", "Flower Crown", "Sombrero", "Wizard Hat", "Laurel Wreath", "Astronaut Helmet", "Hologram Halo", "Flame Crown"], B: ["None", "Bowtie", "Gold Watch", "Diamond Chain", "Mustache", "Aviators", "Angel Wings", "Hero Cape", "Backpack", "Gold Medal", "Balloon", "Neon Scarf", "Money Bag", "Shoulder Parrot", "Guitar on Back", "Butterfly Wings", "Jetpack", "Pet Drone", "Dragon Wings"], G: ["Standard", "Gold Headset", "Chrome Headset", "RGB Headset", "Cat-Ear Headset", "Neon Green Headset", "Wood & Brass Headset", "Carbon Pro Headset", "Flame Headset", "Diamond Headset"], D: ["Walnut", "Black Marble", "Carbon Fiber", "Gold Trim", "RGB Neon", "Glass", "Diamond", "Butcher Block", "White Marble", "Rose Gold Desk", "Money Print Desk", "Neon Grid Desk", "Lava Rock", "Crystal Ice", "Hologram Desk"], C: ["Holo Panel", "Dual Monitors", "Triple Monitors", "Curved Ultrawide", "Gaming Rig", "Trading Desk", "Gold Laptop", "Basic Laptop", "Retro CRT", "Rose Gold Laptop", "Quad Monitors", "Wall of Screens", "Holo Projector", "Command Center"], I: ["None", "Trophy", "Money Stack", "Lava Lamp", "Bobblehead", "Mini Bell", "Bonsai", "Champagne", "OWQ Neon Sign", "Coffee Mug", "Rubber Duck", "Cactus", "Spinning Globe", "Hourglass", "Mini Racer", "Gold Phone", "Newton's Cradle", "Mini Rocket", "Crystal Ball", "Fish Tank", "Disco Ball", "Diamond Bull"], R: ["Office Chair", "Gaming Chair", "Executive Chair", "Throne", "Wooden Stool", "Beanbag", "Racing Seat", "Egg Chair", "Massage Chair", "Cloud Chair", "Ice Throne"], T: ["None", "Dialer", "Closer", "Shark", "Hustler", "Top Gun", "Money Maker", "Legend", "The GOAT", "Rookie", "Grinder", "Night Owl", "Early Bird", "Phone Warrior", "Appointment Setter", "Policy Pro", "Deal Hunter", "Family Protector", "Objection Killer", "Rainmaker", "Unstoppable", "Million Dollar Mindset", "Agency Builder", "Hall of Fame", "The Franchise", "Final Boss"], N: ["Standard", "Gold Tag", "Neon Tag", "Flame Tag", "Diamond Tag", "Ice Tag", "Toxic Tag", "Matrix Tag", "Royal Tag", "Galaxy Tag", "Rainbow Tag"], E: ["Elevator", "Confetti Drop", "Fire Walk", "Spotlight", "Money Rain", "Lightning Strike", "Rose Petals", "Smoke Bomb", "Red Carpet", "Fireworks Show", "Teleport Beam", "Meteor Landing"], V: ["None", "Crimson Aura", "Gold Aura", "Fire Aura", "Lightning Aura", "Rainbow Aura", "Heart Aura", "Ice Aura", "Shadow Aura", "Money Aura", "Toxic Aura", "Galaxy Aura", "Solar Flare", "Void Aura"], F: ["None", "Trainer Prop", "Crop Duster", "Biplane", "Seaplane", "Bush Plane", "Twin Prop", "Aerobatic Racer", "Business Jet", "Delta Jet", "Jet Racer", "Space Plane", "Golden Jet"], J: ["None", "Water Blaster", "Foam Dart Pistol", "Cork Popper", "Foam Blaster Rifle", "Paintball Marker", "Bubble Blaster", "Laser Tag Pistol", "Laser Tag Rifle", "Confetti Cannon", "Neon Arc Blaster", "Gold Blaster", "Diamond Blaster"] };
var CREM = [["spin", "\uD83C\uDF00", "Spin Move"], ["shrug", "\uD83E\uDD37", "Shrug"], ["point", "☝️", "Point Up"], ["victory", "✌️", "Victory"], ["facepalm", "\uD83E\uDD26", "Facepalm"], ["heart", "\uD83E\uDEF6", "Heart Hands"], ["flex", "\uD83E\uDDBE", "Double Flex"], ["phone", "\uD83D\uDCDE", "Closing Call"], ["chefkiss", "\uD83E\uDD0C", "Chef's Kiss"], ["sway", "\uD83C\uDFB6", "Smooth Sway"], ["thinker", "\uD83E\uDDE0", "Big Brain"], ["moonwalk", "\uD83C\uDF19", "Moonwalk"], ["rain", "\uD83D\uDCB8", "Make It Rain"], ["crown", "\uD83D\uDC51", "Crown Yourself"], ["fireworks", "\uD83C\uDF86", "Fireworks Show"], ["lightning", "⚡", "Power Up"]];
var EXT = {};
/* Battle Pass emotes (in the order they unlock) and the signature emote parts */
const BPEM=[['dab','\u{1F60E}','Dab'],['salute','\u{1FAE1}','Salute'],['chestpound','\u{1F4AA}','Chest Pound'],['bow','\u{1F647}','Take a Bow'],['floss','\u{1F57A}','Floss'],
  ['robot','\u{1F916}','Robot'],['sprinkler','\u{1F4A6}','Sprinkler'],['griddy','\u{1F525}','Griddy'],['airguitar','\u{1F3B8}','Air Guitar'],['disco','\u{1FAA9}','Disco'],
  ['hypejump','\u{1F680}','Hype Jump'],['moneygun','\u{1F4B5}','Money Gun'],['micdrop','\u{1F3A4}','Mic Drop'],['belt','\u{1F3C6}','Champion Belt']];
var SIGM = ["wave", "clap", "cheer", "dance", "fire", "money", "laugh", "nod", "dab", "salute", "chestpound", "bow", "floss", "robot", "sprinkler", "griddy", "airguitar", "disco", "hypejump", "moneygun", "spin", "shrug", "point", "victory", "facepalm", "heart", "flex", "phone", "chefkiss", "sway", "thinker", "moonwalk", "rain", "crown", "fireworks", "lightning"];
const SIGE=['\u{1F525}','\u{1F4B0}','\u{1F3C6}','\u{1F680}','\u{1F451}','\u{1F48E}','\u{26A1}','\u{1F389}','\u{1F4AF}','\u{1F988}','\u{1F410}','\u{1F3AF}'];
const SIGP=['LET\'S GOOO','CLOSED IT','ONLY WINNERS','MONEY MOVES','NEXT!','EASY WORK','SIGNED & SEALED','CALL ME THE CLOSER','BUILT DIFFERENT','WE EAT','ANOTHER ONE','NO DAYS OFF'];
const SIGS=['Air horn','Cha-ching','Bell','Crowd cheer','Boom','Ding'];
const SIGSK=['airhorn','chaching','bell','crowd','boom','ding'];
var MKC = new Map;
function mk($, J) {
    let Q = MKC.get($);
    if (!Q)
      Q = J(), MKC.set($, Q);
    return Q;
  }
var SM = ($) => new THREE.MeshStandardMaterial($);
var PATC = {};
function patTex($) {
    if (PATC[$])
      return PATC[$];
    let J = 512, Q = cv(J, J), Z = Q.getContext("2d"), U = (() => {
      let K = 1234567;
      return () => {
        return K ^= K << 13, K >>>= 0, K ^= K >>> 17, K ^= K << 5, K >>>= 0, K / 4294967296;
      };
    })(), q = [1, 1], E = (K, V, X, W) => {
      Z.fillStyle = W, Z.beginPath();
      for (let H = 0;H <= 14; H++) {
        let N = H / 14 * 6.283, F = X * (0.7 + U() * 0.5);
        H ? Z.lineTo(K + Math.cos(N) * F, V + Math.sin(N) * F) : Z.moveTo(K + Math.cos(N) * F, V + Math.sin(N) * F);
      }
      Z.closePath(), Z.fill();
    };
    if ($ === "money") {
      Z.fillStyle = "#2f7a43", Z.fillRect(0, 0, J, J), Z.font = "900 64px Georgia", Z.textAlign = "center", Z.textBaseline = "middle";
      for (let K = 0;K < 6; K++)
        for (let V = 0;V < 6; V++)
          Z.save(), Z.translate(K * 90 + V % 2 * 45 + 20, V * 90 + 40), Z.rotate((U() - 0.5) * 0.6), Z.fillStyle = U() < 0.5 ? "#bfe8b8" : "#e3c45a", Z.fillText("$", 0, 0), Z.restore();
      Z.strokeStyle = "rgba(10,40,20,.35)", Z.lineWidth = 3;
      for (let K = 0;K < 9; K++)
        Z.strokeRect(K * 60 - 10, K % 3 * 170 + 10, 120, 52);
      q = [2, 1];
    } else if ($ === "grid") {
      Z.fillStyle = "#000", Z.fillRect(0, 0, J, J), Z.strokeStyle = "#19e6ff", Z.shadowColor = "#19e6ff", Z.shadowBlur = 10, Z.lineWidth = 4;
      for (let K = 0;K <= 8; K++)
        Z.beginPath(), Z.moveTo(K * 64, 0), Z.lineTo(K * 64, J), Z.stroke(), Z.beginPath(), Z.moveTo(0, K * 64), Z.lineTo(J, K * 64), Z.stroke();
      q = [3, 2];
    } else if ($ === "lava" || $ === "lavaE") {
      if (Z.fillStyle = $ === "lava" ? "#241815" : "#000", Z.fillRect(0, 0, J, J), $ === "lava")
        for (let K = 0;K < 220; K++)
          Z.fillStyle = `rgba(${50 + U() * 40 | 0},${30 + U() * 25 | 0},${25 + U() * 20 | 0},.5)`, E(U() * J, U() * J, 6 + U() * 22, Z.fillStyle);
      Z.strokeStyle = $ === "lava" ? "#ff6a1a" : "#ff7a20", Z.shadowColor = "#ff3a00", Z.shadowBlur = 14, Z.lineCap = "round";
      for (let K = 0;K < 22; K++) {
        let V = U() * J, X = U() * J;
        Z.lineWidth = 1.5 + U() * 4, Z.beginPath(), Z.moveTo(V, X);
        for (let W = 0;W < 7; W++)
          V += (U() - 0.5) * 90, X += (U() - 0.5) * 90, Z.lineTo(V, X);
        Z.stroke();
      }
      q = [2, 1];
    } else if ($ === "scan") {
      Z.fillStyle = "#000", Z.fillRect(0, 0, J, J);
      for (let K = 0;K < J; K += 8)
        Z.fillStyle = `rgba(80,230,255,${K % 32 ? 0.25 : 0.7})`, Z.fillRect(0, K, J, 2);
      q = [1, 3];
    } else if ($ === "camo")
      Z.fillStyle = "#5b6b3a", Z.fillRect(0, 0, J, J), ["#3c4a26", "#7d7a4c", "#2a2a1c", "#8f8a5e"].forEach((K) => {
        for (let V = 0;V < 26; V++)
          E(U() * J, U() * J, 20 + U() * 46, K);
      }), q = [2, 2];
    else if ($ === "flame") {
      let K = Z.createLinearGradient(0, J, 0, 0);
      K.addColorStop(0, "#ff3a00"), K.addColorStop(0.35, "#ff8a00"), K.addColorStop(0.6, "#140808"), K.addColorStop(1, "#0b0b0d"), Z.fillStyle = K, Z.fillRect(0, 0, J, J);
      for (let V = 0;V < 16; V++) {
        let X = V * 34 + U() * 20, W = 160 + U() * 190, H = Z.createLinearGradient(0, J, 0, J - W);
        H.addColorStop(0, "#ffd23a"), H.addColorStop(0.6, "#ff5a00"), H.addColorStop(1, "rgba(255,40,0,0)"), Z.fillStyle = H, Z.beginPath(), Z.moveTo(X - 26, J), Z.quadraticCurveTo(X - 30, J - W * 0.5, X + (U() - 0.5) * 30, J - W), Z.quadraticCurveTo(X + 28, J - W * 0.45, X + 26, J), Z.fill();
      }
    } else if ($ === "galaxy") {
      let K = Z.createRadialGradient(J * 0.4, J * 0.45, 10, J / 2, J / 2, J * 0.75);
      K.addColorStop(0, "#5a2ab8"), K.addColorStop(0.45, "#1d0f52"), K.addColorStop(1, "#04030c"), Z.fillStyle = K, Z.fillRect(0, 0, J, J);
      for (let V = 0;V < 9; V++) {
        let X = Z.createRadialGradient(U() * J, U() * J, 4, U() * J, U() * J, 120);
        X.addColorStop(0, ["rgba(255,80,200,.45)", "rgba(60,160,255,.45)", "rgba(160,90,255,.4)"][V % 3]), X.addColorStop(1, "rgba(0,0,0,0)"), Z.fillStyle = X, Z.fillRect(0, 0, J, J);
      }
      for (let V = 0;V < 420; V++) {
        let X = U() < 0.94 ? U() * 1.4 + 0.3 : 2.4;
        Z.fillStyle = `rgba(255,255,255,${0.4 + U() * 0.6})`, Z.beginPath(), Z.arc(U() * J, U() * J, X, 0, 6.283), Z.fill();
      }
      q = [2, 1];
    } else if ($ === "zebra") {
      Z.fillStyle = "#f4f4f2", Z.fillRect(0, 0, J, J), Z.fillStyle = "#111";
      for (let K = 0;K < 18; K++) {
        let V = K * 30 + U() * 8;
        Z.beginPath(), Z.moveTo(0, V);
        for (let X = 0;X <= J; X += 24)
          Z.lineTo(X, V + Math.sin(X * 0.02 + K) * 16 + U() * 6);
        for (let X = J;X >= 0; X -= 24)
          Z.lineTo(X, V + 9 + Math.sin(X * 0.02 + K + 0.6) * 16 + U() * 5);
        Z.fill();
      }
      q = [2, 2];
    } else if ($ === "plaid") {
      Z.fillStyle = "#ffffff", Z.fillRect(0, 0, J, J), Z.fillStyle = "rgba(0,0,0,.55)";
      for (let K = 0;K < J; K += 64)
        Z.fillRect(K, 0, 26, J), Z.fillRect(0, K, J, 26);
      Z.fillStyle = "rgba(0,0,0,.25)";
      for (let K = 36;K < J; K += 64)
        Z.fillRect(K, 0, 6, J), Z.fillRect(0, K, J, 6);
      q = [3, 2];
    } else if ($ === "denim") {
      Z.fillStyle = "#ffffff", Z.fillRect(0, 0, J, J);
      for (let K = 0;K < 4000; K++)
        Z.fillStyle = `rgba(0,0,40,${U() * 0.18})`, Z.fillRect(U() * J, U() * J, 1 + U() * 3, 1);
      for (let K = 0;K < J; K += 4)
        Z.fillStyle = "rgba(255,255,255,.08)", Z.fillRect(0, K, J, 1);
      q = [4, 3];
    } else if ($ === "check") {
      let V = J / 8;
      for (let X = 0;X < 8; X++)
        for (let W = 0;W < 8; W++)
          Z.fillStyle = (X + W) % 2 ? "#111" : "#f4f4f4", Z.fillRect(X * V, W * V, V, V);
      q = [3, 2];
    } else if ($ === "wave") {
      Z.fillStyle = "#ffffff", Z.fillRect(0, 0, J, J), Z.strokeStyle = "rgba(255,255,255,1)";
      for (let K = 0;K < 6; K++)
        for (let V = 0;V < 5; V++) {
          let X = V * 120 + K % 2 * 60, W = K * 100 + 60;
          for (let H = 50;H > 8; H -= 12)
            Z.strokeStyle = H % 24 ? "rgba(255,230,190,.95)" : "rgba(30,20,40,.55)", Z.lineWidth = 5, Z.beginPath(), Z.arc(X, W, H, Math.PI, 0), Z.stroke();
        }
      q = [2, 2];
    } else if ($ === "knit") {
      Z.fillStyle = "#ffffff", Z.fillRect(0, 0, J, J);
      for (let K = 0;K < J; K += 16)
        for (let V = 0;V < J; V += 16)
          Z.fillStyle = `rgba(0,0,0,${0.1 + (V / 16 + K / 16) % 2 * 0.06})`, Z.beginPath(), Z.ellipse(V + 8, K + 8, 6, 8, V / 16 % 2 ? 0.5 : -0.5, 0, 6.283), Z.fill();
      Z.fillStyle = "rgba(255,255,255,.75)";
      for (let K = 0;K < J; K += 32)
        Z.fillRect(0, 160 + K % 64, J, 6);
      q = [3, 2];
    } else if ($ === "stars") {
      Z.fillStyle = "#132a6e", Z.fillRect(0, 0, J, J), Z.fillStyle = "#ffd34a";
      let K = (V, X, W) => {
        Z.beginPath();
        for (let H = 0;H < 10; H++) {
          let N = H / 10 * 6.283 - 1.57, F = H % 2 ? W * 0.45 : W;
          Z.lineTo(V + Math.cos(N) * F, X + Math.sin(N) * F);
        }
        Z.closePath(), Z.fill();
      };
      for (let V = 0;V < 26; V++)
        K(U() * J, U() * J, 8 + U() * 16);
      Z.fillStyle = "rgba(255,255,255,.8)";
      for (let V = 0;V < 60; V++)
        Z.beginPath(), Z.arc(U() * J, U() * J, 1.5, 0, 6.283), Z.fill();
      q = [2, 2];
    } else if ($ === "holo") {
      let K = Z.createLinearGradient(0, 0, J, J);
      ["#ff6ad5", "#c774e8", "#ad8cff", "#8795e8", "#94d0ff", "#7ef9ff", "#ff6ad5"].forEach((V, X, W) => K.addColorStop(X / (W.length - 1), V)), Z.fillStyle = K, Z.fillRect(0, 0, J, J), q = [1, 1];
    } else if ($ === "royal") {
      Z.fillStyle = "#4a1470", Z.fillRect(0, 0, J, J), Z.fillStyle = "rgba(255,210,90,.35)";
      for (let K = 0;K < 8; K++)
        for (let V = 0;V < 8; V++) {
          let X = V * 64 + K % 2 * 32 + 16, W = K * 64 + 32;
          Z.beginPath(), Z.moveTo(X, W - 12), Z.lineTo(X + 9, W), Z.lineTo(X, W + 12), Z.lineTo(X - 9, W), Z.fill();
        }
      q = [2, 2];
    } else
      Z.fillStyle = "#888", Z.fillRect(0, 0, J, J);
    let Y = tex(Q);
    return Y.wrapS = Y.wrapT = THREE.RepeatWrapping, Y.repeat.set(q[0], q[1]), PATC[$] = Y, Y;
  }
const MC=new Map();
function std(col,r=.6,mt=0,ex){const k='c'+col+'|'+r+'|'+mt+'|'+(ex?JSON.stringify(ex):'');let m=MC.get(k);if(!m){m=new THREE.MeshStandardMaterial(Object.assign({color:col,roughness:r,metalness:mt},ex||{}));MC.set(k,m)}return m}
function hdr(r,g,b){const k='h'+r+','+g+','+b;let m=MC.get(k);if(!m){m=new THREE.MeshBasicMaterial({color:new THREE.Color(r,g,b)});MC.set(k,m)}return m}
const GOLD=()=>std('#e3b04f',.22,1);
const CHROME=()=>std('#e6e8ee',.1,1);
const DIA=()=>std('#dff3ff',.05,.25,{emissive:'#2a5470',emissiveIntensity:.6});
const BLK=()=>std('#0c0c0f',.35,.4);
/* materials whose color cycles through the rainbow (RGB gear) */
const RGB=[];
function rgbMat(){const m=new THREE.MeshBasicMaterial({color:new THREE.Color(2,0,.4)});RGB.push(m);return m}
function rgbTick(t){for(let i=RGB.length-1;i>=0;i--){const m=RGB[i];if(m._dead){RGB.splice(i,1);continue}m.color.setHSL((t*.12+i*.07)%1,1,.5).multiplyScalar(2.2)}}
let GLOWT=null;
const glowTex=()=>GLOWT||(GLOWT=tex(glowCanvas(),{mips:false}));
function M(o,x,y,z,rx,ry,rz){o.position.set(x||0,y||0,z||0);o.rotation.set(rx||0,ry||0,rz||0);return o}
const mesh=(g,m)=>{const e=new THREE.Mesh(g,m);e.castShadow=true;return e};
function textTex($, { w: J = 256, h: Q = 128, font: Z = "900 92px Verdana", col: U = "#fff", bg: q = null, glow: E = null } = {}) {
    let Y = cv(J, Q), K = Y.getContext("2d");
    if (q)
      K.fillStyle = q, K.fillRect(0, 0, J, Q);
    if (K.font = Z, K.textAlign = "center", K.textBaseline = "middle", E)
      K.shadowColor = E, K.shadowBlur = 18;
    return K.fillStyle = U, K.fillText($, J / 2, Q / 2 + 4), tex(Y, { mips: false });
  }
function hat($, J, Q) {
    if ($ >= 14 && EXT.hat)
      return EXT.hat($, J, Q);
    let Z = 0.26, U = new THREE.Group;
    U.name = "bphat";
    let q = null;
    if ($ === 1) {
      let E = std("#ff1f4f", 0.95), Y = mesh(new THREE.SphereGeometry(Z * 1.1, 32, 16, 0, Math.PI * 2, 0, 1.42), E);
      Y.rotation.x = -0.32, U.add(Y);
      let K = mesh(new THREE.TorusGeometry(Z * 1.04, 0.036, 10, 40), std("#c9123a", 0.95));
      M(K, 0, 0.04, -0.012, Math.PI / 2 - 0.32), U.add(K);
      let V = mesh(sph(0.06, 14, 10), std("#f4f4f4", 1));
      M(V, 0, Z * 1.08, -0.08), U.add(V);
    } else if ($ === 2) {
      let E = std("#17171d", 0.7), Y = mesh(new THREE.SphereGeometry(Z * 1.1, 40, 18, 0, Math.PI * 2, 0, 1.38), E);
      Y.rotation.x = -0.32, U.add(Y);
      let K = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.014, 32, 1, false, -1.15, 2.3), std("#ff1f4f", 0.6));
      M(K, 0, 0.135, -0.13, -0.12, Math.PI), U.add(K);
      let V = mesh(box(0.06, 0.03, 0.01), std("#ff1f4f", 0.5));
      M(V, 0, 0.13, 0.2, -0.35), U.add(V);
    } else if ($ === 3) {
      let E = std("#c9b48f", 0.9), Y = mesh(cyl(0.18, 0.25, 0.15, 28), E);
      M(Y, 0, 0.2, -0.02, -0.18), U.add(Y);
      let K = mesh(cyl(0.37, 0.37, 0.014, 36), E);
      M(K, 0, 0.13, 0, -0.15), U.add(K);
      let V = mesh(cyl(0.252, 0.252, 0.03, 28, true), std("#5b4a32", 0.8));
      M(V, 0, 0.15, -0.01, -0.18), U.add(V);
    } else if ($ === 4) {
      let E = std("#7a4a26", 0.75), Y = mesh(cyl(0.17, 0.21, 0.21, 28), E);
      M(Y, 0, 0.27, -0.02, -0.12), U.add(Y);
      let K = mesh(new THREE.SphereGeometry(0.17, 20, 10, 0, Math.PI * 2, 0, 0.6), E);
      M(K, 0, 0.34, -0.03, -0.12), K.scale.set(1, 0.35, 1), U.add(K);
      let V = mesh(lathe([[0, 0], [0.22, 0], [0.36, 0.02], [0.43, 0.075], [0.44, 0.085]], 40), E);
      M(V, 0, 0.165, -0.01, -0.12), V.scale.set(1, 1, 0.82), U.add(V);
      let X = mesh(cyl(0.212, 0.212, 0.04, 28, true), std("#2a1a10", 0.6));
      M(X, 0, 0.19, -0.015, -0.12), U.add(X);
    } else if ($ === 5) {
      let E = std("#0d0d10", 0.4, 0.1), Y = mesh(cyl(0.17, 0.17, 0.38, 28), E);
      M(Y, 0, 0.37, -0.03, -0.1), U.add(Y);
      let K = mesh(cyl(0.3, 0.3, 0.016, 32), E);
      M(K, 0, 0.19, -0.015, -0.1), U.add(K);
      let V = mesh(cyl(0.173, 0.173, 0.06, 28, true), std("#ff1f4f", 0.5));
      M(V, 0, 0.22, -0.017, -0.1), U.add(V);
    } else if ($ === 6) {
      let E = mesh(new THREE.TorusGeometry(Z * 1.03, 0.032, 10, 44), std("#f4f4f4", 1));
      M(E, 0, 0.09, -0.01, Math.PI / 2 - 0.42), U.add(E);
      let Y = mesh(new THREE.TorusGeometry(Z * 1.035, 0.012, 8, 44), std("#ff1f4f", 0.8));
      M(Y, 0, 0.09, -0.01, Math.PI / 2 - 0.42), U.add(Y);
    } else if ($ === 7) {
      let E = cv(128, 256), Y = E.getContext("2d");
      for (let X = 0;X < 8; X++)
        Y.fillStyle = ["#ff1f4f", "#ffcf40", "#5ac8ff", "#3ddc97"][X % 4], Y.fillRect(0, X * 32, 128, 32);
      let K = mesh(new THREE.ConeGeometry(0.13, 0.36, 24, 1, true), std("#fff", 0.7, 0, { map: tex(E), side: THREE.DoubleSide }));
      M(K, 0.04, 0.4, -0.02, -0.12, 0, -0.16), U.add(K);
      let V = mesh(sph(0.04, 12, 8), std("#ffcf40", 0.6));
      M(V, 0.07, 0.58, -0.05), U.add(V);
    } else if ($ === 8) {
      let E = std("#121216", 0.6), Y = mesh(cyl(0.2, 0.2, 0.1, 28), E);
      M(Y, 0, 0.2, -0.02, -0.12), U.add(Y);
      let K = mesh(box(0.52, 0.02, 0.52), E);
      M(K, 0, 0.26, -0.03, -0.12, Math.PI / 4), U.add(K);
      let V = mesh(tube([[0, 0.272, -0.03], [0.15, 0.275, 0], [0.24, 0.22, 0.08], [0.25, 0.12, 0.1]], 0.008, 14, 6), GOLD());
      U.add(V);
      let X = mesh(cyl(0.02, 0.03, 0.07, 10), GOLD());
      M(X, 0.25, 0.08, 0.1), U.add(X);
    } else if ($ === 9) {
      let E = std("#9aa0a8", 0.35, 0.85), Y = mesh(new THREE.SphereGeometry(Z * 1.1, 36, 16, 0, Math.PI * 2, 0, 1.5), E);
      Y.rotation.x = -0.3, U.add(Y);
      let K = mesh(new THREE.TorusGeometry(Z * 1.08, 0.025, 8, 40), std("#6e5a3a", 0.6, 0.6));
      M(K, 0, 0.03, -0.01, Math.PI / 2 - 0.3), U.add(K), [-1, 1].forEach((V) => {
        let X = mesh(tube([[V * 0.24, 0.12, 0], [V * 0.36, 0.2, 0], [V * 0.42, 0.34, -0.02], [V * 0.4, 0.46, -0.04]], 0.03, 16, 8), std("#efe6d2", 0.6));
        U.add(X);
        let W = mesh(new THREE.ConeGeometry(0.03, 0.08, 10), std("#efe6d2", 0.6));
        M(W, V * 0.4, 0.5, -0.04, 0, 0, V * 0.25), U.add(W);
      });
    } else if ($ === 10) {
      let E = std("#121214", 0.7), Y = mesh(sph(1, 28, 14), E);
      Y.scale.set(0.42, 0.13, 0.22), M(Y, 0, 0.25, -0.03), U.add(Y);
      let K = mesh(new THREE.TorusGeometry(0.4, 0.012, 6, 40, Math.PI), GOLD());
      K.scale.set(1, 0.45, 0.5), M(K, 0, 0.24, 0, 0, 0, 0), U.add(K);
      let V = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({ map: textTex("☠", { w: 128, h: 128, font: "100px Verdana" }), transparent: true }));
      M(V, 0, 0.28, 0.2), U.add(V);
    } else if ($ === 11) {
      let E = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 10, 48), hdr(3.2, 2.6, 1.2));
      M(E, 0, 0.46, -0.04, Math.PI / 2 - 0.15), U.add(E), q = (Y) => {
        E.position.y = 0.46 + Math.sin(Y * 2.2) * 0.02, E.rotation.z = Y * 0.4;
      };
    } else if ($ === 12 || $ === 13) {
      let E = $ === 13, Y = E ? DIA() : GOLD(), K = mesh(cyl(0.17, 0.19, 0.11, 28, true), Y);
      K.material = Y, M(K, 0, 0.23, -0.03, -0.12), U.add(K);
      for (let V = 0;V < 7; V++) {
        let X = V / 7 * Math.PI * 2, W = mesh(new THREE.ConeGeometry(0.035, 0.11, 8), Y);
        M(W, Math.sin(X) * 0.175, 0.32, -0.03 + Math.cos(X) * 0.175, -0.12), U.add(W);
        let H = mesh(sph(0.018, 10, 8), E ? hdr(0.6, 2.4, 3.2) : std(["#ff1f4f", "#2a64ff", "#12b58a"][V % 3], 0.15, 0.3, { emissive: ["#600", "#012", "#021"][V % 3] }));
        M(H, Math.sin(X) * 0.188, 0.24, -0.03 + Math.cos(X) * 0.188), U.add(H);
      }
      if (E) {
        let V = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(0.7, 1.6, 2.4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }));
        V.scale.setScalar(0.55), M(V, 0, 0.3, -0.03), U.add(V), q = (X) => {
          V.material.opacity = 0.35 + 0.25 * Math.sin(X * 3);
        };
      }
    }
    if (U.children.length)
      J.add(U);
    return { g: U, up: q };
  }
function extra($, J, Q) {
    if ($ >= 8 && EXT.extra)
      return EXT.extra($, J, Q);
    let Z = [], U = null, q = (E, Y) => {
      return E.add(Y), Z.push(Y), Y;
    };
    if ($ === 1) {
      let E = std("#ff1f4f", 0.55);
      [-1, 1].forEach((K) => {
        let V = q(J.torso, mesh(sph(1, 14, 10), E));
        V.scale.set(0.045, 0.03, 0.018), M(V, K * 0.04, 0.43, 0.115, 0, 0, K * 0.25);
      });
      let Y = q(J.torso, mesh(sph(0.016, 10, 8), E));
      M(Y, 0, 0.43, 0.125);
    } else if ($ === 2) {
      let E = q(J.el[0], mesh(cyl(0.052, 0.052, 0.032, 20, true), GOLD()));
      M(E, 0, -0.13, 0);
      let Y = q(J.el[0], mesh(cyl(0.03, 0.03, 0.012, 20), std("#0b2a4a", 0.1, 0.6, { emissive: "#0a2a4a" })));
      M(Y, 0, -0.13, 0.052, Math.PI / 2);
    } else if ($ === 3) {
      let E = q(J.torso, mesh(new THREE.TorusGeometry(0.13, 0.012, 8, 40), DIA()));
      M(E, 0, 0.41, 0.035, Math.PI / 2 - 0.55);
      let Y = q(J.torso, mesh(new THREE.OctahedronGeometry(0.04), std("#e8fbff", 0.02, 0.2, { emissive: "#6fd8ff", emissiveIntensity: 0.9 })));
      M(Y, 0, 0.32, 0.165), U = (K) => {
        Y.rotation.y = K * 1.5;
      };
    } else if ($ === 4) {
      let E = std(new THREE.Color(Q || "#2b1a10").multiplyScalar(0.85).getStyle(), 0.8);
      [-1, 1].forEach((Y) => {
        let K = q(J.head, mesh(sph(1, 14, 10), E));
        K.scale.set(0.05, 0.016, 0.02), K.position.set(Y * 0.042, -0.072, 0.245), K.rotation.z = Y * -0.25, K.layers.set(1);
      });
    } else if ($ === 5) {
      let E = GOLD(), Y = std("#2a1a05", 0.05, 0.6, { envMapIntensity: 2.2 });
      [-1, 1].forEach((V) => {
        let X = q(J.head, mesh(sph(1, 20, 12), Y));
        X.scale.set(0.068, 0.056, 0.016), X.position.set(V * 0.09, 0.025, 0.258);
        let W = q(J.head, mesh(new THREE.TorusGeometry(0.06, 0.006, 6, 24), E));
        W.scale.set(1.12, 0.92, 1), W.position.set(V * 0.09, 0.025, 0.262);
      }), q(J.head, mesh(box(0.06, 0.008, 0.008), E)).position.set(0, 0.06, 0.262);
    } else if ($ === 6) {
      let E = new THREE.Shape;
      E.moveTo(0, 0), E.bezierCurveTo(0.12, 0.18, 0.42, 0.34, 0.62, 0.3), E.bezierCurveTo(0.5, 0.2, 0.52, 0.1, 0.44, 0.04), E.bezierCurveTo(0.4, -0.06, 0.3, -0.12, 0.2, -0.12), E.bezierCurveTo(0.1, -0.12, 0.04, -0.08, 0, 0);
      let Y = new THREE.ShapeGeometry(E, 16), K = std("#ffffff", 0.85, 0, { side: THREE.DoubleSide, emissive: "#3a3a48", emissiveIntensity: 0.4 }), V = [];
      [-1, 1].forEach((X) => {
        let W = new THREE.Group;
        W.position.set(X * 0.06, 0.3, -0.16), J.torso.add(W), Z.push(W);
        let H = mesh(Y, K);
        H.scale.set(X, 1, 1), W.add(H), V.push([W, X]);
      }), U = (X) => {
        let W = Math.sin(X * 2.4) * 0.18;
        V.forEach(([H, N]) => {
          H.rotation.y = N * (-0.55 + W), H.rotation.z = N * 0.1;
        });
      };
    } else if ($ === 7) {
      let E = new THREE.PlaneGeometry(0.44, 0.78, 1, 8);
      E.translate(0, -0.39, 0);
      let Y = std("#b8102f", 0.75, 0, { side: THREE.DoubleSide }), K = mesh(E, Y), V = new THREE.Group;
      V.position.set(0, 0.43, -0.14), J.torso.add(V), Z.push(V), V.add(K);
      let X = E.attributes.position.array.slice();
      U = (W, H) => {
        let N = E.attributes.position;
        for (let F = 0;F < N.count; F++) {
          let G = X[F * 3 + 1], _ = -G / 0.78;
          N.setZ(F, X[F * 3 + 2] - _ * _ * (0.12 + 0.18 * (H || 0)) - Math.sin(W * 3 + G * 6) * 0.02 * _);
        }
        N.needsUpdate = true, V.rotation.x = 0.12 + 0.25 * (H || 0);
      };
    }
    return { out: Z, up: U };
  }
function headset($, J) {
    if (!$)
      return null;
    let { band: Q, cups: Z, rings: U, head: q } = J, E = null;
    if ($ === 1)
      E = GOLD();
    else if ($ === 2)
      E = CHROME();
    else if ($ === 3)
      E = BLK();
    else if ($ === 4)
      E = std("#f2f2f6", 0.4);
    else if ($ === 5)
      E = std("#141416", 0.45, 0.2);
    else if ($ === 6)
      E = mk("g6", () => SM({ map: woodTex(), color: "#b07a4a", roughness: 0.55 }));
    else if ($ === 7)
      E = mk("g7", () => SM({ map: carbonTex(), roughness: 0.3, metalness: 0.45 }));
    else if ($ === 8)
      E = std("#0b0b0d", 0.3, 0.3);
    else if ($ === 9)
      E = DIA();
    if ([Q, ...Z].forEach((Y) => Y.material = E), $ === 5) {
      let Y = hdr(0.4, 2.8, 0.6);
      U.forEach((K) => K.material = Y);
    }
    if ($ === 6) {
      let Y = std("#c8963e", 0.28, 1);
      U.forEach((K) => K.material = Y), Q.material = Y;
    }
    if ($ === 7) {
      let Y = hdr(2.8, 0.2, 0.35);
      U.forEach((K) => K.material = Y);
    }
    if ($ === 8) {
      let Y = hdr(3, 1.1, 0.15);
      U.forEach((K) => K.material = Y), Z.forEach((K) => {
        let V = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.058, 24), std("#ff6a1a", 0.4, 0, { emissive: "#ff3a00", emissiveIntensity: 0.9 }));
        V.rotation.z = Math.PI / 2, V.scale.set(1, 0.6, 0.6), K.add(V);
      });
    }
    if ($ === 9) {
      let Y = hdr(2.4, 2.8, 3.2);
      U.forEach((K) => K.material = Y);
    }
    if ($ === 3) {
      let Y = rgbMat();
      U.forEach((K) => K.material = Y);
    }
    if ($ === 4) {
      let Y = std("#ff7ab6", 0.6), K = hdr(2.6, 0.6, 1.4);
      U.forEach((V) => V.material = K), [-1, 1].forEach((V) => {
        let X = mesh(new THREE.ConeGeometry(0.075, 0.13, 4), E);
        X.position.set(V * 0.15, 0.27, -0.02), X.rotation.set(-0.1, Math.PI / 4, V * -0.35), q.add(X);
        let W = mesh(new THREE.ConeGeometry(0.045, 0.08, 4), Y);
        W.position.set(V * 0.148, 0.262, 0.008), W.rotation.set(-0.1, Math.PI / 4, V * -0.35), q.add(W);
      });
    }
    return true;
  }
function aura($, J) {
    if (!$)
      return null;
    let Q = [null, [2.2, 0.18, 0.4], [2.4, 1.7, 0.45], [2.6, 0.9, 0.15], [0.6, 1.6, 2.8], [2, 1, 2], [2.6, 0.5, 1.3], [0.9, 2.2, 2.8], [0.35, 0.08, 0.5], [0.4, 2.4, 0.7], [1.2, 2.8, 0.2], [1.2, 0.6, 2.6], [3, 1.8, 0.4], [0.6, 0.1, 1.6]][$] || [2, 2, 2], Z = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(...Q), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    Z.scale.set(1.6, 1.9, 1), Z.position.set(0, 1, -0.12), Z.renderOrder = -1, J.add(Z);
    let U = 0;
    return { sp: Z, up: (q, E, Y) => {
      U += ((Y > 0.1 ? 1 : 0) - U) * Math.min(1, E * 5);
      let K = 0.08 + 0.62 * U, V = 1;
      if ($ === 3)
        K *= 0.75 + 0.35 * Math.sin(q * 23) * Math.sin(q * 7.1), V = 1 + 0.08 * Math.sin(q * 17);
      else if ($ === 4) {
        if (Math.random() < 0.06 * U)
          K = 1.6;
      } else if ($ === 5)
        Z.material.color.setHSL(q * 0.25 % 1, 1, 0.55).multiplyScalar(2.2);
      else if ($ === 6)
        V = 1 + 0.1 * Math.pow(Math.abs(Math.sin(q * 3.2)), 6);
      else if ($ === 7)
        K *= 0.85 + 0.15 * Math.sin(q * 2);
      else if ($ === 8)
        Z.material.blending = THREE.NormalBlending, K *= 1.25;
      else if ($ === 9)
        V = 1 + 0.05 * Math.sin(q * 5);
      else if ($ === 10)
        K *= 0.8 + 0.3 * Math.sin(q * 9) * Math.sin(q * 3.3);
      else if ($ === 11)
        Z.material.color.setHSL(0.62 + 0.12 * Math.sin(q * 0.8), 1, 0.55).multiplyScalar(2.2);
      else if ($ === 12)
        V = 1.05 + 0.12 * Math.sin(q * 11) * Math.sin(q * 4.7), K *= 1.15;
      else if ($ === 13)
        Z.material.color.setHSL(0.78, 1, 0.25 + 0.1 * Math.sin(q * 2)).multiplyScalar(2.4), V = 1 + 0.06 * Math.sin(q * 1.7);
      Z.material.opacity = Math.max(0, K), Z.scale.set(1.6 * V, 1.9 * V, 1);
    } };
  }
/* ---------------- desks: style, computer setup, desk item and chair for whoever sits there ---------------- */
let SCR=null;
function screenTex(){if(SCR)return SCR;const c=cv(512,288),x=c.getContext('2d');x.fillStyle='#06070c';x.fillRect(0,0,512,288);x.fillStyle='#0f1422';x.fillRect(0,0,512,34);
  x.fillStyle='#ff1f4f';x.font='bold 18px Verdana';x.fillText('OWQ  PIPELINE',14,23);x.strokeStyle='#3ddc97';x.lineWidth=4;x.beginPath();for(let i=0;i<=24;i++){const X=20+i*19,Y=230-i*5-Math.sin(i*1.3)*22;i?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke();
  for(let i=0;i<6;i++){x.fillStyle=i%2?'#5ac8ff':'#ffcf40';x.fillRect(30+i*75,250-(30+i*14),40,30+i*14)}SCR=tex(c,{mips:false});return SCR}
let CARB=null;
function carbonTex(){if(CARB)return CARB;const c=cv(128,128),x=c.getContext('2d');for(let i=0;i<8;i++)for(let j=0;j<8;j++){const g=x.createLinearGradient(i*16,j*16,i*16+16,j*16+16);const a=(i+j)%2;g.addColorStop(0,a?'#1c1c22':'#0a0a0d');g.addColorStop(1,a?'#08080a':'#202028');x.fillStyle=g;x.fillRect(i*16,j*16,16,16)}
  CARB=tex(c);CARB.wrapS=CARB.wrapT=THREE.RepeatWrapping;CARB.repeat.set(10,4);return CARB}
var WOODT = null;
function woodTex() {
    if (WOODT)
      return WOODT;
    let $ = cv(256, 256), J = $.getContext("2d");
    J.fillStyle = "#8a5a32", J.fillRect(0, 0, 256, 256);
    for (let Q = 0;Q < 70; Q++) {
      let Z = Math.random() * 256;
      J.strokeStyle = `rgba(${60 + Math.random() * 40 | 0},${30 + Math.random() * 25 | 0},12,${0.25 + Math.random() * 0.35})`, J.lineWidth = 1 + Math.random() * 3, J.beginPath(), J.moveTo(0, Z);
      for (let U = 0;U <= 256; U += 16)
        J.lineTo(U, Z + Math.sin(U * 0.05 + Q) * 4);
      J.stroke();
    }
    return WOODT = tex($), WOODT.wrapS = WOODT.wrapT = THREE.RepeatWrapping, WOODT;
  }
let MARB={};
function marbleTex(dark){if(MARB[dark])return MARB[dark];const t=tex(marbleCanvas(dark?21:4));t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.4,.6);MARB[dark]=t;return t}
function monitor(w,h,curve){const g=new THREE.Group(),sm=new THREE.MeshBasicMaterial({map:screenTex(),color:new THREE.Color(1.25,1.25,1.25)});
  if(curve){const r=1.1,th=w/r;const s=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32,1,true,Math.PI-th/2,th),sm);s.material.side=THREE.BackSide;s.position.z=r-.02;g.add(s);
    const bk=mesh(new THREE.CylinderGeometry(r+.02,r+.02,h+.03,32,1,true,Math.PI-th/2,th),BLK());bk.position.z=r-.02;g.add(bk)}
  else{const bz=mesh(rbox(w+.03,h+.03,.025,.008),BLK());g.add(bz);const s=new THREE.Mesh(new THREE.PlaneGeometry(w,h),sm);s.position.z=-.014;s.rotation.y=Math.PI;g.add(s)}
  const st=mesh(cyl(.012,.012,.12,8),BLK());st.position.set(0,-h/2-.05,.02);g.add(st);const ft=mesh(rbox(.16,.012,.1,.004),BLK());ft.position.set(0,-h/2-.11,.02);g.add(ft);return g}
function styleDesk($, J, Q) {
    if ($.sty)
      Q.remove($.sty), $.sty.traverse((Y) => {
        if (Y.material && Y.material._rgb)
          Y.material._dead = 1;
      }), $.sty = null;
    if ($.chairSty)
      $.chair.remove($.chairSty), $.chairSty = null;
    if ($.chair.children.forEach((Y, K) => {
      if (K < 2)
        Y.visible = true;
    }), $.up = null, !J)
      return;
    let Z = $.seat.x, U = $.seat.z, q = new THREE.Group;
    q.name = "desksty";
    let E = [];
    if (J.D) {
      let Y = J.D, K, V = CHROME(), X = null, W = null;
      if (Y === 1)
        K = std("#3a3a40", 0.25, 0.1, { map: marbleTex(1) }), W = GOLD(), V = GOLD(), X = std("#16161a", 0.3, 0.2);
      else if (Y === 2)
        K = std("#ffffff", 0.3, 0.45, { map: carbonTex() }), W = std("#ff1f4f", 0.4), V = BLK(), X = std("#ffffff", 0.35, 0.4, { map: carbonTex() });
      else if (Y === 3)
        K = std("#0b0b0e", 0.12, 0.3), W = GOLD(), V = GOLD(), X = std("#0b0b0e", 0.15, 0.3);
      else if (Y === 4) {
        K = std("#060608", 0.18, 0.4);
        let N = rgbMat();
        N._rgb = 1, W = N, V = BLK(), X = std("#060608", 0.2, 0.4);
      } else if (Y === 5)
        K = std("#bfe3ff", 0.03, 0.1, { transparent: true, opacity: 0.38 }), V = CHROME(), X = std("#bfe3ff", 0.04, 0.1, { transparent: true, opacity: 0.3 });
      else if (Y === 6)
        K = std("#f6f8fb", 0.12, 0.05, { map: marbleTex(0) }), W = hdr(0.7, 2.2, 3), V = CHROME(), X = std("#eef3f8", 0.15, 0.1, { map: marbleTex(0) });
      else if (Y === 7)
        K = mk("d7t", () => SM({ map: woodTex(), roughness: 0.6 })), V = std("#2a2a2e", 0.5, 0.4), X = mk("d7p", () => SM({ map: woodTex(), color: "#d9b48f", roughness: 0.65 }));
      else if (Y === 8)
        K = mk("d8t", () => SM({ map: marbleTex(0), roughness: 0.18, metalness: 0.05 })), W = CHROME(), V = CHROME(), X = mk("d8p", () => SM({ map: marbleTex(0), color: "#f2f2f4", roughness: 0.25 }));
      else if (Y === 9) {
        let N = std("#e8a598", 0.24, 1);
        K = std("#f0c4b8", 0.2, 0.85), W = N, V = N, X = std("#d9968a", 0.3, 0.9);
      } else if (Y === 10)
        K = mk("d10t", () => SM({ map: patTex("money"), roughness: 0.55 })), W = GOLD(), V = GOLD(), X = mk("d10p", () => SM({ map: patTex("money"), roughness: 0.6 }));
      else if (Y === 11)
        K = mk("d11t", () => SM({ color: "#0a0a12", roughness: 0.3, metalness: 0.2, emissive: "#ffffff", emissiveMap: patTex("grid"), emissiveIntensity: 1.6 })), W = hdr(0.3, 2.6, 3), V = BLK(), X = mk("d11p", () => SM({ color: "#07070c", roughness: 0.3, metalness: 0.2, emissive: "#ffffff", emissiveMap: patTex("grid"), emissiveIntensity: 1.2 }));
      else if (Y === 12)
        K = mk("d12t", () => SM({ map: patTex("lava"), roughness: 0.85, emissive: "#ffffff", emissiveMap: patTex("lavaE"), emissiveIntensity: 1.8 })), W = hdr(3, 0.8, 0.1), V = std("#120c0a", 0.8), X = mk("d12p", () => SM({ map: patTex("lava"), roughness: 0.85, emissive: "#ffffff", emissiveMap: patTex("lavaE"), emissiveIntensity: 1.4 }));
      else if (Y === 13)
        K = std("#cfefff", 0.02, 0.05, { transparent: true, opacity: 0.55, emissive: "#3a7aa0", emissiveIntensity: 0.5 }), W = hdr(1.6, 2.6, 3.2), V = std("#cfefff", 0.02, 0.05, { transparent: true, opacity: 0.6 }), X = std("#cfefff", 0.03, 0.05, { transparent: true, opacity: 0.42 });
      else if (Y === 14) {
        K = mk("d14t", () => SM({ color: "#38e6ff", roughness: 0.1, transparent: true, opacity: 0.32, emissive: "#ffffff", emissiveMap: patTex("scan"), emissiveIntensity: 1.4, depthWrite: false }));
        let N = rgbMat();
        N._rgb = 1, W = N, V = std("#38e6ff", 0.1, 0, { transparent: true, opacity: 0.25, emissive: "#0a6a80" }), X = mk("d14p", () => SM({ color: "#38e6ff", roughness: 0.1, transparent: true, opacity: 0.2, emissive: "#ffffff", emissiveMap: patTex("scan"), emissiveIntensity: 1, depthWrite: false }));
      }
      let H = mesh(rbox(1.93, 0.058, 0.85, 0.016), K);
      if (H.position.set(Z, 0.737, U), H.receiveShadow = true, q.add(H), [-1, 1].forEach((N) => {
        let F = mesh(box(0.052, 0.712, 0.752), V);
        F.position.set(Z + N * 0.9, 0.356, U), q.add(F);
      }), X) {
        let N = mesh(box(1.78, 0.43, 0.014), X);
        N.position.set(Z, 0.47, U + 0.364), q.add(N);
      }
      if (W)
        [[1.94, 0.012, 0.014, 0, 0.762, 0.425], [1.94, 0.012, 0.014, 0, 0.762, -0.425], [0.014, 0.012, 0.86, 0.965, 0.762, 0], [0.014, 0.012, 0.86, -0.965, 0.762, 0]].forEach(([N, F, G, _, D, O]) => {
          let I = new THREE.Mesh(box(N, F, G), W);
          I.position.set(Z + _, D, U + O), q.add(I);
        });
    }
    if (J.C) {
      let Y = J.C, V = U + 0.06, X = (W, H, N, F) => {
        return W.position.set(Z + H, 0.94 + (N || 0), V), W.rotation.y = F || 0, q.add(W), W;
      };
      if (Y === 1)
        X(monitor(0.5, 0.29), -0.27, 0, 0.2), X(monitor(0.5, 0.29), 0.27, 0, -0.2);
      else if (Y === 2)
        X(monitor(0.44, 0.26), 0, 0, 0), X(monitor(0.44, 0.26), -0.46, 0, 0.38), X(monitor(0.44, 0.26), 0.46, 0, -0.38);
      else if (Y === 3)
        X(monitor(1.05, 0.3, 1), 0, 0, 0);
      else if (Y === 4) {
        X(monitor(0.62, 0.34), 0, 0.02, 0);
        let W = mesh(rbox(0.2, 0.44, 0.42, 0.02), BLK());
        W.position.set(Z + 0.72, 0.99, U - 0.02), q.add(W);
        let H = rgbMat();
        H._rgb = 1;
        let N = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.38), H);
        N.position.set(Z + 0.619, 0.99, U - 0.02), N.rotation.y = -Math.PI / 2, q.add(N);
        let F = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.17), H);
        F.rotation.x = -Math.PI / 2, F.position.set(Z, 0.762, U - 0.3), q.add(F);
      } else if (Y === 5) {
        [-0.66, -0.22, 0.22, 0.66].forEach((N, F) => X(monitor(0.4, 0.23), N, -0.02, [0.45, 0.15, -0.15, -0.45][F])), [-0.44, 0.44].forEach((N) => X(monitor(0.4, 0.23), N, 0.24, N < 0 ? 0.3 : -0.3));
        let W = rgbMat();
        W._rgb = 1;
        let H = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.05), W);
        H.position.set(Z, 0.79, V + 0.03), q.add(H);
      } else if (Y >= 7 && EXT.setup)
        EXT.setup(Y, { put: X, g: q, x: Z, z: U, Y: 0.94, Z: V, ups: E });
      else if (Y === 6) {
        let W = GOLD(), H = mesh(rbox(0.38, 0.018, 0.26, 0.006), W);
        H.position.set(Z, 0.775, U - 0.18), q.add(H);
        let N = new THREE.Group;
        N.position.set(Z, 0.784, U - 0.05), N.rotation.x = -0.25, q.add(N);
        let F = mesh(rbox(0.38, 0.25, 0.012, 0.006), W);
        F.position.y = 0.125, N.add(F);
        let G = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.22), new THREE.MeshBasicMaterial({ map: screenTex(), color: new THREE.Color(1.3, 1.3, 1.3) }));
        G.position.set(0, 0.125, -0.008), G.rotation.y = Math.PI, N.add(G);
      }
    }
    if (J.I) {
      let Y = J.I, K = Z + 0.42, V = U + 0.24, W = new THREE.Group;
      if (W.position.set(K, 0.766, V), q.add(W), Y === 1)
        W.add(M(mesh(rbox(0.1, 0.05, 0.1, 0.01), BLK()), 0, 0.025)), W.add(M(mesh(lathe([[0, 0], [0.025, 0], [0.025, 0.02], [0.012, 0.035], [0.012, 0.07], [0.06, 0.1], [0.07, 0.17], [0, 0.17]], 24), GOLD()), 0, 0.05)), [-1, 1].forEach((H) => W.add(M(mesh(new THREE.TorusGeometry(0.03, 0.007, 6, 14), GOLD()), H * 0.075, 0.18, 0, 0, Math.PI / 2)));
      else if (Y === 2) {
        let H = std("#5f9a52", 0.8), N = std("#e8dcae", 0.7);
        for (let F = 0;F < 4; F++) {
          let G = mesh(box(0.17, 0.022, 0.08), H);
          G.position.set(F % 2 * 0.01, 0.011 + F * 0.023, F % 3 * 0.005), G.rotation.y = F * 0.06, W.add(G);
          let _ = mesh(box(0.035, 0.024, 0.082), N);
          _.position.copy(G.position), _.rotation.copy(G.rotation), W.add(_);
        }
      } else if (Y === 3) {
        W.add(M(mesh(cyl(0.04, 0.055, 0.05, 16), GOLD()), 0, 0.025));
        let H = new THREE.Mesh(cyl(0.026, 0.042, 0.18, 16), std("#ff5aa0", 0.1, 0, { transparent: true, opacity: 0.55, emissive: "#7a1840", emissiveIntensity: 0.8 }));
        H.position.y = 0.14, W.add(H);
        let N = [];
        for (let F = 0;F < 3; F++) {
          let G = new THREE.Mesh(sph(0.016, 10, 8), hdr(2.6, 0.7, 0.2));
          W.add(G), N.push(G);
        }
        W.add(M(mesh(cyl(0.022, 0.026, 0.03, 16), GOLD()), 0, 0.245)), E.push((F) => N.forEach((G, _) => {
          G.position.set(Math.sin(F * 0.7 + _) * 0.008, 0.07 + (F * 0.12 + _ * 0.33) % 1 * 0.13, 0);
        }));
      } else if (Y === 4) {
        W.add(M(mesh(cyl(0.04, 0.05, 0.03, 16), BLK()), 0, 0.015));
        let H = mesh(cyl(0.006, 0.006, 0.06, 8), CHROME());
        H.position.y = 0.06, W.add(H);
        let N = new THREE.Group;
        N.position.y = 0.1, W.add(N), N.add(M(mesh(sph(0.05, 18, 12), std("#efc1a0", 0.6)), 0, 0.03)), N.add(M(mesh(sph(0.052, 18, 10), std("#15100e", 0.5)), 0, 0.05, -0.008)), [-1, 1].forEach((F) => N.add(M(new THREE.Mesh(sph(0.008, 8, 6), std("#07070a", 0.1)), F * 0.018, 0.035, 0.046))), E.push((F) => {
          N.rotation.z = Math.sin(F * 5.2) * 0.18, N.rotation.x = Math.sin(F * 3.7) * 0.1;
        });
      } else if (Y === 5)
        W.add(M(mesh(cyl(0.06, 0.065, 0.02, 20), std("#5a3a22", 0.6)), 0, 0.01)), W.add(M(mesh(lathe([[0, 0], [0.05, 0], [0.045, 0.02], [0.035, 0.06], [0.02, 0.08], [0, 0.085]], 22), GOLD()), 0, 0.02)), W.add(M(mesh(sph(0.012, 8, 6), GOLD()), 0, 0.11));
      else if (Y === 6) {
        W.add(M(mesh(rbox(0.14, 0.04, 0.09, 0.01), std("#3a2a20", 0.7)), 0, 0.02));
        let H = mesh(tube([[0, 0.04, 0], [0.01, 0.08, 0], [-0.015, 0.12, 0.005], [0, 0.15, 0]], 0.008, 10, 6), std("#6b4a2a", 0.9));
        W.add(H), [[0, 0.17, 0, 0.05], [0.045, 0.15, 0.01, 0.035], [-0.045, 0.14, -0.01, 0.035]].forEach(([N, F, G, _]) => {
          let D = mesh(sph(_, 12, 8), std("#3f7a3a", 0.85));
          D.scale.y = 0.6, D.position.set(N, F, G), W.add(D);
        });
      } else if (Y === 7) {
        W.add(M(mesh(cyl(0.055, 0.045, 0.11, 18, true), CHROME()), 0, 0.055));
        let H = mesh(cyl(0.022, 0.024, 0.16, 14), std("#0e3a1e", 0.2, 0.3));
        H.position.set(0, 0.12, 0), H.rotation.z = 0.18, W.add(H);
        let N = mesh(cyl(0.009, 0.012, 0.05, 10), GOLD());
        N.position.set(-0.017, 0.215, 0), N.rotation.z = 0.18, W.add(N);
        for (let F = 0;F < 5; F++) {
          let G = mesh(box(0.02, 0.02, 0.02), std("#dff3ff", 0.05, 0, { transparent: true, opacity: 0.8 }));
          G.position.set(Math.cos(F * 1.3) * 0.035, 0.1, Math.sin(F * 1.3) * 0.035), W.add(G);
        }
      } else if (Y >= 9 && EXT.item)
        EXT.item(Y, W, E);
      else if (Y === 8) {
        let H = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.14), new THREE.MeshBasicMaterial({ map: textTex("OWQ", { w: 256, h: 110, font: "italic 900 84px Verdana", col: "#ffd6df", glow: "#ff1f4f" }), transparent: true, color: new THREE.Color(2.2, 2.2, 2.2), depthWrite: false }));
        H.position.set(-0.12, 0.11, 0), W.add(H), W.add(M(mesh(box(0.3, 0.012, 0.04), BLK()), -0.12, 0.006));
      }
    }
    if (J.W) {
      let Y = buildCar(J.W);
      if (Y)
        Y.scale.setScalar(0.11), Y.position.set(Z - 0.52, 0.768, U + 0.2), Y.rotation.y = -0.5, q.add(Y);
    }
    if (J.F && EXT.plane) {
      let Y = EXT.plane(J.F);
      if (Y) {
        let K = new THREE.Group;
        K.position.set(Z - 0.62, 1.32, U - 0.05), q.add(K);
        let V = 0.42 / (Y.userData.span || 8);
        Y.scale.setScalar(V), K.add(Y);
        let X = new THREE.Mesh(cyl(0.004, 0.004, 0.55, 6), std("#cfe6ff", 0.05, 0, { transparent: true, opacity: 0.35 }));
        X.position.set(Z - 0.62, 1.04, U - 0.05), q.add(X);
        let W = mesh(cyl(0.05, 0.06, 0.015, 18), BLK());
        W.position.set(Z - 0.62, 0.773, U - 0.05), q.add(W), E.push((H) => {
          if (K.position.y = 1.32 + Math.sin(H * 1.3) * 0.025, Y.rotation.set(Math.sin(H * 0.9) * 0.06, 0.6 + Math.sin(H * 0.35) * 0.25, Math.sin(H * 1.1) * 0.18), Y.userData.spin)
            Y.userData.spin(H);
        });
      }
    }
    if (J.R) {
      let Y = J.R, K = new THREE.Group, V = Y >= 4 && EXT.chairHide ? EXT.chairHide(Y) : null;
      if ($.chair.children.forEach((X, W) => {
        if (V ? V.indexOf(W) >= 0 : W === 0 || Y === 3 && W === 1)
          X.visible = false;
      }), Y >= 4 && EXT.chair)
        EXT.chair(Y, K, E);
      if (Y === 1) {
        let X = std("#111116", 0.45), W = std("#ff1f4f", 0.5);
        K.add(M(mesh(rbox(0.56, 0.12, 0.54, 0.04), X), 0, 0.47));
        let H = mesh(rbox(0.54, 0.92, 0.12, 0.05), X);
        M(H, 0, 1, -0.28, -0.12), K.add(H), [-1, 1].forEach((G) => {
          let _ = mesh(rbox(0.08, 0.78, 0.14, 0.03), W);
          M(_, G * 0.25, 1, -0.25, -0.12, 0, G * 0.05), K.add(_);
          let D = mesh(rbox(0.06, 0.04, 0.32, 0.015), X);
          M(D, G * 0.3, 0.68, -0.02), K.add(D);
        });
        let N = mesh(rbox(0.3, 0.12, 0.08, 0.03), W);
        M(N, 0, 1.38, -0.3, -0.12), K.add(N);
        let F = mesh(rbox(0.06, 0.7, 0.125, 0.02), W);
        M(F, 0, 0.98, -0.282, -0.12), K.add(F);
      } else if (Y === 2) {
        let X = std("#4a2c1a", 0.4, 0.1), W = GOLD();
        K.add(M(mesh(rbox(0.6, 0.13, 0.56, 0.05), X), 0, 0.48));
        let H = mesh(rbox(0.6, 1, 0.14, 0.07), X);
        M(H, 0, 1.05, -0.29, -0.1), K.add(H);
        for (let N = 0;N < 3; N++)
          for (let F = 0;F < 4; F++) {
            let G = mesh(sph(0.012, 8, 6), W);
            M(G, -0.16 + N * 0.16, 0.7 + F * 0.2, -0.215 + F * 0.02 * 0.1), K.add(G);
          }
        [-1, 1].forEach((N) => {
          let F = mesh(rbox(0.08, 0.1, 0.42, 0.03), X);
          M(F, N * 0.32, 0.68, -0.03), K.add(F);
        });
      } else if (Y === 3) {
        let X = GOLD(), W = std("#8a0a24", 0.95);
        K.add(M(mesh(rbox(0.66, 0.16, 0.6, 0.04), X), 0, 0.42)), K.add(M(mesh(rbox(0.58, 0.08, 0.52, 0.04), W), 0, 0.52));
        let H = mesh(rbox(0.66, 1.45, 0.12, 0.04), X);
        M(H, 0, 1.2, -0.31), K.add(H);
        let N = mesh(rbox(0.5, 1.1, 0.04, 0.03), W);
        M(N, 0, 1.12, -0.245), K.add(N);
        for (let F = 0;F < 5; F++) {
          let G = mesh(new THREE.ConeGeometry(0.045, 0.16, 8), X);
          M(G, -0.24 + F * 0.12, 2, -0.31), K.add(G);
          let _ = new THREE.Mesh(sph(0.022, 10, 8), hdr(2.6, 0.15, 0.3));
          M(_, -0.24 + F * 0.12, 1.9, -0.24), K.add(_);
        }
        [-1, 1].forEach((F) => {
          K.add(M(mesh(rbox(0.1, 0.3, 0.56, 0.03), X), F * 0.36, 0.62, -0.02)), [-1, 1].forEach((G) => K.add(M(mesh(cyl(0.035, 0.045, 0.36, 10), X), F * 0.28, 0.18, G * 0.24)));
        });
      }
      $.chair.add(K), $.chairSty = K;
    }
    Q.add(q), $.sty = q, $.up = E.length ? (Y) => E.forEach((K) => K(Y)) : null;
  }
COS.W = ["None", "Old Honda Civic", "Toyota Corolla", "Ford F-150", "Jeep Wrangler", "Tesla Model 3", "BMW M4", "Dodge Challenger Hellcat", "Porsche 911", "Lamborghini Aventador", "Bugatti Chiron", "Golf Cart", "Delivery Van", "Taxi Cab", "Ice Cream Truck", "Muscle Coupe", "Rally Hatch", "Stretch Limo", "Monster Truck", "Open-Wheel Racer", "Hover Car"];
/* drop chance in percent, same order as COS.W (1-10) */
const CARP=[30,20,14,11,9,6,4,3,2,1];
const CARR=['common','common','uncommon','uncommon','rare','rare','epic','epic','legendary','mythic'];
const CARS=[null,
 {L:3.0,W:1.45,H:.62,cab:[1.55,.55,-.05],cabT:.85,col:'#8ea3b4',rough:.55,wr:.3,hatch:1,rust:1},
 {L:3.3,W:1.5,H:.6,cab:[1.6,.52,0],cabT:.8,col:'#eceef1',rough:.35,wr:.31},
 {L:3.9,W:1.7,H:.85,cab:[1.25,.62,.55],cabT:.9,col:'#1b2f52',rough:.4,wr:.42,bed:1},
 {L:3.0,W:1.6,H:.85,cab:[1.7,.75,-.1],cabT:.98,col:'#4a5a33',rough:.7,wr:.44,box:1,spare:1},
 {L:3.35,W:1.55,H:.55,cab:[1.75,.5,-.05],cabT:.7,col:'#f4f5f7',rough:.15,wr:.32,glassRoof:1},
 {L:3.35,W:1.6,H:.55,cab:[1.4,.46,-.15],cabT:.72,col:'#1f5fd6',rough:.2,mt:.4,wr:.33},
 {L:3.6,W:1.65,H:.6,cab:[1.35,.45,-.2],cabT:.75,col:'#c4141d',rough:.25,mt:.2,wr:.35,stripe:'#0b0b0d'},
 {L:3.15,W:1.55,H:.52,cab:[1.5,.47,-.25],cabT:.65,col:'#f2c21b',rough:.18,mt:.3,wr:.33,round:1},
 {L:3.5,W:1.75,H:.42,cab:[1.4,.36,-.1],cabT:.55,col:'#7ad321',rough:.15,mt:.3,wr:.34,wedge:1},
 {L:3.6,W:1.8,H:.48,cab:[1.3,.38,-.05],cabT:.55,col:'#123a8a',col2:'#0b0b10',rough:.12,mt:.55,wr:.36,glow:1}];
function buildCar($) {
    if ($ >= 11 && EXT.car)
      return EXT.car($);
    let J = CARS[$];
    if (!J)
      return null;
    let Q = new THREE.Group;
    Q.name = "car" + $;
    let Z = [], U = std(J.col, J.rough, J.mt || 0), q = std("#0a0a0d", 0.35, 0.3), E = std("#141c26", 0.05, 0.4, { envMapIntensity: 2 }), Y = std("#141416", 0.85), K = CHROME(), V = hdr(3.2, 3, 2.6), X = hdr(3, 0.15, 0.2), W = J.L, H = J.W, N = J.H, F = J.wr * 0.85, G = mesh(rbox(W, N, H, J.round ? 0.2 : 0.08), U);
    if (G.position.y = F + N / 2, Q.add(G), J.wedge) {
      let k = mesh(rbox(W * 0.36, N * 0.55, H * 0.96, 0.06), U);
      k.position.set(W * 0.33, F + N * 0.95, 0), k.rotation.z = -0.18, Q.add(k);
    }
    if (J.col2) {
      let k = mesh(rbox(W * 0.5, N * 1.02, H * 1.01, 0.07), std(J.col2, 0.2, 0.5));
      k.position.set(-W * 0.05, F + N / 2, 0), Q.add(k);
    }
    if (J.stripe)
      [-0.18, 0.18].forEach((k) => {
        let z = mesh(box(W * 1.002, 0.02, 0.14), std(J.stripe, 0.3));
        z.position.set(0, F + N + 0.005, k), Q.add(z);
      });
    let [_, D, O] = J.cab, I = mesh(rbox(_, D, H * J.cabT, J.box ? 0.04 : 0.12), J.box ? U : E);
    if (I.position.set(O, F + N + D / 2 - 0.02, 0), Q.add(I), J.box) {
      let k = mesh(box(_ * 0.98, D * 0.6, H * J.cabT * 1.01), E);
      k.position.set(O, F + N + D * 0.55, 0), Q.add(k);
    } else {
      let k = mesh(rbox(_ * 0.72, 0.04, H * J.cabT * 0.92, 0.02), J.glassRoof ? E : U);
      k.position.set(O - 0.04, F + N + D - 0.01, 0), Q.add(k);
    }
    if (J.bed) {
      let k = mesh(box(W * 0.38, 0.3, H * 0.96), q);
      k.position.set(-W * 0.3, F + N + 0.08, 0), Q.add(k);
    }
    if (J.spare) {
      let k = mesh(cyl(0.32, 0.32, 0.2, 18), Y);
      k.rotation.z = Math.PI / 2, k.position.set(-W / 2 - 0.08, F + N * 0.7, 0), Q.add(k);
    }
    if (J.rust)
      [[0.6, 0.2], [-0.9, -0.1]].forEach(([k, z]) => {
        let M__L = mesh(sph(0.09, 8, 6), std("#7a4a22", 0.95));
        M__L.scale.set(1.4, 0.6, 0.15), M__L.position.set(k, F + N * 0.4, H / 2 + 0.005), M__L.position.z *= z < 0 ? -1 : 1, Q.add(M__L);
      });
    if ([-1, 1].forEach((k) => {
      let z = new THREE.Mesh(J.round ? sph(0.1, 12, 8) : box(0.04, 0.08, 0.28), V);
      z.position.set(W / 2 + 0.005, F + N * 0.72, k * H * 0.33), Q.add(z);
      let M__L = new THREE.Mesh(box(0.04, 0.08, 0.3), X);
      M__L.position.set(-W / 2 - 0.005, F + N * 0.72, k * H * 0.33), Q.add(M__L);
    }), J.glow) {
      let k = new THREE.Mesh(box(W * 0.9, 0.02, H * 0.9), hdr(0.3, 1.2, 3));
      k.position.y = 0.04, Q.add(k);
    }
    let B = [];
    return [[W * 0.32, 1], [W * 0.32, -1], [-W * 0.32, 1], [-W * 0.32, -1]].forEach(([k, z]) => {
      let M__L = new THREE.Group;
      M__L.position.set(k, J.wr, z * (H / 2 - 0.06));
      let v = mesh(cyl(J.wr, J.wr, 0.24, 22), Y);
      v.rotation.x = Math.PI / 2, M__L.add(v);
      let g = mesh(cyl(J.wr * 0.62, J.wr * 0.62, 0.25, 14), K);
      g.rotation.x = Math.PI / 2, M__L.add(g), Q.add(M__L), B.push(M__L);
    }), Q.userData.spin = (k) => B.forEach((z) => {
      z.rotation.z -= k / J.wr;
    }), Q.userData.len = W, Q;
  }

export {BLK, BPEM, CARP, CARR, CHROME, COS, CREM, DIA, EXT, GOLD, M, SIGE, SIGM, SIGP, SIGS, SIGSK, SM, aura, buildCar, extra, glowTex, hat, hdr, headset, mesh, mk, monitor, patTex, rgbMat, rgbTick, screenTex, std, styleDesk, textTex};
