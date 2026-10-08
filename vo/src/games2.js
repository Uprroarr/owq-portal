import {F, GH, GW, QS, glow, rr, screenBg, topBar} from './games.js';

var CME = "#4cc9f0";
var COP = "#ff1f4f";
var first = ($) => String($ || "Teammate").split(" ")[0].toUpperCase();
function endScreen($, J, Q, Z, U, q, E) {
    $.fillStyle = "rgba(5,2,6,.8)", $.fillRect(0, 52, GW, GH - 52), glow($, Q ? "DRAW" : J ? "YOU WIN" : first(U) + " WINS", GW / 2, 215, Q ? "#ffd166" : J ? "#3ddc97" : COP, 62), $.font = F("800", 20), $.textAlign = "center", $.fillStyle = "#fff", (q || []).forEach((Y, K) => $.fillText(Y, GW / 2, 290 + K * 32)), $.font = F("800", 16), $.fillStyle = "#ffb3c2", $.fillText(E || "ENTER  REMATCH      ESC  ARCADE MENU", GW / 2, 452);
  }
function leftScreen($, J) {
    $.fillStyle = "rgba(5,2,6,.85)", $.fillRect(0, 52, GW, GH - 52), glow($, first(J) + " LEFT THE GAME", GW / 2, 250, "#ffd166", 44), $.font = F("800", 16), $.textAlign = "center", $.fillStyle = "#ffb3c2", $.fillText("ESC  ARCADE MENU", GW / 2, 330);
  }
function hint($, J) {
    $.font = F("800", 15), $.fillStyle = "#ffb3c2", $.textAlign = "center", $.fillText(J, GW / 2, GH - 40);
  }
class VS {
    constructor($, J) {
      this.A = $, this.N = J, this.vs = 1, this.over = false, this.iw = false, this.dr = false, this.gn = 0, this.ready = -1, this.score = 0, this.hold = {}, this.lastS = null, this.rt = 0;
    }
    peer() {
      let $ = this.N.peer();
      if ($ && $.s && $.s !== this.lastS)
        this.lastS = $.s, this.rt = this.N.now();
      return $ && $.s ? $.s : null;
    }
    key($, J) {
      if (this.N.gone())
        return;
      if (this.over) {
        if (J && $ === "Enter" && this.ready !== this.gn)
          this.ready = this.gn, this.A.beep(660, 0.06, "triangle", 0.04);
        return;
      }
      this.hold[$] = J, this.keyIn && this.keyIn($, J);
    }
    readyNote($) {
      if (this.over && this.ready === this.gn)
        hint($, "WAITING FOR " + first(this.N.them) + " TO PRESS ENTER");
    }
  }
