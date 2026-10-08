var GW = 1024;
var GH = 640;
var GAMES = [{ k: "stack", n: "STACKER", d: "Drop and clear lines" }, { k: "paddle", n: "PADDLE DUEL", d: "Vs the CPU or a teammate", two: 1 }, { k: "snake", n: "SNAKE", d: "Solo or head to head", two: 1 }, { k: "bricks", n: "BRICK BREAK", d: "Smash every brick" }, { k: "trivia", n: "POLICY TRIVIA", d: "Solo or a 2-player race", two: 1 }];
var COLS = ["#ff1f4f", "#ffd166", "#3ddc97", "#4cc9f0", "#b388ff", "#ff8a3d", "#f4f4f6"];
var F = ($, J) => `${$} ${J}px Verdana,Geneva,sans-serif`;
function rr($, J, Q, Z, U, q) {
    $.beginPath(), $.moveTo(J + q, Q), $.arcTo(J + Z, Q, J + Z, Q + U, q), $.arcTo(J + Z, Q + U, J, Q + U, q), $.arcTo(J, Q + U, J, Q, q), $.arcTo(J, Q, J + Z, Q, q), $.closePath();
  }
function glow($, J, Q, Z, U, q, E) {
    $.save(), $.font = F("900", q), $.textAlign = E || "center", $.textBaseline = "middle", $.shadowColor = U, $.shadowBlur = q * 0.45, $.fillStyle = U, $.fillText(J, Q, Z), $.shadowBlur = 0, $.fillStyle = "#fff", $.globalAlpha = 0.85, $.fillText(J, Q, Z), $.restore();
  }
function screenBg($, J) {
    $.fillStyle = "#07040a", $.fillRect(0, 0, 1024, 640);
    let Q = $.createRadialGradient(512, 288, 40, 512, 320, 716.8);
    Q.addColorStop(0, "rgba(255,31,79,.10)"), Q.addColorStop(1, "rgba(0,0,0,0)"), $.fillStyle = Q, $.fillRect(0, 0, 1024, 640), $.strokeStyle = "rgba(255,31,79,.07)", $.lineWidth = 1;
    for (let Z = 0;Z <= 1024; Z += 32)
      $.beginPath(), $.moveTo(Z, 0), $.lineTo(Z, 640), $.stroke();
    for (let Z = 0;Z <= 640; Z += 32)
      $.beginPath(), $.moveTo(0, Z), $.lineTo(1024, Z), $.stroke();
  }
function topBar($, J, Q, Z) {
    if ($.fillStyle = "rgba(10,5,10,.9)", $.fillRect(0, 0, 1024, 52), $.fillStyle = "#ff1f4f", $.fillRect(0, 50, 1024, 2), $.font = F("900", 22), $.textBaseline = "middle", $.textAlign = "left", $.fillStyle = "#fff", $.fillText(J, 22, 27), $.textAlign = "right", $.fillStyle = "#ffd166", $.fillText(String(Q).replace(/\B(?=(\d{3})+(?!\d))/g, ","), 1002, 27), Z)
      $.font = F("700", 14), $.fillStyle = "#b9a3ad", $.fillText(Z, 824, 28);
  }
function overScreen($, J, Q, Z, U) {
    $.fillStyle = "rgba(5,2,6,.78)", $.fillRect(0, 52, 1024, 588);
    let q = J.best(Q);
    glow($, "GAME OVER", 512, 220, "#ff1f4f", 64), $.font = F("900", 40), $.textAlign = "center", $.fillStyle = "#fff", $.fillText(String(Z), 512, 300), $.font = F("700", 18), $.fillStyle = Z >= q && Z > 0 ? "#3ddc97" : "#b9a3ad", $.fillText(Z >= q && Z > 0 ? "NEW PERSONAL BEST" : "YOUR BEST  " + q, 512, 346), (U || []).forEach((E, Y) => {
      $.fillStyle = "#e9dde3", $.fillText(E, 512, 386 + Y * 28);
    }), $.font = F("800", 16), $.fillStyle = "#ffb3c2", $.fillText("ENTER  PLAY AGAIN      ESC  ARCADE MENU", 512, 470);
  }
var SHAPES = [[[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1], [0, 0, 0]], [[0, 1, 1], [1, 1, 0], [0, 0, 0]], [[1, 1, 0], [0, 1, 1], [0, 0, 0]], [[1, 0, 0], [1, 1, 1], [0, 0, 0]], [[0, 0, 1], [1, 1, 1], [0, 0, 0]]];
var PCOL = ["#4cc9f0", "#ffd166", "#b388ff", "#3ddc97", "#ff1f4f", "#5b7cff", "#ff8a3d"];
var rot = ($) => $[0].map((J, Q) => $.map((Z) => Z[Q]).reverse());
var ROTS = SHAPES.map(($) => {
    let J = [$];
    for (let Q = 1;Q < 4; Q++)
      J.push(rot(J[Q - 1]));
    return J.map((Q) => {
      let Z = [];
      return Q.forEach((U, q) => U.forEach((E, Y) => {
        if (E)
          Z.push([Y, q]);
      })), Z;
    });
  });
