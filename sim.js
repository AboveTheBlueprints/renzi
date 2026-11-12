// 人字：跟 人字.py 一字一样（拿 对.py 逐串对过）。
const NAMES = ['你', '老的', '小的', '伴', '大个', '灰背', '白额'];
const MAXE = { '你': 100, '老的': 70, '小的': 80, '伴': 100, '大个': 110, '灰背': 100, '白额': 95 };
const LAKE = 30;
const NEAR = { 10: '湖还远，只是天边一道亮。', 20: '湖近了一点，看得见岸上的苇子。', 26: '湖就在底下了，还差几下。' };
const LEADC = 6.0, ARMC = 2.1, ARMD = 0.25, ARMMIN = 1.5;
const WIND = { 9: '左', 10: '左', 11: '左', 19: '右', 20: '右', 21: '右', 22: '右' };

function pyRound(x) {
  const f = Math.floor(x), d = x - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return (f % 2 === 0) ? f : f + 1;
}
function bar(e, m) {
  const n = Math.max(e > 0 ? 1 : 0, pyRound(e / 10));
  return '█'.repeat(Math.max(0, n)) + '·'.repeat(Math.max(0, pyRound(m / 10) - n));
}
function without(arr, x) { const i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); }

class Flock {
  constructor() {
    this.E = Object.assign({}, MAXE);
    this.lead = '灰背';
    this.L = ['你', '小的', '老的'];
    this.R = ['大个', '伴', '白额'];
    this.down = [];
    this.step = 0;
    this.waited = false;
    this.run = 0;
    this.prev = '灰背';
    this.hist = {}; for (const n of NAMES) this.hist[n] = [];
  }
  flying() { return [this.lead].concat(this.L, this.R); }
  arms() { return this.L.concat(this.R); }
  where(n) {
    if (n === this.lead) return ['领', 0];
    let i = this.L.indexOf(n); if (i >= 0) return ['左', i + 1];
    i = this.R.indexOf(n); if (i >= 0) return ['右', i + 1];
    return null;
  }
  cost(n) {
    const [side, k] = this.where(n);
    if (side === '领') { let c = LEADC; if (this.step in WIND) c += 1.5; return c; }
    const arm = side === '左' ? this.L : this.R;
    const ahead = k === 1 ? this.lead : arm[k - 2];
    let c = Math.max(ARMMIN, ARMC - ARMD * (k - 1));
    if (this.E[ahead] < MAXE[ahead] * 0.35) c += 1.2;
    if ((this.step in WIND) && WIND[this.step] === side) c += 1.0;
    return c;
  }
  remove(n) { without(this.L, n); without(this.R, n); }
  toBack(n) { this.remove(n); (this.L.length <= this.R.length ? this.L : this.R).push(n); }
  act(a, out) {
    const [side, k] = this.where('你');
    if (a === '前' && side !== '领') {
      const arm = side === '左' ? this.L : this.R;
      if (k === 1) out.push('你前头就是领头的。');
      else { const t = arm[k - 1]; arm[k - 1] = arm[k - 2]; arm[k - 2] = t; out.push(`你往前挪了一格，到${arm[k - 1]}前头。`); }
    } else if (a === '后' && side !== '领') {
      const arm = side === '左' ? this.L : this.R;
      const had = this.arms().includes('小的');
      const rest = arm.filter(n => n !== '小的');
      const i = rest.indexOf('你');
      if (i === rest.length - 1) out.push('你已经在最后。');
      else {
        const t = rest[i]; rest[i] = rest[i + 1]; rest[i + 1] = t;
        arm.length = 0; for (const x of rest) arm.push(x);
        out.push(`你往后让了一格，让到${rest[i]}后头。`);
        if (had) { this.remove('小的'); arm.splice(i + 2, 0, '小的'); }
      }
    } else if (a === '换边' && side !== '领') {
      this.remove('你');
      (side === '左' ? this.R : this.L).push('你');
      out.push('你从人字底下穿过去，到了另一边最后。');
    } else if (a === '领') {
      if (side === '领') out.push('你本来就在头上。');
      else {
        const old = this.lead;
        this.remove('你'); this.lead = '你';
        this.toBack(old);
        out.push(`你飞到最前头。${old}退到了后头。`);
      }
    } else if (a === '退' && side === '领') {
      this.lead = null;
      this.toBack('你');
      this.pickLead(out, '你');
    } else if (a === '跟') {
    } else {
      out.push(`（"${a}"这会儿用不上）`);
    }
  }
  pickLead(out, skip) {
    const all = this.arms();
    let cand = all.filter(n => n !== '老的' && n !== '你' && n !== skip);
    if (!cand.length) cand = all.filter(n => n !== '你' && n !== skip);
    if (!cand.length) cand = all.slice();
    cand.sort((a, b) => (this.E[b] / MAXE[b]) - (this.E[a] / MAXE[a]));
    const n = cand[0];
    this.remove(n); this.lead = n;
    out.push(`${n}顶到了最前头。`);
  }
  followYoung() {
    if (!this.arms().includes('小的') || !this.flying().includes('你')) return;
    const [side, k] = this.where('你');
    const [ys, yk] = this.where('小的');
    if (side === '领') {
      if (yk === 1 && (ys === '左' || ys === '右')) return;
      this.remove('小的'); this.L.unshift('小的');
      return;
    }
    const arm = side === '左' ? this.L : this.R;
    if (ys === side && yk === k + 1) return;
    this.remove('小的');
    const k2 = arm.indexOf('你');
    arm.splice(k2 + 1, 0, '小的');
  }
  tick(a) {
    this.step += 1;
    const out = [];
    if (this.flying().includes('你')) {
      this.act(a, out);
      const before = this.arms().includes('小的') ? this.where('小的').join() : null;
      this.followYoung();
      if (before && this.where('小的').join() !== before && ['换边', '前', '领'].includes(a))
        out.push('小的跟了过来，又挤到你后头。');
    }
    for (const n of this.flying()) this.E[n] -= this.cost(n);
    let fellLead = false;
    for (const n of this.flying().slice()) {
      if (this.E[n] <= 0) {
        this.E[n] = 0;
        this.down.push([this.step, n]);
        out.push(n !== '你' ? `${n}往下落了，落进一块收过的田里，越来越小。` : '你的翅膀抬不起来了，你往下落。');
        if (n === this.lead) { this.lead = null; this.pickLead(out); fellLead = true; }
        else this.remove(n);
      }
    }
    const cur = this.lead === this.prev ? this.run : 0;
    if (this.lead && this.lead !== '你' && this.lead === this.prev && !fellLead && (cur >= 4 || this.E[this.lead] < MAXE[this.lead] * 0.45)) {
      const others = this.arms().filter(n => n !== '老的');
      let best = null, bv = -Infinity;
      for (const n of others) { const v = this.E[n] / MAXE[n]; if (v > bv) { bv = v; best = n; } }
      if (best === '你' && !this.waited) {
        this.waited = true;
        out.push(`${this.lead}回头看了你一眼。`);
      } else {
        this.waited = false;
        const old = this.lead;
        this.lead = null;
        this.toBack(old);
        this.pickLead(out);
      }
    }
    if (this.lead === '你' && this.E['你'] < 35 && !out.some(o => o.includes('越来越沉')))
      out.push('你的翅膀越来越沉。');
    this.run = this.lead === this.prev ? this.run + 1 : 1;
    this.prev = this.lead;
    for (const n of NAMES) {
      const w = this.flying().includes(n) ? this.where(n) : null;
      this.hist[n].push(w && w[0] === '领' ? '^' : (w ? String(w[1]) : ' '));
    }
    return out;
  }
  draw() {
    const rows = [];
    const ln = this.lead || '';
    rows.push(' '.repeat(14) + ln + (ln ? ' ' + bar(this.E[ln], MAXE[ln]) : ''));
    const m = Math.max(this.L.length, this.R.length);
    for (let i = 0; i < m; i++) {
      const l = i < this.L.length ? this.L[i] : '';
      const r = i < this.R.length ? this.R[i] : '';
      const lt = l ? `${l} ${bar(this.E[l], MAXE[l])}` : '';
      const rt = r ? `${r} ${bar(this.E[r], MAXE[r])}` : '';
      const pad = 12 - 3 * i;
      rows.push(' '.repeat(Math.max(0, pad)) + lt + ' '.repeat(6 + 6 * i) + rt);
    }
    return rows.join('\n');
  }
}