class PaddleVS extends VS {
    constructor($, J) {
      super($, J);
      if (this.k = "paddle", this.my = GH / 2, this.op = GH / 2, this.opT = GH / 2, this.sc = [0, 0], this.b = [GW / 2, GH / 2 + 30, 0, 0], this.q = 0, this.wait = 1.2, this.ptrY = null, this.miss = -1, this.sp = 430, J.role === "h")
        this.serve(Math.random() < 0.5 ? 1 : -1);
    }
    host() {
      return this.N.role === "h";
    }
    serve($) {
      let J = (Math.random() - 0.5) * 0.8;
      this.sp = 430, this.b = [GW / 2, GH / 2 + 30, Math.cos(J) * this.sp * $, Math.sin(J) * this.sp], this.wait = 0.9, this.q++;
    }
    mine() {
      return this.host() ? this.b[2] < 0 : this.b[2] > 0;
    }
    ptr($, J, Q) {
      if ($ !== "up")
        this.ptrY = Q;
      if ($ === "down")
        this.key("Enter", true);
    }
    adv($) {
      let Q = GH - 14, U = this.b, q = Math.max(1, Math.ceil(Math.abs(U[2]) * $ / 10));
      for (let E = 0;E < q; E++) {
        let Y = $ / q;
        if (U[0] += U[2] * Y, U[1] += U[3] * Y, U[1] < 80)
          U[1] = 80, U[3] = Math.abs(U[3]), this.A.beep(330, 0.03, "square", 0.03);
        if (U[1] > Q - 10)
          U[1] = Q - 10, U[3] = -Math.abs(U[3]), this.A.beep(330, 0.03, "square", 0.03);
        if (this.mine()) {
          let K = this.host() ? 52 : GW - 52, V = this.host() ? 1 : -1;
          if (Math.abs(U[0] - K) < 18 && Math.abs(U[1] - this.my) < 65) {
            let X = (U[1] - this.my) / 55, W = Math.max(-1, Math.min(1, X * 0.85 + (Math.random() - 0.5) * 0.2));
            this.sp = Math.min(950, Math.hypot(U[2], U[3]) * 1.05), U[2] = Math.cos(W) * this.sp * V, U[3] = Math.sin(W) * this.sp, U[0] = K + V * 18, this.q++, this.A.beep(620, 0.04, "square", 0.04);
          } else if (this.host() ? U[0] < 0 : U[0] > GW) {
            if (this.host())
              this.point(1);
            else if (this.miss !== this.q)
              this.miss = this.q, U[2] = 0, U[3] = 0;
            return;
          }
        } else {
          let K = this.host() ? GW - 70 : 70;
          if (this.host() ? U[0] > K : U[0] < K)
            U[0] = K;
        }
      }
    }
    point($) {
      if (this.sc[$]++, this.A.beep($ ? 160 : 980, 0.2, $ ? "sawtooth" : "triangle", 0.05), this.sc[$] >= 7)
        this.over = true, this.iw = $ === 0, this.b[2] = this.b[3] = 0;
      else
        this.serve($ === 0 ? 1 : -1);
    }
    update($) {
      let J = this.N, Z = GH - 14;
      if (J.gone())
        return;
      let q = 0;
      if (this.hold.ArrowUp || this.hold.w)
        q -= 1;
      if (this.hold.ArrowDown || this.hold.s)
        q += 1;
      if (q)
        this.ptrY = null;
      if (this.ptrY !== null)
        this.my += (this.ptrY - this.my) * Math.min(1, $ * 18);
      else
        this.my += q * 560 * $;
      this.my = Math.max(125, Math.min(Z - 55, this.my));
      let E = this.peer(), Y = J.sync ? J.sync() : J.now();
      if (E) {
        if (typeof E.y === "number")
          this.opT = E.y;
        if (E.b && E.q > this.q) {
          if (this.b = E.b.slice(), this.q = E.q, !this.host())
            this.wait = E.w || 0;
          let V = Math.max(0, Math.min(0.35, E.ts ? Y - E.ts : this.N.now() - this.rt));
          if (this.wait <= 0)
            this.adv(V);
        }
        if (this.host()) {
          if (this.over) {
            if (this.ready === this.gn && E.r === this.gn)
              this.gn++, this.sc = [0, 0], this.over = false, this.ready = -1, this.serve(Math.random() < 0.5 ? 1 : -1);
          } else if (E.miss === this.q && this.b[2] > 0)
            this.point(0);
        } else {
          if (E.gn > this.gn)
            this.gn = E.gn, this.ready = -1;
          let V = this.sc[0], X = this.sc[1];
          if (this.sc = [E.sc[1], E.sc[0]], E.gn === this.gn) {
            if (this.sc[0] > V)
              this.A.beep(980, 0.18, "triangle", 0.05);
            else if (this.sc[1] > X)
              this.A.beep(160, 0.25, "sawtooth", 0.05);
          }
          this.over = !!E.ov && E.gn === this.gn, this.iw = E.ov === 2;
        }
      }
      if (this.op += (this.opT - this.op) * Math.min(1, $ * 16), !this.over)
        if (this.wait > 0)
          this.wait -= $;
        else
          this.adv($);
      this.score = (this.host() ? this.sc[0] : this.sc[0]) * 150;
      let K = this.b.map(Math.round);
      if (this.host())
        J.send({ b: K, q: this.q, w: +Math.max(0, this.wait).toFixed(2), y: Math.round(this.my), sc: this.sc, ov: this.over ? this.iw ? 1 : 2 : 0, gn: this.gn, ts: Y });
      else
        J.send({ b: K, q: this.q, y: Math.round(this.my), miss: this.miss, r: this.ready, ts: Y });
    }
    draw($, J) {
      screenBg($, J), topBar($, "PADDLE DUEL  -  2 PLAYERS", this.score, "FIRST TO 7"), $.setLineDash([12, 14]), $.strokeStyle = "rgba(255,255,255,.18)", $.lineWidth = 4, $.beginPath(), $.moveTo(GW / 2, 64), $.lineTo(GW / 2, GH), $.stroke(), $.setLineDash([]), glow($, String(this.sc[0]), GW / 2 - 90, 120, CME, 72), glow($, String(this.sc[1]), GW / 2 + 90, 120, COP, 72), $.font = F("800", 13), $.fillStyle = "#8f7d87", $.textAlign = "center", $.fillText("YOU", GW / 2 - 90, 170), $.fillText(first(this.N.them), GW / 2 + 90, 170);
      let Q = (q, E, Y) => {
        $.save(), $.shadowColor = Y, $.shadowBlur = 18, $.fillStyle = Y, rr($, q - 8, E - 55, 16, 110, 8), $.fill(), $.restore();
      };
      Q(44, this.my, CME), Q(GW - 44, this.op, COP);
      let Z = this.host() ? this.b[0] : GW - this.b[0], U = this.b[1];
      if (!this.over && Z > -20 && Z < GW + 20)
        $.save(), $.shadowColor = "#fff", $.shadowBlur = 20, $.fillStyle = "#fff", $.beginPath(), $.arc(Z, U, 10, 0, Math.PI * 2), $.fill(), $.restore();
      if (this.wait > 0 && !this.over)
        hint($, "GET READY  -  W / S, ARROWS OR MOVE THE MOUSE");
      if (this.N.gone()) {
        leftScreen($, this.N.them);
        return;
      }
      if (this.over)
        endScreen($, this.iw, false, this.N.me, this.N.them, ["YOU " + this.sc[0] + "  -  " + this.sc[1] + " " + first(this.N.them)]), this.readyNote($);
    }
    get bx() {
      return this.host() ? this.b[0] : GW - this.b[0];
    }
    get by() {
      return this.b[1];
    }
  }