class Stacker {
    constructor($) {
      this.A = $, this.k = "stack", this.g = [...Array(20)].map(() => Array(10).fill(-1)), this.score = 0, this.lines = 0, this.lv = 1, this.bag = [], this.next = this.pull(), this.over = false, this.t = 0, this.lock = 0, this.lockN = 0, this.flash = null, this.hold = {}, this.rep = {}, this.spawn();
    }
    pull() {
      if (!this.bag.length)
        this.bag = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
      return this.bag.pop();
    }
    spawn() {
      if (this.p = { k: this.next, r: 0, x: this.next === 1 ? 4 : 3, y: this.next === 0 ? -1 : 0 }, this.next = this.pull(), this.lock = 0, this.lockN = 0, this.hit(this.p.x, this.p.y, this.p.r))
        this.over = true, this.A.beep(140, 0.5, "sawtooth", 0.06), this.A.done(this.k, this.score);
    }
    hit($, J, Q) {
      for (let [Z, U] of ROTS[this.p.k][Q]) {
        let q = $ + Z, E = J + U;
        if (q < 0 || q > 9 || E > 19)
          return true;
        if (E >= 0 && this.g[E][q] >= 0)
          return true;
      }
      return false;
    }
    move($) {
      if (!this.hit(this.p.x + $, this.p.y, this.p.r))
        return this.p.x += $, this.touch(), this.A.beep(520, 0.025, "square", 0.02), true;
      return false;
    }
    turn($) {
      let J = (this.p.r + $ + 4) % 4;
      for (let Q of [0, -1, 1, -2, 2])
        if (!this.hit(this.p.x + Q, this.p.y, J)) {
          this.p.x += Q, this.p.r = J, this.touch(), this.A.beep(700, 0.03, "square", 0.02);
          return;
        }
    }
    touch() {
      if (this.hit(this.p.x, this.p.y + 1, this.p.r) && this.lockN < 10)
        this.lock = 0, this.lockN++;
    }
    drop() {
      let $ = 0;
      while (!this.hit(this.p.x, this.p.y + 1, this.p.r))
        this.p.y++, $++;
      this.score += $ * 2, this.place(), this.A.beep(180, 0.08, "triangle", 0.05);
    }
    place() {
      for (let [J, Q] of ROTS[this.p.k][this.p.r]) {
        let Z = this.p.x + J, U = this.p.y + Q;
        if (U < 0) {
          this.over = true, this.A.done(this.k, this.score);
          return;
        }
        this.g[U][Z] = this.p.k;
      }
      let $ = [];
      if (this.g.forEach((J, Q) => {
        if (J.every((Z) => Z >= 0))
          $.push(Q);
      }), $.length)
        this.flash = { rows: $, t: 0 }, this.A.beep($.length >= 4 ? 1100 : 880, 0.12, "square", 0.05);
      else
        this.spawn();
    }
    ghost() {
      let $ = this.p.y;
      while (!this.hit(this.p.x, $ + 1, this.p.r))
        $++;
      return $;
    }
    key($, J) {
      if (this.over) {
        if (J && $ === "Enter")
          return "again";
        return;
      }
      if (this.hold[$] = J, !J) {
        this.rep[$] = 0;
        return;
      }
      if (this.flash)
        return;
      if ($ === "ArrowLeft" || $ === "a")
        this.move(-1), this.rep[$] = -0.17;
      else if ($ === "ArrowRight" || $ === "d")
        this.move(1), this.rep[$] = -0.17;
      else if ($ === "ArrowUp" || $ === "x" || $ === "w")
        this.turn(1);
      else if ($ === "z" || $ === "q")
        this.turn(-1);
      else if ($ === " ")
        this.drop();
    }
    update($) {
      if (this.over)
        return;
      if (this.flash) {
        if (this.flash.t += $, this.flash.t > 0.2) {
          let Z = this.flash.rows;
          this.g = this.g.filter((E, Y) => !Z.includes(Y));
          while (this.g.length < 20)
            this.g.unshift(Array(10).fill(-1));
          let U = Z.length;
          this.lines += U, this.score += [0, 100, 300, 500, 800][U] * this.lv;
          let q = 1 + Math.floor(this.lines / 10);
          if (q > this.lv)
            this.lv = q, this.A.beep(1320, 0.2, "triangle", 0.05);
          this.flash = null, this.spawn();
        }
        return;
      }
      for (let Z of ["ArrowLeft", "a", "ArrowRight", "d"])
        if (this.hold[Z]) {
          this.rep[Z] = (this.rep[Z] || 0) + $;
          while (this.rep[Z] >= 0.045)
            this.rep[Z] -= 0.045, this.move(Z === "ArrowLeft" || Z === "a" ? -1 : 1);
        }
      let J = this.hold.ArrowDown || this.hold.s, Q = J ? 0.035 : Math.max(0.06, 0.85 * Math.pow(0.86, this.lv - 1));
      if (this.hit(this.p.x, this.p.y + 1, this.p.r)) {
        if (this.lock += $, this.lock > 0.45)
          this.place();
        return;
      }
      this.t += $;
      while (this.t >= Q)
        if (this.t -= Q, !this.hit(this.p.x, this.p.y + 1, this.p.r)) {
          if (this.p.y++, J)
            this.score += 1;
        } else
          break;
    }
    draw($, J) {
      screenBg($, J), topBar($, "STACKER", this.score, "LEVEL " + this.lv + "   LINES " + this.lines);
      let Q = 27, Z = 512 - Q * 5, U = 66;
      $.fillStyle = "rgba(255,255,255,.035)", $.fillRect(Z, U, Q * 10, Q * 20), $.strokeStyle = "rgba(255,31,79,.55)", $.lineWidth = 2, $.strokeRect(Z - 1, U - 1, Q * 10 + 2, Q * 20 + 2);
      let q = (E, Y, K, V) => {
        if (Y < 0)
          return;
        $.globalAlpha = V, $.fillStyle = K, $.fillRect(Z + E * Q + 1, U + Y * Q + 1, Q - 2, Q - 2), $.fillStyle = "rgba(255,255,255,.25)", $.fillRect(Z + E * Q + 1, U + Y * Q + 1, Q - 2, 4), $.globalAlpha = 1;
      };
      if (this.g.forEach((E, Y) => E.forEach((K, V) => {
        if (K >= 0)
          q(V, Y, this.flash && this.flash.rows.includes(Y) ? "#ffffff" : PCOL[K], 1);
      })), !this.over && !this.flash) {
        let E = this.ghost();
        ROTS[this.p.k][this.p.r].forEach(([Y, K]) => q(this.p.x + Y, E + K, PCOL[this.p.k], 0.18)), ROTS[this.p.k][this.p.r].forEach(([Y, K]) => q(this.p.x + Y, this.p.y + K, PCOL[this.p.k], 1));
      }
      if ($.font = F("800", 16), $.textAlign = "left", $.fillStyle = "#b9a3ad", $.fillText("NEXT", Z + Q * 10 + 40, 90), ROTS[this.next][0].forEach(([E, Y]) => {
        $.fillStyle = PCOL[this.next], $.fillRect(Z + Q * 10 + 40 + E * 22, 110 + Y * 22, 20, 20);
      }), $.fillStyle = "#8f7d87", $.font = F("700", 13), ["ARROWS  MOVE", "UP / X  ROTATE", "DOWN  SOFT DROP", "SPACE  HARD DROP"].forEach((E, Y) => $.fillText(E, 60, 120 + Y * 26)), $.fillStyle = "#b9a3ad", $.font = F("800", 14), $.fillText("BEST", 60, 260), $.fillStyle = "#fff", $.font = F("900", 26), $.fillText(String(Math.max(this.A.best(this.k), this.score)), 60, 290), this.over)
        overScreen($, this.A, this.k, this.score, ["LINES " + this.lines + "   LEVEL " + this.lv]);
    }
  }
