import * as THREE from 'three';
import {rbox} from './geo.js';
import {clamp} from './util.js';
import {F, GAMES, GH, GW, MAKE, glow, rr, screenBg, tileArt} from './games.js';
import {MAKE2} from './games2.js';

var CSS = `.vo3arc{position:absolute;inset:0;pointer-events:none;z-index:5;display:none}.vo3arc.on{display:block}
.vo3arcc{position:absolute;left:0;top:0;width:1024px;height:640px;transform-origin:0 0;opacity:0;transition:opacity .22s;pointer-events:auto;touch-action:none;cursor:pointer;outline:none}
.vo3arc.vis .vo3arcc{opacity:1}
.vo3arcx{position:absolute;top:14px;right:14px;pointer-events:auto;height:40px;padding:0 16px;border-radius:12px;border:0;background:#ff1f4f;color:#fff;font:800 12px Verdana,Geneva,sans-serif;letter-spacing:.12em;cursor:pointer;box-shadow:0 8px 30px rgba(255,31,79,.45)}
.vo3arch{position:absolute;top:22px;left:16px;font:800 10px Verdana,Geneva,sans-serif;letter-spacing:.14em;color:#ffd0da;text-shadow:0 2px 10px #000;pointer-events:none}
.vo3arcp{position:absolute;left:0;right:0;bottom:12px;display:none;justify-content:center;gap:8px;pointer-events:none}
.vo3arc.touch .vo3arcp{display:flex}
.vo3arcp button{pointer-events:auto;min-width:58px;height:54px;border-radius:16px;border:1px solid rgba(255,255,255,.2);background:rgba(12,6,12,.78);color:#fff;font:800 14px Verdana,Geneva,sans-serif;touch-action:none;-webkit-user-select:none;user-select:none}
.vo3arcp button.on{background:#ff1f4f}
.vo3.arcon .vo3l,.vo3.arcon .vo3top{display:none}
.vo3arcon .vodk{display:none!important}`;
var TKEYS = { stack: [["ArrowLeft", "&#9664;"], ["ArrowRight", "&#9654;"], ["ArrowUp", "&#10227;"], ["ArrowDown", "&#9660;"], [" ", "DROP"]], snake: [["ArrowLeft", "&#9664;"], ["ArrowUp", "&#9650;"], ["ArrowDown", "&#9660;"], ["ArrowRight", "&#9654;"]], paddle: [["ArrowUp", "&#9650;"], ["ArrowDown", "&#9660;"]], bricks: [["ArrowLeft", "&#9664;"], [" ", "LAUNCH"], ["ArrowRight", "&#9654;"]], trivia: [] };
var GN = { stack: "STACKER", paddle: "PADDLE DUEL", snake: "SNAKE", bricks: "BRICK BREAK", trivia: "POLICY TRIVIA" };
var TWO = new Set(GAMES.filter(($) => $.two).map(($) => $.k));
var first = ($) => String($ || "Teammate").split(" ")[0].toUpperCase();
var SW = 0.66;
var SH = 0.4125;
var SK = 1.02;
class Arcade {
    constructor($) {
      if (this.O = $, this.on = false, this.ph = "", this.game = null, this.sel = 0, this.best = {}, this.t = 0, this.k = 0, this.preT = 0, this.view = "menu", this.mode = null, this.mp = null, this.btn = [], this.bsel = 0, this.seenQ = {}, this.qT = 0, !document.getElementById("vo3arccss")) {
        let Z = document.createElement("style");
        Z.id = "vo3arccss", Z.textContent = CSS, document.head.appendChild(Z);
      }
      let J = this.ui = document.createElement("div");
      J.className = "vo3arc", J.innerHTML = '<canvas class=vo3arcc width=2048 height=1280 tabindex=0 aria-label="Desk computer game"></canvas><div class=vo3arch>OWQ ARCADE</div><button class=vo3arcx>EXIT</button><div class=vo3arcp></div>', $.el.appendChild(J), this.cv = J.querySelector("canvas"), this.x = this.cv.getContext("2d"), this.pad = J.querySelector(".vo3arcp"), J.querySelector(".vo3arcx").onclick = (Z) => {
        Z.stopPropagation(), this.exit();
      };
      let Q = (Z, U) => {
        if (!this.on || this.ph !== "play")
          return;
        let q = this.local(U.clientX, U.clientY);
        if (!q)
          return;
        if (Z === "down")
          try {
            this.cv.setPointerCapture(U.pointerId);
          } catch (E) {}
        this.ptr(Z, q.x, q.y), U.preventDefault();
      };
      this.cv.addEventListener("pointerdown", (Z) => Q("down", Z)), this.cv.addEventListener("pointermove", (Z) => Q("move", Z)), this.cv.addEventListener("pointerup", (Z) => Q("up", Z)), this.cv.addEventListener("pointercancel", (Z) => Q("up", Z)), this.kd = (Z) => this.keyEv(Z, true), this.ku = (Z) => this.keyEv(Z, false);
      try {
        this.coarse = matchMedia("(pointer: coarse)").matches;
      } catch (Z) {
        this.coarse = false;
      }
    }
    can($) {
      let J = this.O;
      return !!($ && $.me && $.seat && $.mode === "seated" && !J.busy($) && !$.leaving && $.root.visible && !(J.drive && J.drive.me));
    }
    enter() {
      let $ = this.O, J = $.meAv;
      if (this.on)
        return true;
      if (!this.can(J))
        return $.ui.toast(J && J.me ? "Sit at your desk first, then click your computer." : "Walk onto the floor first."), false;
      if (this.on = true, this.ph = "play", this.a = J, this.d = $.room.desks[J.seat.i], this.t0 = $.t, this.game = null, this.view = "menu", this.sel = this.sel || 0, this.mon = this.monitor(J.seat), $.room.group.add(this.mon), $.warm && $.warm(this.mon), J.rig)
        J.rig.visible = false;
      if (this.d && this.d.sty)
        this.d.sty.visible = false;
      if (this.ui.classList.add("on"), this.ui.classList.toggle("touch", !!this.coarse), $.el.classList.add("arcon"), $.el.parentNode)
        $.el.parentNode.classList.add("vo3arcon");
      return $.dir.manualT = 0, $.dir.yaw = $.dir.pitch = 0, $.dir.zoom = 1, $.ui.hideCard(), addEventListener("keydown", this.kd, true), addEventListener("keyup", this.ku, true), this.padFor(null), this.say("menu", 1), $.sfx("whoosh"), setTimeout(() => {
        try {
          this.cv.focus({ preventScroll: true });
        } catch (Q) {}
      }, 300), true;
    }
    exit() {
      let $ = this.O;
      if (!this.on)
        return;
      if (this.on = false, this.ph = "", this.game && !this.game.vs && !this.game.over && this.game.score > 0)
        this.done(this.game.k, this.game.score, 1);
      if (this.game = null, this.cancelQ(), this.view = "menu", this.ui.classList.remove("on", "vis"), $.el.classList.remove("arcon"), $.el.parentNode)
        $.el.parentNode.classList.remove("vo3arcon");
      removeEventListener("keydown", this.kd, true), removeEventListener("keyup", this.ku, true);
      let J = this.a, Q = this.d, Z = this.mon;
      if (this.mon = null, setTimeout(() => {
        if (J && J.rig)
          J.rig.visible = true;
        if (Q && Q.sty)
          Q.sty.visible = true;
      }, 380), Z)
        Z.userData.out = $.t;
      this.outMon = Z, this.say(null), $.sfx("whoosh");
    }
    monitor($) {
      let J = new THREE.Group;
      J.name = "arcmon";
      let Q = new THREE.Vector3($.x, 1.25, $.z - 0.52), Z = new THREE.Vector3($.x, SK, $.z + 0.07), U = Math.atan2(Q.y - Z.y, Z.z - Q.z), q = new THREE.Mesh(rbox(SW + 0.04, SH + 0.04, 0.028, 0.012), new THREE.MeshStandardMaterial({ color: 723727, roughness: 0.3, metalness: 0.6 }));
      q.position.z = -0.016, J.add(q);
      let E = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ color: 328455 }));
      E.position.z = 0.0005, J.add(E);
      let Y = new THREE.Mesh(new THREE.BoxGeometry(SW * 0.6, 0.006, 0.004), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.25, 0.55), toneMapped: false }));
      Y.position.set(0, -SH / 2 - 0.012, 0.003), J.add(Y);
      let K = new THREE.Group;
      J.add(K);
      let V = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.025), new THREE.MeshStandardMaterial({ color: 1447451, roughness: 0.35, metalness: 0.7 }));
      return V.position.set(0, -SH / 2 - 0.09, -0.04), K.add(V), J.position.copy(Z), J.position.y = Z.y - 0.6, J.rotation.order = "YXZ", J.rotation.y = Math.PI, J.rotation.x = -U, J.userData = { c: Z, phi: U, in: this.O.t, k: 0 }, J;
    }
    corners() {
      let $ = this.mon;
      if (!$)
        return null;
      return $.updateWorldMatrix(true, false), [[-SW / 2, SH / 2], [SW / 2, SH / 2], [SW / 2, -SH / 2], [-SW / 2, -SH / 2]].map(([J, Q]) => new THREE.Vector3(J, Q, 0.001).applyMatrix4($.matrixWorld));
    }
    cam($, J, Q) {
      if (!this.on || !this.mon)
        return 0;
      let Z = this.mon.userData, U = Z.c, q = Z.phi, E = 50, Y = Math.tan(E * Math.PI / 360), K = Y * Q, V = Math.max(0.5, SH / 2 * 1.1 / Y, SW / 2 * 1.08 / K), X = new THREE.Vector3(0, Math.sin(q), -Math.cos(q));
      return $.copy(U).addScaledVector(X, V), J.copy(U), this.tP = this.tP || new THREE.Vector3, this.tP.copy($), E;
    }
    tick($, J) {
      let Q = this.O;
      this.t = J;
      let Z = (U, q) => {
        let E = clamp((J - (q ? U.userData.in : U.userData.out)) / 0.45, 0, 1), Y = q ? 1 - Math.pow(1 - E, 3) : 1 - E * E;
        return U.position.y = U.userData.c.y - (1 - Y) * 0.6, U.userData.k = q ? E : 0, E;
      };
      if (this.mon)
        Z(this.mon, true);
      if (this.outMon) {
        if (Z(this.outMon, false) >= 1)
          Q.room.group.remove(this.outMon), this.outMon = null;
      }
      if (J - this.qT > 1)
        this.qT = J, this.notice();
      if (!this.on)
        return;
      if (this.a && (this.a.leaving || !Q.av.has(this.a.id))) {
        this.exit();
        return;
      }
      if (this.mmTick(), this.game && !document.hidden)
        try {
          this.game.update(Math.min($, 0.05));
        } catch (U) {
          console.warn("VO3 game", U), this.game = null, this.view = "menu", this.cancelQ();
        }
      if (this.draw(J), J - (this._sayT || 0) > 1.5)
        this._sayT = J, this.say(this.game ? this.game.k : this.view === "queue" && this.mp ? this.mp.g : "menu");
    }
    place() {
      if (!this.on)
        return;
      let $ = this.corners(), J = this.O;
      if (!$)
        return;
      let Q = J.cv.getBoundingClientRect(), Z = J.el.getBoundingClientRect(), U = Q.width / (J.W || Q.width), q = Q.height / (J.H || Q.height), E = $.map((K) => {
        let V = J.scr(K);
        return [Q.left - Z.left + V.x * U, Q.top - Z.top + V.y * q, V.z];
      });
      if (E.some((K) => K[2] > 1))
        return;
      this.H = homog(E, 1024, 640), this.cv.style.transform = this.H.css;
      let Y = this.tP ? J.cam.position.distanceTo(this.tP) : 1;
      this.ui.classList.toggle("vis", Y < 0.06 && this.mon && this.mon.userData.k >= 1);
    }
    local($, J) {
      if (!this.H)
        return null;
      let Q = this.O.el.getBoundingClientRect(), Z = $ - Q.left, U = J - Q.top, q = this.H.m, E = q[0] - q[6] * Z, Y = q[1] - q[7] * Z, K = Z - q[2], V = q[3] - q[6] * U, X = q[4] - q[7] * U, W = U - q[5], H = E * X - Y * V;
      if (Math.abs(H) < 0.000000001)
        return null;
      let N = (K * X - Y * W) / H, F__L = (E * W - K * V) / H;
      return { x: N * GW, y: F__L * GH };
    }
    api($, ...J) {
      try {
        let Q = this.O.api && this.O.api[$];
        return typeof Q === "function" ? Q.apply(this.O.api, J) : undefined;
      } catch (Q) {
        return;
      }
    }
    now() {
      let $ = this.api("now");
      return typeof $ === "number" && isFinite($) ? $ : Date.now();
    }
    peers() {
      let $ = this.api("arcPeers");
      return Array.isArray($) ? $ : [];
    }
    waiting($) {
      let J = this.now();
      return this.peers().filter((Q) => !Q.me && Q.aq && Q.aq.st === "w" && (!$ || Q.aq.g === $) && J - (+Q.aq.t || 0) < 1200000).sort((Q, Z) => Q.aq.t - Z.aq.t);
    }
    setQ($) {
      this.api("arcQ", $);
    }
    queue($) {
      let J = this.now();
      this.mp = { g: $, st: "w", t: J, since: this.O.t }, this.setQ({ g: $, st: "w", t: J }), this.view = "queue", this.bsel = 0, this.say($, 1), this.beep(660, 0.06, "triangle", 0.04);
    }
    joinP($, J, Q) {
      let Z = this.now();
      this.mp = { g: $, st: "j", t: Z, to: J, them: Q, jT: this.O.t, since: this.O.t }, this.setQ({ g: $, st: "j", t: Z, to: J }), this.view = "queue", this.bsel = 0, this.beep(660, 0.06, "triangle", 0.04);
    }
    cancelQ() {
      let $ = this.mp;
      if (this.mp = null, $ && $.N) {
        try {
          $.N.send({ bye: 1 });
        } catch (J) {}
        setTimeout(() => {
          try {
            $.N.leave();
          } catch (J) {}
        }, 300);
      }
      this.setQ(null);
    }
    myId() {
      let $ = this.peers().find((J) => J.me);
      return $ ? $.id : "";
    }
    mmTick() {
      let $ = this.mp;
      if (!$)
        return;
      let J = this.O;
      if ($.st === "conn") {
        if ($.N) {
          if ($.N.peer()) {
            this.game = new MAKE2[$.g](this.helpers(), $.N), $.st = "game", this.view = "game", this.setQ(null), this.padFor($.g), this.say($.g, 1), this.beep(880, 0.12, "triangle", 0.05);
            return;
          }
        }
        if (J.t - $.cT > 12) {
          J.ui.toast(($.them ? first($.them) : "Your partner") + " did not connect. You are back in the queue.");
          let q = $.g;
          this.cancelQ(), this.queue(q);
        }
        return;
      }
      if ($.st === "game")
        return;
      let Q = this.peers(), Z = this.myId();
      if (!Z)
        return;
      let U = Q.filter((q) => !q.me && q.aq && q.aq.g === $.g);
      if ($.st === "w") {
        let q = U.filter((Y) => Y.aq.st === "j" && Y.aq.to === Z).sort((Y, K) => Y.aq.t - K.aq.t);
        if (q.length) {
          let Y = q[0], K = ("m" + Z + "x" + Math.round($.t)).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
          $.st = "p", $.to = Y.id, $.mid = K, $.role = "h", $.them = Y.nm, this.setQ({ g: $.g, st: "p", t: $.t, to: Y.id, mid: K }), this.connect();
          return;
        }
        let E = U.filter((Y) => Y.aq.st === "w" && (Y.aq.t < $.t || Y.aq.t === $.t && Y.id < Z)).sort((Y, K) => Y.aq.t - K.aq.t);
        if (E.length) {
          this.joinP($.g, E[0].id, E[0].nm);
          return;
        }
      } else if ($.st === "j") {
        let q = Q.find((E) => E.id === $.to);
        if (q && q.aq && q.aq.st === "p" && q.aq.to === Z && q.aq.mid) {
          $.st = "p", $.mid = String(q.aq.mid), $.role = "g", $.them = q.nm, this.connect();
          return;
        }
        if (!q || !q.aq || q.aq.g !== $.g || q.aq.st === "p" && q.aq.to !== Z || J.t - $.jT > 9)
          J.ui.toast((q ? first(q.nm) : "They") + " found another player. You are in the queue now."), this.queue($.g);
      }
    }
    async connect() {
      let $ = this.mp;
      if (!$)
        return;
      $.st = "conn", $.cT = this.O.t;
      let J = null;
      try {
        J = await this.api("arcNet", $.mid);
      } catch (Q) {
        J = null;
      }
      if (this.mp !== $) {
        try {
          J && J.leave && J.leave();
        } catch (Q) {}
        return;
      }
      if (!J) {
        this.O.ui.toast("Could not open the game room. Try again."), this.mp = null, this.setQ(null), this.view = "mode";
        return;
      }
      J.role = $.role, J.me = this.a ? this.a.nm : "You", J.them = $.them, $.N = J, $.cT = this.O.t;
    }
    notice() {
      this.waiting().forEach((J) => {
        let Q = J.id + "|" + J.aq.t;
        if (this.seenQ[Q])
          return;
        if (this.seenQ[Q] = 1, this.mp || this.game && this.game.vs)
          return;
        if (this.now() - J.aq.t > 60000)
          return;
        this.O.ui.toast(first(J.nm) + " wants a " + (GN[J.aq.g] || "game") + " partner. Click your computer to join.", 4200);
      });
    }
    joinFrom($) {
      let J = this.O, Q = $ && $.p && $.p.aq;
      if (!Q || Q.st !== "w") {
        J.ui.toast("They are not waiting for a partner any more.");
        return;
      }
      if (!this.on && !this.enter())
        return;
      if (this.game)
        this.game = null, this.padFor(null);
      this.cancelQ(), this.joinP(Q.g, $.id, $.nm);
    }
    draw($) {
      let J = this.x;
      if (J.setTransform(2, 0, 0, 2, 0, 0), this.game) {
        this.game.draw(J, $);
        return;
      }
      if (this.view === "mode") {
        this.drawMode(J, $);
        return;
      }
      if (this.view === "queue") {
        this.drawQueue(J, $);
        return;
      }
      screenBg(J, $), glow(J, "OWQ ARCADE", GW / 2, 74, "#ff1f4f", 54), J.font = F("700", 14), J.fillStyle = "#b9a3ad", J.textAlign = "center", J.textBaseline = "middle", J.fillText("A QUICK BREAK BETWEEN CALLS. PICK A GAME.", GW / 2, 118);
      let Q = this.top(), Z = this.waiting();
      GAMES.forEach((U, q) => {
        let E = this.tile(q), Y = q === this.sel, K = U.two ? Z.filter((V) => V.aq.g === U.k) : [];
        if (J.save(), Y)
          J.shadowColor = "#ff1f4f", J.shadowBlur = 26;
        if (J.fillStyle = Y ? "rgba(255,31,79,.14)" : "rgba(255,255,255,.04)", rr(J, E[0], E[1], E[2], E[3], 16), J.fill(), J.restore(), J.strokeStyle = K.length ? "#3ddc97" : Y ? "#ff1f4f" : "rgba(255,255,255,.14)", J.lineWidth = Y || K.length ? 3 : 2, rr(J, E[0], E[1], E[2], E[3], 16), J.stroke(), tileArt(J, U.k, E[0] + 20, E[1] + 14, E[2] - 40, 84, $), U.two) {
          J.font = F("900", 10);
          let V = 56;
          J.fillStyle = "#10232e", rr(J, E[0] + E[2] - V - 12, E[1] + 12, V, 20, 10), J.fill(), J.strokeStyle = "rgba(76,201,240,.55)", J.lineWidth = 1.5, J.stroke(), J.fillStyle = "#8fdcff", J.textAlign = "center", J.fillText("1-2 P", E[0] + E[2] - V / 2 - 12, E[1] + 22);
        }
        if (J.textAlign = "left", J.font = F("900", 19), J.fillStyle = "#fff", J.fillText(U.n, E[0] + 20, E[1] + 118), J.font = F("600", 12), J.fillStyle = "#b9a3ad", J.fillText(U.d, E[0] + 20, E[1] + 140), K.length)
          J.fillStyle = "rgba(61,220,151,.18)", rr(J, E[0] + 12, E[1] + 152, E[2] - 24, 24, 9), J.fill(), J.font = F("900", 11), J.fillStyle = "#8ef0c2", J.textAlign = "center", J.fillText(first(K[0].nm) + (K.length > 1 ? " +" + (K.length - 1) : "") + " IS WAITING  -  JOIN", E[0] + E[2] / 2, E[1] + 164), J.textAlign = "left";
        else {
          let V = (Q[U.k] || [])[0], X = this.bestOf(U.k);
          J.font = F("800", 11), J.fillStyle = "#ffd166", J.fillText("YOUR BEST " + X, E[0] + 20, E[1] + 164), J.fillStyle = "#8ef0c2", J.textAlign = "right", J.fillText(V ? String(V[0]).split(" ")[0].toUpperCase() + " " + V[1] : "NO TEAM SCORE YET", E[0] + E[2] - 18, E[1] + 164);
        }
      }), J.textAlign = "center", J.font = F("800", 13), J.fillStyle = "#8f7d87", J.fillText("ARROWS + ENTER OR CLICK   -   ESC GOES BACK TO THE FLOOR", GW / 2, GH - 24);
    }
    button($, J, Q, Z, U, q, E) {
      let [Y, K, V, X] = Q;
      if ($.save(), E)
        $.shadowColor = q, $.shadowBlur = 24;
      if ($.fillStyle = E ? q : "rgba(255,255,255,.05)", rr($, Y, K, V, X, 16), $.fill(), $.restore(), $.strokeStyle = q, $.lineWidth = 3, rr($, Y, K, V, X, 16), $.stroke(), $.textAlign = "center", $.textBaseline = "middle", $.font = F("900", 20), $.fillStyle = E ? "#0b0710" : "#fff", $.fillText(Z, Y + V / 2, K + X / 2 - (U ? 11 : 0)), U)
        $.font = F("700", 12), $.fillStyle = E ? "rgba(11,7,16,.8)" : "#b9a3ad", $.fillText(U, Y + V / 2, K + X / 2 + 15);
      this.btn[J] = Q;
    }
    modeBtns() {
      let $ = this.mode, J = this.waiting($).slice(0, 3), Q = [{ a: "solo", l: "PLAY SOLO", s: $ === "paddle" ? "Against the CPU" : "Just you, beat your best", c: "#4cc9f0" }, { a: "queue", l: "FIND A PARTNER", s: "Join the queue. Anyone at their desk can join you", c: "#ff1f4f" }];
      return J.forEach((Z) => Q.push({ a: "join", p: Z, l: "JOIN " + first(Z.nm), s: "Waiting now", c: "#3ddc97" })), Q;
    }
    drawMode($, J) {
      screenBg($, J);
      let Q = this.mode;
      glow($, GN[Q] || "GAME", GW / 2, 84, "#ff1f4f", 50), $.font = F("700", 14), $.fillStyle = "#b9a3ad", $.textAlign = "center", $.textBaseline = "middle", $.fillText("PLAY ON YOUR OWN OR AGAINST A TEAMMATE AT ANOTHER DESK", GW / 2, 128), tileArt($, Q, GW / 2 - 130, 150, 260, 90, J);
      let Z = this.modeBtns();
      if (this.btn = [], this.bsel = Math.min(this.bsel, Z.length - 1), Z.slice(0, 2).forEach((U, q) => this.button($, q, [GW / 2 - 370 + q * 380, 270, 360, 96], U.l, U.s, U.c, this.bsel === q)), Z.length > 2)
        $.font = F("800", 12), $.fillStyle = "#8ef0c2", $.fillText("WAITING FOR A PARTNER RIGHT NOW", GW / 2, 398), Z.slice(2).forEach((U, q) => {
          let E = Z.length - 2, V = GW / 2 - (E * 240 + (E - 1) * 20) / 2;
          this.button($, 2 + q, [V + q * 260, 416, 240, 74], U.l, U.s, U.c, this.bsel === 2 + q);
        });
      $.font = F("800", 13), $.fillStyle = "#8f7d87", $.fillText("ARROWS + ENTER OR CLICK   -   ESC BACK", GW / 2, GH - 24);
    }
    drawQueue($, J) {
      screenBg($, J);
      let Q = this.mp;
      if (!Q) {
        this.view = "menu";
        return;
      }
      let Z = Q.g;
      glow($, Q.st === "w" ? "LOOKING FOR A PARTNER" : Q.st === "j" ? "JOINING " + first(Q.them) : "CONNECTING", GW / 2, 84, Q.st === "w" ? "#ffd166" : "#3ddc97", 40), $.font = F("800", 18), $.fillStyle = "#fff", $.textAlign = "center", $.textBaseline = "middle", $.fillText(GN[Z] || "GAME", GW / 2, 128);
      let U = GW / 2, q = 245;
      for (let Y = 0;Y < 3; Y++) {
        let K = (J * 0.6 + Y / 3) % 1;
        $.strokeStyle = `rgba(255,31,79,${0.6 * (1 - K)})`, $.lineWidth = 3, $.beginPath(), $.arc(U, q, 20 + K * 90, 0, Math.PI * 2), $.stroke();
      }
      $.save(), $.shadowColor = "#ff1f4f", $.shadowBlur = 20, $.fillStyle = "#ff1f4f", $.beginPath(), $.arc(U, q, 14, 0, Math.PI * 2), $.fill(), $.restore();
      let E = Math.max(0, Math.floor(this.O.t - (Q.since || this.O.t)));
      $.font = F("900", 16), $.fillStyle = "#ffd166", $.fillText(Math.floor(E / 60) + ":" + String(E % 60).padStart(2, "0"), GW / 2, 360), $.font = F("700", 14), $.fillStyle = "#b9a3ad", $.fillText(Q.st === "w" ? "Everyone on the Sales Floor can see you are waiting. Anyone at their desk can join from their computer." : Q.st === "j" ? "Asking " + first(Q.them) + " to start the game..." : "Opening the game with " + first(Q.them) + "...", GW / 2, 392), this.btn = [], this.bsel = Math.min(this.bsel, 1), this.button($, 0, [GW / 2 - 370, 440, 360, 84], "PLAY SOLO INSTEAD", "Leave the queue and play now", "#4cc9f0", this.bsel === 0), this.button($, 1, [GW / 2 + 10, 440, 360, 84], "CANCEL", "Back to the arcade menu", "#ff1f4f", this.bsel === 1), $.font = F("800", 13), $.fillStyle = "#8f7d87", $.fillText("ESC CANCEL", GW / 2, GH - 24);
    }
    tile($) {
      if ($ < 3)
        return [(GW - 922) / 2 + $ * 316, 150, 290, 184];
      return [(GW - 606) / 2 + ($ - 3) * 316, 360, 290, 184];
    }
    helpers() {
      return { beep: ($, J, Q, Z) => this.beep($, J, Q, Z), best: ($) => this.bestOf($), top: ($) => this.top()[$] || [], done: ($, J) => this.done($, J) };
    }
    pick($) {
      if (TWO.has($)) {
        this.mode = $, this.view = "mode";
        let J = this.waiting($);
        this.bsel = J.length ? 2 : 0, this.beep(520, 0.03, "square", 0.03);
        return;
      }
      this.start($);
    }
    start($) {
      let J = MAKE[$];
      if (!J)
        return;
      this.cancelQ(), this.view = "game", this.game = new J(this.helpers()), this.padFor($), this.say($, 1), this.beep(660, 0.08, "triangle", 0.05);
    }
    modeAct($) {
      if (this.view === "mode") {
        let J = this.modeBtns()[$];
        if (!J)
          return;
        if (J.a === "solo")
          this.start(this.mode);
        else if (J.a === "queue")
          this.queue(this.mode);
        else if (J.a === "join")
          this.joinP(this.mode, J.p.id, J.p.nm);
      } else if (this.view === "queue") {
        let J = this.mp ? this.mp.g : this.mode;
        if ($ === 0)
          this.start(J);
        else
          this.cancelQ(), this.view = "mode", this.mode = J;
      }
    }
    back() {
      if (this.game) {
        let $ = this.game.vs, J = this.game.k;
        if (this.game = null, this.padFor(null), $)
          this.cancelQ(), this.mode = J, this.view = "mode";
        else
          this.view = "menu";
        this.say("menu", 1);
        return;
      }
      if (this.view === "queue") {
        let $ = this.mp ? this.mp.g : this.mode;
        this.cancelQ(), this.view = "mode", this.mode = $;
        return;
      }
      if (this.view === "mode") {
        this.view = "menu";
        return;
      }
      this.exit();
    }
    keyEv($, J) {
      if (!this.on)
        return;
      let Q = $.target;
      if (Q && (Q.tagName === "INPUT" || Q.tagName === "TEXTAREA" || Q.isContentEditable) && Q !== this.cv)
        return;
      let Z = $.key;
      if (Z && Z.length === 1)
        Z = Z.toLowerCase();
      if (!new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter", "Escape", "w", "a", "s", "d", "x", "z", "q", "1", "2", "3", "4", "b", "c", "p"]).has(Z))
        return;
      if ($.preventDefault(), $.stopPropagation(), Z === "Escape") {
        if (J)
          this.back();
        return;
      }
      if (this.game) {
        if (this.game.key(Z, J) === "again")
          this.start(this.game.k);
        return;
      }
      if (!J)
        return;
      if (this.view === "mode" || this.view === "queue") {
        let q = this.view === "mode" ? this.modeBtns().length : 2;
        if (Z === "ArrowRight" || Z === "d" || Z === "ArrowDown" || Z === "s")
          this.bsel = (this.bsel + 1) % q;
        else if (Z === "ArrowLeft" || Z === "a" || Z === "ArrowUp" || Z === "w")
          this.bsel = (this.bsel + q - 1) % q;
        else if (Z === "Enter" || Z === " ")
          this.modeAct(this.bsel);
        else if (Z === "1" || Z === "2" || Z === "3" || Z === "4")
          this.modeAct(+Z - 1);
        this.beep(440, 0.02, "square", 0.02);
        return;
      }
      if (Z === "ArrowRight" || Z === "d")
        this.sel = (this.sel + 1) % GAMES.length;
      else if (Z === "ArrowLeft" || Z === "a")
        this.sel = (this.sel + GAMES.length - 1) % GAMES.length;
      else if (Z === "ArrowDown" || Z === "s")
        this.sel = this.sel < 3 ? Math.min(GAMES.length - 1, this.sel + 3) : this.sel;
      else if (Z === "ArrowUp" || Z === "w")
        this.sel = this.sel >= 3 ? this.sel - 3 : this.sel;
      else if (Z === "Enter" || Z === " ")
        this.pick(GAMES[this.sel].k);
      this.beep(440, 0.02, "square", 0.02);
    }
    ptr($, J, Q) {
      if (this.game) {
        if (this.game.over && $ === "down" && !this.game.vs) {
          this.start(this.game.k);
          return;
        }
        if (this.game.ptr)
          this.game.ptr($, J, Q);
        return;
      }
      if (this.view === "mode" || this.view === "queue") {
        let Z = this.btn.findIndex((U) => U && J > U[0] && J < U[0] + U[2] && Q > U[1] && Q < U[1] + U[3]);
        if (Z < 0)
          return;
        if ($ === "move")
          this.bsel = Z;
        else if ($ === "down")
          this.modeAct(Z);
        return;
      }
      if ($ === "move") {
        GAMES.forEach((Z, U) => {
          let q = this.tile(U);
          if (J > q[0] && J < q[0] + q[2] && Q > q[1] && Q < q[1] + q[3])
            this.sel = U;
        });
        return;
      }
      if ($ === "down")
        GAMES.forEach((Z, U) => {
          let q = this.tile(U);
          if (J > q[0] && J < q[0] + q[2] && Q > q[1] && Q < q[1] + q[3]) {
            let E = Z.two ? this.waiting(Z.k) : [];
            if (E.length)
              this.mode = Z.k, this.joinP(Z.k, E[0].id, E[0].nm);
            else
              this.pick(Z.k);
          }
        });
    }
    padFor($) {
      let J = $ ? TKEYS[$] || [] : [];
      this.pad.innerHTML = J.map(([Q, Z]) => `<button data-k="${Q}">${Z}</button>`).join(""), this.pad.querySelectorAll("button").forEach((Q) => {
        let Z = Q.dataset.k, U = (E) => {
          if (E.preventDefault(), Q.classList.add("on"), this.game) {
            if (this.game.key(Z, true) === "again")
              this.start(this.game.k);
          }
        }, q = (E) => {
          if (Q.classList.remove("on"), this.game)
            this.game.key(Z, false);
        };
        Q.addEventListener("pointerdown", U), Q.addEventListener("pointerup", q), Q.addEventListener("pointerleave", q), Q.addEventListener("pointercancel", q);
      });
    }
    top() {
      try {
        return this.O.api.arcTop && this.O.api.arcTop() || {};
      } catch ($) {
        return {};
      }
    }
    bestOf($) {
      let J = this.best[$] || 0, Q = this.O.meAv;
      (this.top()[$] || []).forEach((Z) => {
        if (Q && Z[0] === Q.nm)
          J = Math.max(J, +Z[1] || 0);
      });
      try {
        let Z = this.O.api.arcMine && this.O.api.arcMine();
        if (Z && Z[$])
          J = Math.max(J, +Z[$] || 0);
      } catch (Z) {}
      return J;
    }
    done($, J, Q) {
      J = Math.max(0, Math.round(J || 0));
      let Z = this.bestOf($);
      if (J > (this.best[$] || 0))
        this.best[$] = J;
      try {
        this.O.api.arcScore && this.O.api.arcScore($, J);
      } catch (U) {}
      if (!Q && J > Z && J > 0)
        this.beep(1568, 0.3, "triangle", 0.05);
    }
    say($, J) {
      let Q = this.O;
      try {
        if (!Q.api.arcade)
          return;
        let Z = this.game, U = this.mp, q = $ ? { g: $, s: Z ? Math.round(Z.score || 0) : 0 } : null;
        if (q && Z && Z.vs && Z.N)
          q.vs = String(Z.N.them || "").slice(0, 40);
        if (q && !Z && U && (U.st === "w" || U.st === "j"))
          q.q = 1;
        let E = JSON.stringify(q);
        if (!J && E === this._said)
          return;
        this._said = E, Q.api.arcade(q);
      } catch (Z) {}
    }
    beep($, J, Q, Z) {
      let U = this.O;
      if (!U.opts.sfx)
        return;
      let q = U.lv && U.lv.ac;
      if (!q || q.state !== "running")
        return;
      try {
        let E = q.currentTime, Y = q.createOscillator(), K = q.createGain();
        Y.type = Q || "square", Y.frequency.value = $, K.gain.setValueAtTime(Z || 0.03, E), K.gain.exponentialRampToValueAtTime(0.0001, E + (J || 0.05)), Y.connect(K), K.connect(q.destination), Y.start(E), Y.stop(E + (J || 0.05) + 0.02);
      } catch (E) {}
    }
  }