var SCW = 30;
var SCH = 17;
class SnakeVS extends VS {
    constructor($, J) {
      super($, J);
      this.k = "snake", this.q = [], this.tq = [], this.tid = 0, this.applied = 0, this.t = 0, this.iv = 0.13, this.sc = [0, 0], this.reset();
    }
    reset() {
      this.a = [[5, 8], [4, 8], [3, 8], [2, 8]], this.b = [[24, 8], [25, 8], [26, 8], [27, 8]], this.da = [1, 0], this.db = [-1, 0], this.qa = [], this.qb = [], this.sc = [0, 0], this.f = this.free(), this.g = null, this.gT = 9, this.iv = 0.13, this.over = false;
    }
    free() {
      for (let $ = 0;$ < 500; $++) {
        let J = [Math.random() * SCW | 0, Math.random() * SCH | 0];
        if (!this.a.concat(this.b).some((Q) => Q[0] === J[0] && Q[1] === J[1]))
          return J;
      }
      return [15, 2];
    }
    mine() {
      return this.N.role === "h" ? this.a : this.b;
    }
    dirOf($) {
      return $ && $.length > 1 ? [$[0][0] - $[1][0], $[0][1] - $[1][1]] : [1, 0];
    }
    turn($, J) {
      let Q = this.N.role === "h" ? this.qa : this.tq.map((U) => [U[1], U[2]]), Z = Q.length ? Q[Q.length - 1] : this.N.role === "h" ? this.da : this.dirOf(this.b);
      if (Z[0] === -$ && Z[1] === -J || Z[0] === $ && Z[1] === J)
        return;
      if (this.N.role === "h") {
        if (this.qa.length < 3)
          this.qa.push([$, J]);
      } else if (this.tq.push([++this.tid, $, J]), this.tq.length > 6)
        this.tq.shift();
    }
    keyIn($, J) {
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
      if (this.over && $ === "down") {
        this.key("Enter", true);
        return;
      }
      if ($ === "down")
        this.sw = [J, Q];
      else if ($ === "move" && this.sw) {
        let Z = J - this.sw[0], U = Q - this.sw[1];
        if (Math.hypot(Z, U) > 30)
          Math.abs(Z) > Math.abs(U) ? this.turn(Math.sign(Z), 0) : this.turn(0, Math.sign(U)), this.sw = [J, Q];
      } else if ($ === "up")
        this.sw = null;
    }
    step() {
      if (this.qa.length)
        this.da = this.qa.shift();
      if (this.qb.length)
        this.db = this.qb.shift();
      let $ = [this.a[0][0] + this.da[0], this.a[0][1] + this.da[1]], J = [this.b[0][0] + this.db[0], this.b[0][1] + this.db[1]], Q = $[0] === this.f[0] && $[1] === this.f[1], Z = J[0] === this.f[0] && J[1] === this.f[1], U = this.g && $[0] === this.g.x && $[1] === this.g.y, q = this.g && J[0] === this.g.x && J[1] === this.g.y, E = (N, F__L) => F__L ? N : N.slice(0, -1), Y = (N, F__L) => F__L.some((G) => G[0] === N[0] && G[1] === N[1]), K = (N) => N[0] < 0 || N[1] < 0 || N[0] >= SCW || N[1] >= SCH, V = E(this.a, Q || U), X = E(this.b, Z || q), W = K($) || Y($, V) || Y($, X), H = K(J) || Y(J, X) || Y(J, V);
      if ($[0] === J[0] && $[1] === J[1])
        W = H = true;
      if (W || H) {
        this.over = true, this.dr = W && H && this.sc[0] === this.sc[1], this.iw = this.dr ? false : W && H ? this.sc[0] > this.sc[1] : H, this.win = this.dr ? 3 : W && H ? this.sc[0] > this.sc[1] ? 1 : 2 : H ? 1 : 2, this.A.beep(140, 0.4, "sawtooth", 0.06);
        return;
      }
      if (this.a = [$].concat(V), this.b = [J].concat(X), Q || Z)
        this.sc[Q ? 0 : 1] += 10, this.iv = Math.max(0.075, this.iv - 0.002), this.f = this.free(), this.A.beep(880, 0.05, "square", 0.04);
      if (U || q)
        this.sc[U ? 0 : 1] += 50, this.g = null, this.A.beep(1320, 0.12, "triangle", 0.05);
    }
    update($) {
      let J = this.N;
      if (J.gone())
        return;
      let Q = this.peer();
      if (J.role === "h") {
        if (Q && Array.isArray(Q.tq))
          Q.tq.forEach((Z) => {
            if (Z[0] > this.applied) {
              this.applied = Z[0];
              let U = this.qb.length ? this.qb[this.qb.length - 1] : this.db;
              if (!(U[0] === -Z[1] && U[1] === -Z[2]) && this.qb.length < 3)
                this.qb.push([Z[1], Z[2]]);
            }
          });
        if (this.over) {
          if (this.ready === this.gn && Q && Q.r === this.gn)
            this.gn++, this.ready = -1, this.reset();
        } else {
          if (this.g) {
            if (this.g.t -= $, this.g.t <= 0)
              this.g = null;
          } else if (this.gT -= $, this.gT <= 0) {
            this.gT = 10 + Math.random() * 8;
            let Z = this.free();
            this.g = { x: Z[0], y: Z[1], t: 6 };
          }
          this.t += $;
          while (this.t >= this.iv && !this.over)
            this.t -= this.iv, this.step();
        }
        this.score = this.sc[0], J.send({ a: this.a, b: this.b, f: this.f, g: this.g ? [this.g.x, this.g.y] : 0, sc: this.sc, ov: this.over ? this.win : 0, gn: this.gn });
      } else if (J.send({ tq: this.tq, r: this.ready }), Q && Q.a) {
        if (Q.gn > this.gn)
          this.gn = Q.gn, this.ready = -1, this.tq = [];
        this.a = Q.a, this.b = Q.b, this.f = Q.f, this.g = Q.g ? { x: Q.g[0], y: Q.g[1] } : null;
        let Z = this.sc[0] + this.sc[1];
        if (this.sc = [Q.sc[1], Q.sc[0]], this.sc[0] + this.sc[1] > Z)
          this.A.beep(880, 0.05, "square", 0.03);
        this.over = !!Q.ov && Q.gn === this.gn, this.dr = Q.ov === 3, this.iw = Q.ov === 2, this.score = this.sc[0];
      }
    }
    draw($, J) {
      screenBg($, J), topBar($, "SNAKE  -  2 PLAYERS", this.score, "YOU " + this.sc[0] + "   " + first(this.N.them) + " " + this.sc[1]);
      let Q = 32, Z = (GW - SCW * Q) / 2, U = 70;
      if ($.fillStyle = "rgba(255,255,255,.03)", $.fillRect(Z, U, SCW * Q, SCH * Q), $.strokeStyle = "rgba(61,220,151,.5)", $.lineWidth = 2, $.strokeRect(Z, U, SCW * Q, SCH * Q), $.save(), $.shadowColor = "#ffd166", $.shadowBlur = 16, $.fillStyle = "#ffd166", $.beginPath(), $.arc(Z + this.f[0] * Q + Q / 2, U + this.f[1] * Q + Q / 2, Q * 0.36, 0, Math.PI * 2), $.fill(), $.restore(), this.g)
        $.save(), $.shadowColor = "#fff", $.shadowBlur = 22, $.fillStyle = "#ffffff", $.globalAlpha = 0.6 + 0.4 * Math.sin(J * 10), $.beginPath(), $.arc(Z + this.g.x * Q + Q / 2, U + this.g.y * Q + Q / 2, Q * 0.42, 0, Math.PI * 2), $.fill(), $.restore();
      let q = this.N.role === "h" ? this.a : this.b;
      if ([[this.N.role === "h" ? this.b : this.a, "255,31,79", "#ff8fa6"], [q, "76,201,240", "#c6f0ff"]].forEach(([Y, K, V]) => Y.forEach((X, W) => {
        let H = 1 - W / (Y.length + 4);
        $.fillStyle = W ? `rgba(${K},${0.45 + 0.55 * H})` : V, rr($, Z + X[0] * Q + 2, U + X[1] * Q + 2, Q - 4, Q - 4, 7), $.fill();
      })), q.length === 4 && !this.over) {
        let Y = q[0];
        $.font = F("900", 13), $.fillStyle = CME, $.textAlign = "center", $.fillText("YOU", Z + Y[0] * Q + Q / 2, U + Y[1] * Q - 8), hint($, "ARROWS / WASD OR SWIPE  -  DO NOT HIT THE WALLS, YOURSELF OR " + first(this.N.them));
      }
      if (this.N.gone()) {
        leftScreen($, this.N.them);
        return;
      }
      if (this.over)
        endScreen($, this.iw, this.dr, this.N.me, this.N.them, ["YOU " + this.sc[0] + "  -  " + this.sc[1] + " " + first(this.N.them)]), this.readyNote($);
    }
  }