class Paddle {
    constructor($) {
      this.A = $, this.k = "paddle", this.py = 320, this.cy = 320, this.ps = 0, this.cs = 0, this.score = 0, this.over = false, this.hold = {}, this.serve(1), this.ptrY = null;
    }
    serve($) {
      this.bx = 512, this.by = 350;
      let J = (Math.random() - 0.5) * 0.8;
      this.sp = 470, this.vx = Math.cos(J) * this.sp * $, this.vy = Math.sin(J) * this.sp, this.wait = 0.8;
    }
    key($, J) {
      if (this.over) {
        if (J && $ === "Enter")
          return "again";
        return;
      }
      this.hold[$] = J;
    }
    ptr($, J, Q) {
      if ($ !== "up")
        this.ptrY = Q;
    }
    update($) {
      if (this.over)
        return;
      let J = 70, Q = 626, Z = 110, U = 0;
      if (this.hold.ArrowUp || this.hold.w)
        U -= 1;
      if (this.hold.ArrowDown || this.hold.s)
        U += 1;
      if (U)
        this.ptrY = null;
      if (this.ptrY !== null)
        this.py += (this.ptrY - this.py) * Math.min(1, $ * 18);
      else
        this.py += U * 560 * $;
      this.py = Math.max(J + Z / 2, Math.min(Q - Z / 2, this.py));
      let q = this.vx > 0 ? this.by + this.vy * 0.06 + (this.err || 0) : 320, E = 330 + this.ps * 22;
      if (this.cy += Math.max(-E * $, Math.min(E * $, q - this.cy)), this.cy = Math.max(J + Z / 2, Math.min(Q - Z / 2, this.cy)), this.wait > 0) {
        this.wait -= $;
        return;
      }
      if (this.bx += this.vx * $, this.by += this.vy * $, this.by < J + 10)
        this.by = J + 10, this.vy = Math.abs(this.vy), this.A.beep(330, 0.03, "square", 0.03);
      if (this.by > Q - 10)
        this.by = Q - 10, this.vy = -Math.abs(this.vy), this.A.beep(330, 0.03, "square", 0.03);
      let Y = (K, V, X) => {
        if (Math.abs(this.bx - K) < 18 && Math.abs(this.by - V) < Z / 2 + 10 && Math.sign(this.vx) === -X) {
          let W = (this.by - V) / (Z / 2), H = (Math.random() - 0.5) * 0.3, N = Math.max(-1, Math.min(1, W * 0.85 + H + (Math.abs(W) < 0.15 ? H < 0 ? -0.18 : 0.18 : 0)));
          if (X > 0)
            this.err = (Math.random() - 0.5) * (60 + this.ps * 8);
          this.sp = Math.min(1150, this.sp * 1.06), this.vx = Math.cos(N) * this.sp * X, this.vy = Math.sin(N) * this.sp, this.bx = K + X * 18, this.A.beep(X > 0 ? 620 : 500, 0.04, "square", 0.04);
        }
      };
      if (Y(52, this.py, 1), Y(972, this.cy, -1), this.bx < 0)
        this.cs++, this.A.beep(160, 0.25, "sawtooth", 0.05), this.end() || this.serve(-1);
      else if (this.bx > 1024)
        this.ps++, this.score = this.ps * 150, this.A.beep(980, 0.18, "triangle", 0.05), this.end() || this.serve(1);
    }
    end() {
      if (this.ps >= 7 || this.cs >= 7) {
        if (this.ps >= 7)
          this.score = this.ps * 150 + 1000 - this.cs * 40;
        return this.over = true, this.A.done(this.k, this.score), true;
      }
      return false;
    }
    draw($, J) {
      screenBg($, J), topBar($, "PADDLE DUEL", this.score, "FIRST TO 7"), $.setLineDash([12, 14]), $.strokeStyle = "rgba(255,255,255,.18)", $.lineWidth = 4, $.beginPath(), $.moveTo(512, 64), $.lineTo(512, 640), $.stroke(), $.setLineDash([]), glow($, String(this.ps), 422, 120, "#4cc9f0", 72), glow($, String(this.cs), 602, 120, "#ff1f4f", 72), $.font = F("800", 13), $.fillStyle = "#8f7d87", $.textAlign = "center", $.fillText("YOU", 422, 170), $.fillText("CPU", 602, 170);
      let Q = (Z, U, q) => {
        $.save(), $.shadowColor = q, $.shadowBlur = 18, $.fillStyle = q, rr($, Z - 8, U - 55, 16, 110, 8), $.fill(), $.restore();
      };
      if (Q(44, this.py, "#4cc9f0"), Q(980, this.cy, "#ff1f4f"), $.save(), $.shadowColor = "#fff", $.shadowBlur = 20, $.fillStyle = "#fff", $.beginPath(), $.arc(this.bx, this.by, 10, 0, Math.PI * 2), $.fill(), $.restore(), this.wait > 0 && !this.over)
        $.font = F("800", 16), $.fillStyle = "#ffb3c2", $.textAlign = "center", $.fillText("W / S, ARROWS OR MOVE THE MOUSE", 512, 600);
      if (this.over)
        overScreen($, this.A, this.k, this.score, [this.ps >= 7 ? "YOU WIN " + this.ps + " - " + this.cs : "CPU WINS " + this.cs + " - " + this.ps]);
    }
  }