function homog($, J, Q) {
    let [Z, U] = $[0], [q, E] = $[1], [Y, K] = $[2], [V, X] = $[3], W = q - Y, H = V - Y, N = E - K, F__L = X - K, G = Z - q + Y - V, _ = U - E + K - X, D = W * F__L - H * N, O = 0, I = 0;
    if (Math.abs(D) > 0.000000001)
      O = (G * F__L - H * _) / D, I = (W * _ - G * N) / D;
    let B = q - Z + O * q, k = V - Z + I * V, z = E - U + O * E, M = X - U + I * X, v = (g) => +g.toFixed(8);
    return { m: [B, k, Z, z, M, U, O, I], css: `matrix3d(${v(B / J)},${v(z / J)},0,${v(O / J)},${v(k / Q)},${v(M / Q)},0,${v(I / Q)},0,0,1,0,${v(Z)},${v(U)},0,1)` };
  }
function holoCv($, J, Q) {
    let Z = document.createElement("canvas");
    Z.width = 1024, Z.height = 256;
    let U = Z.getContext("2d");
    U.textAlign = "center", U.textBaseline = "middle", U.fillStyle = "rgba(8,4,10,.82)", U.beginPath();
    let q = 40, E = 22, Y = 40, K = 980, V = 176;
    U.moveTo(E + q, Y), U.arcTo(E + K, Y, E + K, Y + V, q), U.arcTo(E + K, Y + V, E, Y + V, q), U.arcTo(E, Y + V, E, Y, q), U.arcTo(E, Y, E + K, Y, q), U.closePath(), U.fill(), U.lineWidth = 6, U.strokeStyle = Q, U.stroke(), U.font = "800 40px Verdana,sans-serif", U.fillStyle = Q, U.fillText(String(J || "").toUpperCase().slice(0, 40), 512, 92);
    let X = 74;
    U.font = `900 ${X}px Verdana,sans-serif`;
    while (X > 34 && U.measureText(String($)).width > 930)
      X -= 4, U.font = `900 ${X}px Verdana,sans-serif`;
    U.shadowColor = Q, U.shadowBlur = 26, U.fillStyle = "#fff", U.fillText(String($ || "").slice(0, 40), 512, 166);
    let W = new THREE.CanvasTexture(Z);
    return W.colorSpace = THREE.SRGBColorSpace, W;
  }

export {Arcade, holoCv};