function pickQs() {
    return QS.map(($, J) => J).sort(() => Math.random() - 0.5).slice(0, 10).map(($) => [$, [0, 1, 2, 3].sort(() => Math.random() - 0.5)]);
  }
class TriviaVS extends VS {
    constructor($, J) {
      super($, J);
      this.k = "trivia", this.qs = J.role === "h" ? pickQs() : null, this.i = 0, this.ph = "a", this.tl = 15, this.sc = [0, 0], this.ah = null, this.ag = null, this.my = null, this.rtT = 0, this.box = [];
    }
    q() {
      let $ = this.qs && this.qs[this.i];
      if (!$)
        return null;
      let J = QS[$[0]];
      return { q: J[0], o: $[1].map((Q) => ({ t: J[1][Q], ok: Q === J[2] })), why: J[3] };
    }
    choose($) {
      if (this.ph !== "a" || this.over || this.my)
        return;
      this.my = [this.i, $, +this.tl.toFixed(2)], this.A.beep(520, 0.04, "square", 0.03);
    }
    keyIn($, J) {
      if (!J)
        return;
      let Q = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 }[String($).toLowerCase()];
      if (Q !== undefined)
        this.choose(Q);
    }
    ptr($, J, Q) {
      if ($ !== "down")
        return;
      if (this.over) {
        this.key("Enter", true);
        return;
      }
      this.box.forEach((Z, U) => {
        if (J > Z[0] && J < Z[0] + Z[2] && Q > Z[1] && Q < Z[1] + Z[3])
          this.choose(U);
      });
    }
    update($) {
      let J = this.N;
      if (J.gone())
        return;
      let Q = this.peer();
      if (J.role === "h") {
        if (Q && Array.isArray(Q.a) && Q.a[0] === this.i && !this.ag && this.ph === "a")
          this.ag = Q.a;
        if (this.my && this.my[0] === this.i)
          this.ah = this.my;
        if (this.over) {
          if (this.ready === this.gn && Q && Q.r === this.gn)
            this.gn++, this.ready = -1, this.qs = pickQs(), this.i = 0, this.ph = "a", this.tl = 15, this.sc = [0, 0], this.ah = this.ag = this.my = null, this.over = false;
        } else if (this.ph === "a") {
          if (this.tl -= $, this.tl <= 0 || this.ah && this.ag) {
            this.tl = Math.max(0, this.tl);
            let Z = this.q(), U = (Y) => Y && Y[1] >= 0 && Z.o[Y[1]] && Z.o[Y[1]].ok, q = 0, E = 0;
            if (U(this.ah))
              q = 100 + Math.round(this.ah[2] * 10);
            if (U(this.ag))
              E = 100 + Math.round(this.ag[2] * 10);
            if (q && E)
              if (this.ah[2] >= this.ag[2])
                q += 50;
              else
                E += 50;
            else if (q)
              q += 50;
            else if (E)
              E += 50;
            this.sc[0] += q, this.sc[1] += E, this.ph = "s", this.rtT = 0, this.A.beep(U(this.ah) ? 988 : 180, 0.15, U(this.ah) ? "triangle" : "sawtooth", 0.05);
          }
        } else if (this.rtT += $, this.rtT > 3)
          if (this.i++, this.ah = this.ag = this.my = null, this.i >= this.qs.length)
            this.over = true, this.iw = this.sc[0] > this.sc[1], this.dr = this.sc[0] === this.sc[1];
          else
            this.ph = "a", this.tl = 15;
        this.score = this.sc[0], J.send({ qs: this.qs, i: this.i, ph: this.ph, tl: +this.tl.toFixed(2), ah: this.ah, ag: this.ag, sc: this.sc, ov: this.over ? this.dr ? 3 : this.iw ? 1 : 2 : 0, gn: this.gn });
      } else if (J.send({ a: this.my, r: this.ready }), Q && Q.qs) {
        if (Q.gn > this.gn)
          this.gn = Q.gn, this.ready = -1;
        if (Q.i !== this.i)
          this.i = Q.i, this.my = null;
        let Z = this.ph;
        if (this.qs = Q.qs, this.ph = Q.ph, this.tl = Math.max(0, Q.tl - (Q.ph === "a" ? Math.min(0.5, J.now() - this.rt) : 0)), this.sc = [Q.sc[1], Q.sc[0]], this.ah = Q.ag, this.ag = Q.ah, this.over = !!Q.ov && Q.gn === this.gn, this.dr = Q.ov === 3, this.iw = Q.ov === 2, this.score = this.sc[0], Z === "a" && this.ph === "s") {
          let U = this.q(), q = this.ah && this.ah[1] >= 0 && U && U.o[this.ah[1]] && U.o[this.ah[1]].ok;
          this.A.beep(q ? 988 : 180, 0.15, q ? "triangle" : "sawtooth", 0.05);
        }
      }
    }
    draw($, J) {
      if (screenBg($, J), topBar($, "POLICY TRIVIA  -  2 PLAYERS", this.score, "YOU " + this.sc[0] + "   " + first(this.N.them) + " " + this.sc[1]), this.N.gone()) {
        leftScreen($, this.N.them);
        return;
      }
      if (this.over) {
        endScreen($, this.iw, this.dr, this.N.me, this.N.them, ["YOU " + this.sc[0] + "  -  " + this.sc[1] + " " + first(this.N.them)]), this.readyNote($);
        return;
      }
      let Q = this.q();
      if (!Q) {
        glow($, "GETTING READY...", GW / 2, GH / 2, "#ffd166", 34);
        return;
      }
      $.fillStyle = "rgba(255,255,255,.06)", $.fillRect(60, 70, GW - 120, 8), $.fillStyle = this.tl < 5 ? "#ff1f4f" : "#3ddc97", $.fillRect(60, 70, (GW - 120) * this.tl / 15, 8), $.font = F("800", 13), $.textAlign = "left", $.fillStyle = "#b9a3ad", $.fillText("QUESTION " + (this.i + 1) + " OF 10", 60, 96), $.textAlign = "right";
      let Z = this.N.role === "h" ? this.ah || this.my : this.my, U = this.N.role === "h" ? this.ag : this.ag;
      $.fillStyle = U ? "#ffd166" : "#8f7d87", $.fillText(U ? first(this.N.them) + " ANSWERED" : first(this.N.them) + " IS THINKING", GW - 60, 96), $.font = F("800", 29), $.fillStyle = "#fff", $.textAlign = "center", $.textBaseline = "middle";
      let q = Q.q.split(" "), E = "", Y = [];
      q.forEach((X) => {
        let W = E ? E + " " + X : X;
        if ($.measureText(W).width > GW - 160)
          Y.push(E), E = X;
        else
          E = W;
      }), Y.push(E), Y.forEach((X, W) => $.fillText(X, GW / 2, 140 + W * 38)), this.box = [];
      let K = Z ? Z[1] : -1, V = this.ph === "s" && U ? U[1] : -1;
      Q.o.forEach((X, W) => {
        let H = (GW - 150) / 2, F__L = 60 + W % 2 * (H + 30), G = 246 + Math.floor(W / 2) * 112;
        this.box.push([F__L, G, H, 92]);
        let _ = "rgba(255,255,255,.05)", D = "rgba(255,255,255,.18)";
        if (this.ph === "s") {
          if (X.ok)
            _ = "rgba(61,220,151,.22)", D = "#3ddc97";
          else if (W === K)
            _ = "rgba(255,31,79,.22)", D = "#ff1f4f";
        } else if (W === K)
          _ = "rgba(76,201,240,.18)", D = CME;
        $.fillStyle = _, rr($, F__L, G, H, 92, 14), $.fill(), $.strokeStyle = D, $.lineWidth = 3, $.stroke(), $.fillStyle = "#ffd166", $.font = F("900", 22), $.textAlign = "left", $.fillText(String(W + 1), F__L + 20, G + 46), $.fillStyle = "#fff", $.font = F("700", 19);
        let O = X.t.split(" "), I = "", B = [];
        O.forEach((z) => {
          let M = I ? I + " " + z : z;
          if ($.measureText(M).width > H - 110)
            B.push(I), I = z;
          else
            I = M;
        }), B.push(I), B.slice(0, 3).forEach((z, M) => $.fillText(z, F__L + 56, G + 46 + (M - (Math.min(3, B.length) - 1) / 2) * 23));
        let k = [];
        if (this.ph === "s" && W === K)
          k.push(["YOU", CME]);
        if (W === V)
          k.push([first(this.N.them), COP]);
        k.forEach(([z, M], v) => {
          $.font = F("900", 11);
          let g = $.measureText(z).width + 14;
          $.fillStyle = M, rr($, F__L + H - g - 10, G + 8 + v * 22, g, 18, 9), $.fill(), $.fillStyle = "#fff", $.textAlign = "center", $.fillText(z, F__L + H - g / 2 - 10, G + 17 + v * 22), $.textAlign = "left";
        });
      }), $.font = F("700", 16), $.textAlign = "center", $.fillStyle = this.ph === "s" ? "#e9dde3" : "#8f7d87", $.fillText(this.ph === "s" ? Q.why : Z ? "LOCKED IN. WAITING FOR " + first(this.N.them) : "PRESS 1-4 OR CLICK  -  FIRST RIGHT ANSWER GETS +50", GW / 2, GH - 24);
    }
  }
var MAKE2 = { paddle: PaddleVS, snake: SnakeVS, trivia: TriviaVS };

export {MAKE2};