class Snake {
    constructor($) {
      this.A = $, this.k = "snake", this.cw = 30, this.chh = 17, this.s = [[8, 8], [7, 8], [6, 8], [5, 8]], this.d = [1, 0], this.q = [], this.t = 0, this.iv = 0.12, this.score = 0, this.over = false, this.food = this.free(), this.gold = null, this.goldT = 8, this.sw = null;
    }
    free() {
      for (let $ = 0;$ < 400; $++) {
        let J = [Math.random() * this.cw | 0, Math.random() * this.chh | 0];
        if (!this.s.some((Q) => Q[0] === J[0] && Q[1] === J[1]) && !(this.food && this.food[0] === J[0] && this.food[1] === J[1]))
          return J;
      }
      return [0, 0];
    }
    turn($, J) {
      let Q = this.q.length ? this.q[this.q.length - 1] : this.d;
      if (Q[0] === -$ && Q[1] === -J || Q[0] === $ && Q[1] === J)
        return;
      if (this.q.length < 3)
        this.q.push([$, J]);
    }
    key($, J) {
      if (this.over) {
        if (J && $ === "Enter")
          return "again";
        return;
      }
      if (!J)
        return;
      if ($ === "ArrowUp" || $ === "w")
        this.turn(0, -1);
      else if ($ === "ArrowDown" || $ === "s")
        this.turn(0, 1);
      else if ($ === "ArrowLeft" || $ === "a")
        this.turn(-1, 0);
      else if ($ === "ArrowRight" || $ === "d")
        this.turn(1, 0);
    }
    ptr($, J, Q) {
      if ($ === "down")
        this.sw = [J, Q];
      else if ($ === "move" && this.sw) {
        let Z = J - this.sw[0], U = Q - this.sw[1];
        if (Math.hypot(Z, U) > 30)
          Math.abs(Z) > Math.abs(U) ? this.turn(Math.sign(Z), 0) : this.turn(0, Math.sign(U)), this.sw = [J, Q];
      } else if ($ === "up")
        this.sw = null;
    }
    update($) {
      if (this.over)
        return;
      if (this.gold) {
        if (this.gold.t -= $, this.gold.t <= 0)
          this.gold = null;
      } else if (this.goldT -= $, this.goldT <= 0) {
        this.goldT = 10 + Math.random() * 8;
        let J = this.free();
        this.gold = { x: J[0], y: J[1], t: 6 };
      }
      this.t += $;
      while (this.t >= this.iv) {
        if (this.t -= this.iv, this.q.length)
          this.d = this.q.shift();
        let J = this.s[0], Q = [J[0] + this.d[0], J[1] + this.d[1]];
        if (Q[0] < 0 || Q[1] < 0 || Q[0] >= this.cw || Q[1] >= this.chh || this.s.slice(0, -1).some((Z) => Z[0] === Q[0] && Z[1] === Q[1])) {
          this.over = true, this.A.beep(140, 0.4, "sawtooth", 0.06), this.A.done(this.k, this.score);
          return;
        }
        if (this.s.unshift(Q), Q[0] === this.food[0] && Q[1] === this.food[1])
          this.score += 10, this.iv = Math.max(0.055, this.iv - 0.003), this.food = this.free(), this.A.beep(880, 0.05, "square", 0.04);
        else if (this.gold && Q[0] === this.gold.x && Q[1] === this.gold.y)
          this.score += 50, this.gold = null, this.A.beep(1320, 0.12, "triangle", 0.05);
        else
          this.s.pop();
      }
    }
    draw($, J) {
      screenBg($, J), topBar($, "SNAKE", this.score, "LENGTH " + this.s.length);
      let Q = 32, Z = (1024 - this.cw * Q) / 2, U = 70;
      if ($.fillStyle = "rgba(255,255,255,.03)", $.fillRect(Z, U, this.cw * Q, this.chh * Q), $.strokeStyle = "rgba(61,220,151,.5)", $.lineWidth = 2, $.strokeRect(Z, U, this.cw * Q, this.chh * Q), $.save(), $.shadowColor = "#ff1f4f", $.shadowBlur = 16, $.fillStyle = "#ff1f4f", $.beginPath(), $.arc(Z + this.food[0] * Q + Q / 2, U + this.food[1] * Q + Q / 2, Q * 0.36, 0, Math.PI * 2), $.fill(), $.restore(), this.gold)
        $.save(), $.shadowColor = "#ffd166", $.shadowBlur = 22, $.fillStyle = "#ffd166", $.globalAlpha = 0.6 + 0.4 * Math.sin(J * 10), $.beginPath(), $.arc(Z + this.gold.x * Q + Q / 2, U + this.gold.y * Q + Q / 2, Q * 0.42, 0, Math.PI * 2), $.fill(), $.restore();
      if (this.s.forEach((q, E) => {
        let Y = 1 - E / (this.s.length + 4);
        $.fillStyle = E ? `rgba(61,220,151,${0.45 + 0.55 * Y})` : "#8ef0c2", rr($, Z + q[0] * Q + 2, U + q[1] * Q + 2, Q - 4, Q - 4, 7), $.fill();
      }), this.s.length === 4 && this.score === 0 && !this.over)
        $.font = F("800", 16), $.fillStyle = "#ffb3c2", $.textAlign = "center", $.fillText("ARROWS / WASD OR SWIPE", 512, 610);
      if (this.over)
        overScreen($, this.A, this.k, this.score, ["LENGTH " + this.s.length]);
    }
  }