// 跟 人字.py 的 main() 印一样的字；网页也拿这些行
function playText(acts) {
  const g = new Flock();
  const P = [];
  P.push('傍晚。七只雁排成一个人字往南飞，前头远远有一片湖。');
  P.push('动作：跟（不动）、前、后、换边、领、退（在头上时退下来）');
  P.push('');
  P.push(g.draw());
  for (const a of acts) {
    if (!g.flying().includes('你') || g.step >= LAKE) break;
    const out = g.tick(a);
    P.push('');
    const w = (g.step in WIND) ? `  风从${WIND[g.step]}边来` : '';
    P.push(`—— 第 ${g.step} 下（${a}）${w}`);
    for (const o of out) P.push(o);
    if (g.flying().includes('你')) P.push(g.draw());
    if (g.step in NEAR) P.push(NEAR[g.step]);
  }
  if (!g.flying().includes('你') || g.step >= LAKE) {
    P.push('');
    if (g.flying().includes('你')) P.push(`湖到了。落在水上的有 ${g.flying().length} 只。`);
    else P.push(`你落在田里，看着它们往南去，还剩 ${g.flying().length} 只。`);
    for (const [st, n] of g.down) if (n !== '你') P.push(`  ${n}，第 ${st} 下落下去的。`);
    P.push('');
    P.push('一路上谁飞在哪（^ 是头上，数字是在那一边的第几只，空着是已经不在了）：');
    for (const n of NAMES) P.push(`  ${n.padEnd(3)} ${g.hist[n].join('')}`);
  }
  return P.join('\n');
}

if (typeof module !== 'undefined') module.exports = { Flock, playText, NAMES, MAXE, LAKE, WIND, NEAR, bar };