class Bricks {
    constructor($) {
      this.A = $, this.k = "bricks", this.score = 0, this.lives = 3, this.lv = 1, this.over = false, this.px = 512, this.hold = {}, this.ptrX = null, this.build(), this.reset();
    }
    build() {
      this.b = [];
      let $ = 5 + Math.min(3, this.lv), J = 12, Q = 78, Z = 24, U = (1024 - J * (Q + 4)) / 2 + 2;
      for (let q = 0;q < $; q++)
        for (let E = 0;E < J; E++)
          this.b.push({ x: U + E * (Q + 4), y: 84 + q * (Z + 6), w: Q, h: Z, col: COLS[q % COLS.length], hp: q < this.lv - 1 ? 2 : 1 });
    }
    reset() {
      this.stuck = true, this.bx = this.px, this.by = 594, this.vx = 0, this.vy = 0, this.sp = 430 + this.lv * 40;
    }
    launch() {
      if (!this.stuck)
        return;
      this.stuck = false;
      let $ = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
      this.vx = Math.cos($) * this.sp, this.vy = Math.sin($) * this.sp, this.A.beep(660, 0.05, "square", 0.03);
    }
    key($, J) {
      if (this.over) {
        if (J && $ === "Enter")
          return "again";
        return;
      }
      if (this.hold[$] = J, J && ($ === " " || $ === "ArrowUp" || $ === "w"))
        this.launch();
    }
    ptr($, J, Q) {
      if ($ !== "up")
        this.ptrX = J;
      if ($ === "down")
        this.launch();
    }
    update($) {
      if (this.over)
        return;
      let J = 0;
      if (this.hold.ArrowLeft || this.hold.a)
        J -= 1;
      if (this.hold.ArrowRight || this.hold.d)
        J += 1;
      if (J)
        this.ptrX = null;
      if (this.ptrX !== null)
        this.px += (this.ptrX - this.px) * Math.min(1, $ * 20);
      else
        this.px += J * 640 * $;
      if (this.px = Math.max(70, Math.min(954, this.px)), this.stuck) {
        this.bx = this.px, this.by = 594;
        return;
      }
      let Q = Math.ceil(Math.hypot(this.vx, this.vy) * $ / 8);
      for (let Z = 0;Z < Q; Z++)
        this.stepB($ / Q);
    }
    stepB($) {
      this.bx += this.vx * $, this.by += this.vy * $;
      let J = 9;
      if (this.bx < J)
        this.bx = J, this.vx = Math.abs(this.vx);
      if (this.bx > 1024 - J)
        this.bx = 1024 - J, this.vx = -Math.abs(this.vx);
      if (this.by < 60 + J)
        this.by = 60 + J, this.vy = Math.abs(this.vy);
      if (this.vy > 0 && this.by > 600 - J && this.by < 616 && Math.abs(this.bx - this.px) < 70) {
        let Q = (this.bx - this.px) / 70, Z = -Math.PI / 2 + Q * 1.05;
        this.vx = Math.cos(Z) * this.sp, this.vy = Math.sin(Z) * this.sp, this.by = 600 - J, this.A.beep(440, 0.03, "square", 0.03);
      }
      if (this.by > 660) {
        if (this.lives--, this.A.beep(150, 0.3, "sawtooth", 0.05), this.lives <= 0)
          this.over = true, this.A.done(this.k, this.score);
        else
          this.reset();
        return;
      }
      for (let Q of this.b) {
        if (Q.hp <= 0)
          continue;
        if (this.bx + J > Q.x && this.bx - J < Q.x + Q.w && this.by + J > Q.y && this.by - J < Q.y + Q.h) {
          let Z = Math.min(this.bx + J - Q.x, Q.x + Q.w - (this.bx - J)), U = Math.min(this.by + J - Q.y, Q.y + Q.h - (this.by - J));
          if (Z < U)
            this.vx = -this.vx;
          else
            this.vy = -this.vy;
          Q.hp--, this.score += Q.hp > 0 ? 5 : 10 * this.lv, this.A.beep(Q.hp > 0 ? 500 : 760 + Math.random() * 200, 0.04, "square", 0.035);
          break;
        }
      }
      if (this.b.every((Q) => Q.hp <= 0))
        this.lv++, this.score += 500, this.A.beep(1320, 0.25, "triangle", 0.05), this.build(), this.reset();
    }
    draw($, J) {
      if (screenBg($, J), topBar($, "BRICK BREAK", this.score, "LEVEL " + this.lv + "   BALLS " + this.lives), this.b.forEach((Q) => {
        if (Q.hp <= 0)
          return;
        if ($.fillStyle = Q.col, $.globalAlpha = Q.hp > 1 ? 1 : 0.85, rr($, Q.x, Q.y, Q.w, Q.h, 5), $.fill(), $.fillStyle = "rgba(255,255,255,.28)", $.fillRect(Q.x + 4, Q.y + 3, Q.w - 8, 4), $.globalAlpha = 1, Q.hp > 1)
          $.strokeStyle = "#fff", $.lineWidth = 2, rr($, Q.x + 1, Q.y + 1, Q.w - 2, Q.h - 2, 5), $.stroke();
      }), $.save(), $.shadowColor = "#4cc9f0", $.shadowBlur = 18, $.fillStyle = "#4cc9f0", rr($, this.px - 70, 600, 140, 14, 7), $.fill(), $.shadowColor = "#fff", $.fillStyle = "#fff", $.beginPath(), $.arc(this.bx, this.by, 9, 0, Math.PI * 2), $.fill(), $.restore(), this.stuck && !this.over)
        $.font = F("800", 16), $.fillStyle = "#ffb3c2", $.textAlign = "center", $.fillText("SPACE OR CLICK TO LAUNCH", 512, 560);
      if (this.over)
        overScreen($, this.A, this.k, this.score, ["LEVEL " + this.lv]);
    }
  }
var QS = [["Which kind of life insurance covers you for a set number of years?", ["Term life", "Whole life", "Final expense", "Universal life"], 0, "Term life covers a set period, like 10, 20 or 30 years."], ["The person named to receive the death benefit is the...", ["Beneficiary", "Insured", "Owner", "Underwriter"], 0, "The beneficiary receives the death benefit."], ["A premium is...", ["The payment that keeps the policy in force", "The death benefit", "The cash value", "A type of rider"], 0, "Premiums are the payments that keep coverage active."], ["Whole life insurance usually builds...", ["Cash value", "Nothing at all", "Only term coverage", "Car insurance credit"], 0, "Permanent policies like whole life build cash value over time."], ["Final expense insurance is mainly meant to cover...", ["Funeral and end-of-life costs", "A car loan", "College tuition", "Home repairs"], 0, "Final expense policies are sized for funeral and burial costs."], ["Underwriting is the process of...", ["Evaluating risk to decide coverage and price", "Paying out a claim", "Naming a beneficiary", "Cancelling a policy"], 0, "Underwriters review health and other risk to set eligibility and price."], ["A rider is...", ["An add-on that changes or adds benefits", "A second premium bill", "A late fee", "A type of beneficiary"], 0, "Riders add or adjust benefits on a base policy."], ["The free look period lets a new policy owner...", ["Cancel for a refund within a set number of days", "Skip premiums for a year", "Change the insured person", "Borrow the full death benefit"], 0, "The length of the free look period depends on the state."], ["Most life policies give a grace period on late premiums of about...", ["One month (often 31 days)", "One day", "Six months", "One year"], 0, "A grace period of about a month is common; check the policy."], ["The contestability period is typically...", ["The first 2 years of the policy", "The first 2 weeks", "10 years", "The life of the policy"], 0, "During roughly the first two years an insurer can review the application."], ["An accelerated death benefit can pay part of the benefit early when the insured...", ["Has a qualifying terminal illness", "Changes jobs", "Moves to a new state", "Buys a house"], 0, "It lets a seriously ill insured use part of the benefit while living."], ["Who pays the premiums and controls the policy?", ["The policy owner", "The beneficiary", "The underwriter", "The state"], 0, "The owner controls the policy, which can be someone other than the insured."], ["Why does term usually cost less than whole life for the same amount?", ["No cash value and a set coverage period", "It never pays claims", "It is government funded", "It only covers accidents"], 0, "Term is pure protection for a set time, so it is cheaper."], ["A contingent beneficiary gets the benefit when...", ["The primary beneficiary cannot receive it", "The premium is late", "The owner retires", "A rider is added"], 0, "Contingent (secondary) beneficiaries are the backup."], ["Death benefits paid to a beneficiary are generally...", ["Not subject to federal income tax", "Taxed at 50 percent", "Taxed as capital gains", "Paid only in installments"], 0, "In general, life insurance death benefits are not federal taxable income."], ["A policy lapses when...", ["Premiums stop and the grace period ends", "The insured has a birthday", "The agent changes offices", "A beneficiary is added"], 0, "Missing premiums past the grace period can end coverage."], ["Guaranteed issue policies...", ["Do not ask health questions", "Require a medical exam", "Are only for children", "Pay double for accidents"], 0, "They cannot decline you for health, often with a waiting period."], ["A graded death benefit policy often...", ["Pays a limited benefit in the first couple of years", "Pays double after year one", "Has no premiums", "Only covers accidents"], 0, "Full benefits usually start after the early graded period."], ["Indexed universal life cash value growth is linked to...", ["A market index, with caps and floors", "The price of gold only", "A guaranteed 10 percent rate", "Lottery numbers"], 0, "IUL credits interest based on an index, within a cap and a floor."], ["Switching term coverage to permanent without new health questions uses a...", ["Conversion privilege", "Waiver of premium", "Grace period", "Free look"], 0, "Many term policies can convert to permanent coverage."], ["A waiver of premium rider...", ["Waives premiums if the insured becomes disabled", "Lowers the death benefit", "Adds a beneficiary", "Shortens the term"], 0, "If the insured is disabled as defined, premiums are waived."], ["An unpaid policy loan against cash value...", ["Reduces the death benefit", "Increases the death benefit", "Cancels the policy right away", "Has no effect at all"], 0, "Outstanding loans are subtracted from the death benefit."], ["The insured is...", ["The person whose life is covered", "The person who sells the policy", "The beneficiary", "The underwriter"], 0, "The policy pays when the insured dies."], ["Which usually raises a life insurance premium?", ["Smoking", "Being younger", "A smaller coverage amount", "A shorter term"], 0, "Tobacco use is one of the biggest pricing factors."], ["Mortgage protection insurance is commonly used to...", ["Pay toward a home loan if the insured dies", "Insure the house against fire", "Cover moving costs", "Pay property taxes"], 0, "It helps the family keep the home."], ["An annuity is mainly used to...", ["Turn savings into income, often for retirement", "Pay for a funeral only", "Cover car accidents", "Replace health insurance"], 0, "Annuities can provide a stream of income."], ["Level term means the premium...", ["Stays the same for the term", "Rises every year", "Drops every year", "Is paid only once"], 0, "Level term keeps the same premium for the whole term."], ["Return of premium term...", ["Refunds premiums if you outlive the term and kept it in force", "Pays twice the benefit", "Has no premiums", "Never expires"], 0, "If you outlive the term, premiums come back, per the contract."], ["The face amount is...", ["The death benefit stated on the policy", "The monthly premium", "The cash value after one year", "The agent commission"], 0, "Face amount is the stated death benefit."], ["Which of these is permanent life insurance?", ["Whole life", "20-year term", "Travel insurance", "Credit card insurance"], 0, "Whole life lasts for life as long as premiums are paid."], ["When replacing an existing policy, agents usually must...", ["Complete replacement forms and disclosures", "Cancel it first without telling anyone", "Double the premium", "Change the insured person"], 0, "Most states have replacement rules to protect consumers."], ["An exclusion in a policy is...", ["Something the policy will not cover", "An extra benefit", "A discount", "A kind of beneficiary"], 0, "Exclusions list what is not covered."], ["The suicide clause usually excludes suicide during roughly the first...", ["2 years (1 year in a few states)", "10 years", "30 days", "It never applies"], 0, "Most policies use a two-year period; a few states use one year."], ["Simplified issue life insurance...", ["Asks health questions but usually no medical exam", "Always requires blood work", "Has no premiums", "Only covers children"], 0, "Simplified issue skips the exam and relies on the application."], ["A children term rider...", ["Adds term coverage for the insured person's children", "Pays school tuition", "Makes a child the owner", "Doubles the main benefit"], 0, "One rider can cover all eligible children."], ["An accidental death benefit rider pays extra when death is...", ["Caused by a covered accident", "From any illness", "After age 100", "From old age"], 0, "It adds money when death results from a covered accident."], ["A beneficiary designation on a policy usually...", ["Controls who gets that policy's proceeds, even over a will", "Is ignored if there is a will", "Must name the agent", "Can never be changed"], 0, "Keep beneficiaries up to date: the designation usually controls."], ["The person who reviews an application and approves the risk class is the...", ["Underwriter", "Beneficiary", "Policy owner", "Claims adjuster"], 0, "Underwriters assign the risk class."]];
class Trivia {
    constructor($) {
      this.A = $, this.k = "trivia", this.q = QS.map((J, Q) => Q).sort(() => Math.random() - 0.5).slice(0, 10).map((J) => {
        let Q = QS[J], Z = Q[1].map((U, q) => ({ t: U, ok: q === Q[2] })).sort(() => Math.random() - 0.5);
        return { q: Q[0], o: Z, why: Q[3] };
      }), this.i = 0, this.score = 0, this.right = 0, this.t = 15, this.ph = "ask", this.pick = -1, this.rt = 0, this.over = false, this.box = [];
    }
    choose($) {
      if (this.ph !== "ask" || this.over)
        return;
      let J = this.q[this.i];
      if (this.pick = $, this.ph = "show", this.rt = 0, $ >= 0 && J.o[$].ok)
        this.right++, this.score += 100 + Math.round(this.t * 10), this.A.beep(988, 0.12, "triangle", 0.05);
      else
        this.A.beep(180, 0.25, "sawtooth", 0.05);
    }
    key($, J) {
      if (!J)
        return;
      if (this.over) {
        if ($ === "Enter")
          return "again";
        return;
      }
      let Q = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 }[String($).toLowerCase()];
      if (Q !== undefined)
        this.choose(Q);
      else if ($ === "Enter" && this.ph === "show")
        this.rt = 9;
    }
    ptr($, J, Q) {
      if ($ !== "down")
        return;
      if (this.ph === "show") {
        this.rt = 9;
        return;
      }
      this.box.forEach((Z, U) => {
        if (J > Z[0] && J < Z[0] + Z[2] && Q > Z[1] && Q < Z[1] + Z[3])
          this.choose(U);
      });
    }
    update($) {
      if (this.over)
        return;
      if (this.ph === "ask") {
        if (this.t -= $, this.t <= 0)
          this.t = 0, this.choose(-1);
      } else if (this.rt += $, this.rt > 2.4)
        if (this.i++, this.i >= this.q.length)
          this.over = true, this.A.done(this.k, this.score);
        else
          this.ph = "ask", this.t = 15, this.pick = -1;
    }
    draw($, J) {
      if (screenBg($, J), topBar($, "POLICY TRIVIA", this.score, "QUESTION " + Math.min(this.i + 1, 10) + " OF 10"), this.over) {
        overScreen($, this.A, this.k, this.score, [this.right + " OF 10 RIGHT"]);
        return;
      }
      let Q = this.q[this.i];
      $.fillStyle = "rgba(255,255,255,.06)", $.fillRect(60, 70, 904, 8), $.fillStyle = this.t < 5 ? "#ff1f4f" : "#3ddc97", $.fillRect(60, 70, 904 * this.t / 15, 8), $.font = F("800", 30), $.fillStyle = "#fff", $.textAlign = "center", $.textBaseline = "middle";
      let Z = Q.q.split(" "), U = "", q = [];
      if (Z.forEach((E) => {
        let Y = U ? U + " " + E : E;
        if ($.measureText(Y).width > 864)
          q.push(U), U = E;
        else
          U = Y;
      }), q.push(U), q.forEach((E, Y) => $.fillText(E, 512, 140 + Y * 40)), this.box = [], Q.o.forEach((E, Y) => {
        let X = 60 + Y % 2 * 467, W = 250 + Math.floor(Y / 2) * 118;
        this.box.push([X, W, 437, 96]);
        let H = "rgba(255,255,255,.05)", N = "rgba(255,255,255,.18)";
        if (this.ph === "show") {
          if (E.ok)
            H = "rgba(61,220,151,.22)", N = "#3ddc97";
          else if (Y === this.pick)
            H = "rgba(255,31,79,.22)", N = "#ff1f4f";
        }
        $.fillStyle = H, rr($, X, W, 437, 96, 14), $.fill(), $.strokeStyle = N, $.lineWidth = 3, $.stroke(), $.fillStyle = "#ffd166", $.font = F("900", 22), $.textAlign = "left", $.fillText(String(Y + 1), X + 20, W + 48), $.fillStyle = "#fff", $.font = F("700", 20);
        let F__L = E.t.split(" "), G = "", _ = [];
        F__L.forEach((D) => {
          let O = G ? G + " " + D : D;
          if ($.measureText(O).width > 357)
            _.push(G), G = D;
          else
            G = O;
        }), _.push(G), _.slice(0, 3).forEach((D, O) => $.fillText(D, X + 56, W + 48 + (O - (Math.min(3, _.length) - 1) / 2) * 24));
      }), this.ph === "show")
        $.font = F("700", 18), $.fillStyle = "#e9dde3", $.textAlign = "center", $.fillText(Q.why, 512, 614);
      else
        $.font = F("700", 14), $.fillStyle = "#8f7d87", $.textAlign = "center", $.fillText("PRESS 1-4 OR CLICK AN ANSWER  -  RULES CAN VARY BY STATE AND CARRIER", 512, 616);
    }
  }
var MAKE = { stack: Stacker, paddle: Paddle, snake: Snake, bricks: Bricks, trivia: Trivia };
function tileArt($, J, Q, Z, U, q, E) {
    if ($.save(), $.translate(Q, Z), J === "stack")
      [[0, 3, 0], [1, 3, 0], [2, 3, 1], [3, 3, 1], [0, 2, 2], [1, 2, 3], [2, 2, 3], [3, 2, 1], [1, 1, 4], [2, 1, 4], [2, 0, 5], [3, 1, 6]].forEach(([K, V, X]) => {
        $.fillStyle = PCOL[X], $.fillRect(U / 2 - 32 + K * 16, q - 10 - (4 - V) * 16, 14, 14);
      });
    else if (J === "paddle")
      $.fillStyle = "#4cc9f0", $.fillRect(16, q / 2 - 26, 8, 52), $.fillStyle = "#ff1f4f", $.fillRect(U - 24, q / 2 - 30 + 12 * Math.sin(E * 2), 8, 52), $.fillStyle = "#fff", $.beginPath(), $.arc(U / 2 + 40 * Math.sin(E * 1.7), q / 2 + 18 * Math.cos(E * 2.3), 7, 0, Math.PI * 2), $.fill();
    else if (J === "snake") {
      $.fillStyle = "#3ddc97";
      for (let Y = 0;Y < 9; Y++) {
        let K = 20 + Y * 16, V = q / 2 + 10 * Math.sin(E * 3 + Y * 0.7);
        $.fillRect(K, V, 13, 13);
      }
      $.fillStyle = "#ff1f4f", $.beginPath(), $.arc(U - 30, q / 2 + 6, 7, 0, Math.PI * 2), $.fill();
    } else if (J === "bricks") {
      for (let Y = 0;Y < 3; Y++)
        for (let K = 0;K < 6; K++)
          $.fillStyle = COLS[Y], $.fillRect(14 + K * ((U - 28) / 6), 12 + Y * 14, (U - 28) / 6 - 4, 10);
      $.fillStyle = "#4cc9f0", $.fillRect(U / 2 - 28 + 20 * Math.sin(E * 1.5), q - 14, 56, 7), $.fillStyle = "#fff", $.beginPath(), $.arc(U / 2 + 20 * Math.sin(E * 1.5), q - 30 - 14 * Math.abs(Math.sin(E * 3)), 6, 0, Math.PI * 2), $.fill();
    } else if (J === "trivia")
      $.font = F("900", 58), $.textAlign = "center", $.textBaseline = "middle", $.fillStyle = "#ffd166", $.fillText("?", U / 2, q / 2), $.fillStyle = "rgba(255,255,255,.5)", $.font = F("800", 12), $.fillText("A   B   C   D", U / 2, q - 10);
    $.restore();
  }

export {F, GAMES, GH, GW, MAKE, QS, glow, rr, screenBg, tileArt, topBar};
