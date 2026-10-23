// Custom motion-graphic scenes and polish for this ad, layered on top of engine.mjs output.
// Run after engine.mjs and place-text.sh:  node custom.mjs
// Writes compositions/x*.html, adds their layers to index.html, wipes every white card in,
// and eases captions in. Times come from assets/cut-asr.json, like beats.mjs.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const words = JSON.parse(readFileSync("assets/cut-asr.json", "utf8")).words;
const DUR = JSON.parse(readFileSync("assets/edit-decisions.json", "utf8")).duration;
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9$%]/g, "");
const find = (phrase, n = 1) => {
  const p = phrase.split(/\s+/).map(norm).filter(Boolean); let hit = 0;
  for (let i = 0; i + p.length <= words.length; i++) {
    if (p.every((q, j) => norm(words[i + j].text) === q) && ++hit === n) return [i, i + p.length - 1];
  }
  throw new Error(`phrase not found: "${phrase}" #${n}`);
};
const W = (phrase, n = 1) => words[find(phrase, n)[0]].start;
const r3 = (t) => +(+t).toFixed(3);
const at = (s, t) => r3(Math.max(0.01, t - s));

// card entrance: a fast wipe up from the bottom edge (starting state lives in CSS, see STYLE)
const WIPE = (id) => `tl.fromTo("#${id}", {clipPath: "inset(100% 0% 0% 0%)"}, {clipPath: "inset(0% 0% 0% 0%)", duration: .22, ease: "power3.out", immediateRender: false}, 0);\n`;

const comp = (id, s, e, html, js) => writeFileSync(`compositions/${id}.html`, `<template id="${id}-template">
<div data-composition-id="${id}" data-start="0" data-width="1080" data-height="1920" data-duration="${r3(e - s)}">
<div class="wcard" id="${id}">${html}</div>
<script>
(function(){
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
${WIPE(id)}${js}
window.__timelines["${id}"] = tl;
})();
</script>
</div>
</template>
`);
const scenes = [];

// x1: "so why does your calendar look like a rollercoaster?" - a jagged line draws across, then the word
{
  const id = "x1", s = W("so why"), e = W("one month");
  const path = "M40 300 C 110 300, 120 80, 190 80 S 260 380, 330 380 S 410 40, 480 40 S 560 420, 630 410 S 720 140, 780 150 S 840 330, 880 320";
  const word = "ROLLERCOASTER?";
  const html = `<div class="xsm" id="${id}-a">so why does your calendar</div><div class="xsm" id="${id}-b">look like a</div>
<svg class="x1svg" viewBox="0 0 920 460"><path class="x1ax" d="M20 10 L20 440 L900 440"/><text x="0" y="230" class="x1lab" transform="rotate(-90 0 230)">calls booked</text>
<path class="x1area" id="${id}-f" d="${path} L880 440 L40 440 Z"/><path class="x1ln" id="${id}-l" d="${path}"/></svg>
<div class="x1big">${[...word].map((c, i) => `<span id="${id}-c${i}">${c}</span>`).join("")}</div>`;
  let js = `tl.fromTo("#${id}-a", {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: .25, ease: "power2.out", immediateRender: false}, .05);
tl.to("#${id}-a", {opacity: 0, y: -16, duration: .15}, ${at(s, W("look like")) - 0.15});
tl.fromTo("#${id}-b", {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: .22, ease: "power2.out", immediateRender: false}, ${at(s, W("look like"))});
tl.fromTo("#${id}-l", {strokeDashoffset: 2400}, {strokeDashoffset: 0, duration: 1.35, ease: "power1.inOut", immediateRender: false}, .12);
tl.fromTo("#${id}-f", {opacity: 0}, {opacity: 1, duration: .5, immediateRender: false}, 1.1);\n`;
  const t0 = at(s, W("blue"));
  [...word].forEach((_, i) => { js += `tl.fromTo("#${id}-c${i}", {opacity: 0, y: 40, filter: "blur(10px)"}, {opacity: 1, y: 0, filter: "blur(0px)", duration: .22, ease: "power3.out", immediateRender: false}, ${r3(t0 + i * 0.03)});\n`; });
  comp(id, s, e, html, js); scenes.push({ id, s, e });
}

// x2: "So I'm Jayden, founder of Resultage" - name tag, then the company name wipes on over a growing underline
{
  const id = "x2", s = W("i'm"), e = W("so", 3);
  const html = `<div class="x2wrap"><div class="tag green" id="${id}-n">JAYDEN</div><div class="xsm x2role" id="${id}-r">founder of</div>
<div class="x2co" id="${id}-co">RESULTAGE</div><div class="x2bar" id="${id}-u"></div></div>`;
  const js = `tl.fromTo("#${id}-n", {scaleY: .06, opacity: 1}, {scaleY: 1, duration: .26, ease: "power3.out", immediateRender: false}, ${at(s, W("jayden"))});
tl.fromTo("#${id}-r", {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: .25, ease: "power2.out", immediateRender: false}, ${at(s, W("founder"))});
tl.fromTo("#${id}-co", {clipPath: "inset(0% 100% 0% 0%)"}, {clipPath: "inset(0% 0% 0% 0%)", duration: .5, ease: "power3.out", immediateRender: false}, ${at(s, W("resultage"))});
tl.fromTo("#${id}-u", {scaleX: 0}, {scaleX: 1, duration: .55, ease: "power3.inOut", immediateRender: false}, ${r3(at(s, W("resultage")) + 0.1)});\n`;
  comp(id, s, e, html, js); scenes.push({ id, s, e });
}

// x3: "our one job is booking you 15-20 qualified sales calls a month" - count up while a month calendar fills
{
  const id = "x3", s = W("and our one"), e = W("on a pay-up");
  const booked = [0, 2, 3, 7, 8, 10, 11, 15, 16, 17, 19, 22, 23, 24, 25, 29, 30, 32]; // weekday cells, 5 weeks x 7 days
  let grid = `<div class="x3hd">${["M", "T", "W", "T", "F", "S", "S"].map(d => `<span>${d}</span>`).join("")}</div><div class="x3grid">`;
  for (let i = 0; i < 35; i++) grid += `<div class="x3c" id="${id}-g${i}"></div>`;
  grid += `</div>`;
  const html = `<div class="xsm x3top" id="${id}-t">booking you</div><div class="x3num" id="${id}-n">15-20</div>${grid}
<div class="xsub" id="${id}-s0">qualified sales calls</div><div class="xsub" id="${id}-s1">a month</div>`;
  const tn = at(s, W("15"));
  let js = `tl.fromTo("#${id}-t", {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: .25, ease: "power2.out", immediateRender: false}, ${at(s, W("booking"))});
tl.fromTo(".x3c", {opacity: 0, scale: .7}, {opacity: 1, scale: 1, duration: .3, stagger: .012, ease: "power2.out", immediateRender: false}, .08);
tl.fromTo("#${id}-n", {opacity: 0, scale: .9, filter: "blur(12px)"}, {opacity: 1, scale: 1, filter: "blur(0px)", duration: .32, ease: "power3.out", immediateRender: false}, ${tn});
tl.fromTo("#${id}-s0", {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: .25, ease: "power2.out", immediateRender: false}, ${at(s, W("qualified"))});
tl.fromTo("#${id}-s1", {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: .25, ease: "power2.out", immediateRender: false}, ${at(s, W("a month", 2))});\n`;
  booked.forEach((c, i) => { js += `tl.fromTo("#${id}-g${c}", {backgroundColor: "#EDEDED"}, {backgroundColor: "#16A34A", duration: .18, ease: "power2.out", immediateRender: false}, ${r3(tn + i * 0.07)});
tl.fromTo("#${id}-g${c}", {scale: .78}, {scale: 1, duration: .28, ease: "back.out(3)", immediateRender: false}, ${r3(tn + i * 0.07)});\n`; });
  comp(id, s, e, html, js); scenes.push({ id, s, e });
}

// x4: "one business coach went from 4 calls a month to 17" - two bars grow, an arrow draws between them
{
  const id = "x4", s = W("and one business"), e = DUR;
  const base = 1250, unit = 38; // px per call
  const h4 = 4 * unit, h17 = 17 * unit;
  const html = `<div class="xsm x4top" id="${id}-t">one business coach went from</div>
<div class="x4bar gray" id="${id}-b0" style="left:200px;height:${h4}px;top:${base - h4}px"></div>
<div class="x4num" id="${id}-n0" style="left:200px;top:${base - h4 - 190}px">4</div>
<div class="x4bar green" id="${id}-b1" style="left:620px;height:${h17}px;top:${base - h17}px"></div>
<div class="x4num g" id="${id}-n1" style="left:620px;top:${base - h17 - 190}px"><span id="${id}-k">0</span></div>
<svg class="x4arr" viewBox="0 0 1080 1920"><path id="${id}-a" d="M400 ${base - h4 - 220} C 430 ${base - h17 + 10}, 500 ${base - h17 + 40}, 590 ${base - h17 + 40}"/><path id="${id}-h" d="M556 ${base - h17 + 8} L594 ${base - h17 + 40} L556 ${base - h17 + 72}"/></svg>
<div class="x4base"></div><div class="xsub x4sub" id="${id}-s">calls a month</div>`;
  const t4 = at(s, W("4 calls")), t17 = at(s, W("17"));
  const js = `tl.fromTo("#${id}-t", {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: .25, ease: "power2.out", immediateRender: false}, .05);
tl.fromTo("#${id}-b0", {scaleY: 0}, {scaleY: 1, duration: .45, ease: "power3.out", immediateRender: false}, ${t4});
tl.fromTo("#${id}-n0", {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: .25, ease: "power2.out", immediateRender: false}, ${r3(t4 + 0.15)});
tl.fromTo("#${id}-s", {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: .25, ease: "power2.out", immediateRender: false}, ${at(s, W("a month", 3))});
tl.fromTo("#${id}-a", {strokeDashoffset: 700}, {strokeDashoffset: 0, duration: .45, ease: "power2.inOut", immediateRender: false}, ${r3(t17 - 0.35)});
tl.fromTo("#${id}-h", {opacity: 0}, {opacity: 1, duration: .1, immediateRender: false}, ${r3(t17 + 0.08)});
tl.fromTo("#${id}-b1", {scaleY: 0}, {scaleY: 1, duration: .7, ease: "power3.out", immediateRender: false}, ${t17});
tl.fromTo("#${id}-n1", {opacity: 0}, {opacity: 1, duration: .15, immediateRender: false}, ${t17});
{ const o = {v: 0}; tl.fromTo(o, {v: 0}, {v: 17, duration: .7, ease: "power3.out", immediateRender: false, onUpdate: () => { const el = document.getElementById("${id}-k"); if (el) el.textContent = Math.round(o.v); }}, ${t17}); }\n`;
  comp(id, s, e, html, js); scenes.push({ id, s, e });
}

// x5: "It's like a restaurant where the chef also takes the orders and answers the call. Something has to give"
// A flat illustrated kitchen: steaming pan, the chef pops up, an order pad writes itself, a phone rings,
// then the chef gets stressed and the phone goes red.
{
  const id = "x5", s = W("it's like"), e = W("and it's always");
  const K = "#1F1F1F"; // outline
  const html = `<div class="xsm" id="${id}-t0">It's like a restaurant</div>
<svg class="x5svg" viewBox="0 0 1080 1920">
  <defs><clipPath id="${id}-padclip"><rect x="110" y="650" width="240" height="300" rx="22"/></clipPath></defs>
  <ellipse cx="540" cy="1215" rx="430" ry="26" fill="#000" opacity=".06"/>
  </svg><div class="x5o" id="${id}-chef"><svg viewBox="0 0 1080 1920">
    <g id="${id}-hat">
      <circle cx="488" cy="452" r="58" fill="#fff" stroke="${K}" stroke-width="7"/>
      <circle cx="592" cy="452" r="58" fill="#fff" stroke="${K}" stroke-width="7"/>
      <circle cx="540" cy="422" r="70" fill="#fff" stroke="${K}" stroke-width="7"/>
      <rect x="462" y="462" width="156" height="78" rx="14" fill="#fff" stroke="${K}" stroke-width="7"/>
      <path d="M470 470 h140" stroke="#fff" stroke-width="12"/>
    </g>
    <path d="M412 1010 L424 790 Q432 712 540 704 Q648 712 656 790 L668 1010 Z" fill="#fff" stroke="${K}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M540 712 L540 1005" stroke="#E6E6E6" stroke-width="5"/>
    <circle cx="505" cy="800" r="9" fill="${K}"/><circle cx="575" cy="800" r="9" fill="${K}"/>
    <circle cx="505" cy="870" r="9" fill="${K}"/><circle cx="575" cy="870" r="9" fill="${K}"/>
    <path d="M498 702 L582 702 L540 752 Z" fill="var(--pain)" stroke="${K}" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="540" cy="612" r="92" fill="#F4CDA5" stroke="${K}" stroke-width="7"/>
    <circle cx="496" cy="640" r="15" fill="#F3A08C" opacity=".55"/><circle cx="584" cy="640" r="15" fill="#F3A08C" opacity=".55"/>
    <g id="${id}-eyes"><circle cx="508" cy="600" r="10" fill="${K}"/><circle cx="572" cy="600" r="10" fill="${K}"/></g>
    <path id="${id}-brow" d="M488 582 L524 566 M592 582 L556 566" stroke="${K}" stroke-width="7" stroke-linecap="round"/>
    <path id="${id}-smile" d="M508 645 Q540 674 572 645" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round"/>
    <path id="${id}-worry" d="M510 660 Q525 648 540 660 Q555 672 570 660" fill="none" stroke="${K}" stroke-width="7" stroke-linecap="round"/>
    <path id="${id}-sw0" d="M650 560 Q664 584 650 596 Q636 584 650 560 Z" fill="#7CC4F2" stroke="${K}" stroke-width="4"/>
    <path id="${id}-sw1" d="M432 590 Q444 610 432 620 Q420 610 432 590 Z" fill="#7CC4F2" stroke="${K}" stroke-width="4"/>
</svg></div><svg class="x5svg" viewBox="0 0 1080 1920">
  <rect x="250" y="1000" width="580" height="200" rx="26" fill="#2A2A2A" stroke="${K}" stroke-width="7"/>
  <rect x="226" y="980" width="628" height="46" rx="18" fill="#3C3C3C" stroke="${K}" stroke-width="7"/>
  <circle cx="400" cy="1110" r="22" fill="#555"/><circle cx="680" cy="1110" r="22" fill="#555"/>
  <rect x="470" y="1085" width="140" height="50" rx="12" fill="#1A1A1A"/>
  <g id="${id}-pan">
    <path d="M430 950 Q430 985 470 985 L610 985 Q650 985 650 950 Z" fill="#4A4A4A" stroke="${K}" stroke-width="7" stroke-linejoin="round"/>
    <rect x="646" y="944" width="120" height="18" rx="9" fill="#4A4A4A" stroke="${K}" stroke-width="6"/>
    <ellipse cx="540" cy="950" rx="112" ry="14" fill="#5C5C5C" stroke="${K}" stroke-width="6"/>
  </g>
  <g class="x5steam"><path id="${id}-st0" d="M490 925 C470 895 510 875 490 845"/><path id="${id}-st1" d="M540 925 C520 890 560 870 540 835"/><path id="${id}-st2" d="M590 925 C570 895 610 875 590 845"/></g>
</svg><div class="x5o" id="${id}-pad"><svg viewBox="0 0 1080 1920">
    <rect x="110" y="650" width="240" height="300" rx="22" fill="#FFF7DE" stroke="${K}" stroke-width="7"/>
    <rect x="110" y="650" width="240" height="56" rx="22" fill="var(--win)" stroke="${K}" stroke-width="7"/>
    <g clip-path="url(#${id}-padclip)" class="x5lines">
      <path id="${id}-w0" d="M145 760 H315"/><path id="${id}-w1" d="M145 815 H290"/><path id="${id}-w2" d="M145 870 H305"/><path id="${id}-w3" d="M145 925 H250"/>
    </g>
    <g id="${id}-pen"><rect x="300" y="730" width="22" height="120" rx="8" fill="var(--accent)" stroke="${K}" stroke-width="5" transform="rotate(30 311 790)"/></g>
</svg></div><div class="x5o" id="${id}-phone"><svg viewBox="0 0 1080 1920"><g id="${id}-ph">
    <rect x="752" y="640" width="196" height="330" rx="34" fill="${K}"/>
    <rect id="${id}-scr" x="768" y="668" width="164" height="274" rx="20" fill="var(--win)"/>
    <path d="M820 780 q0 -18 18 -18 l10 0 l10 26 l-14 10 q10 22 32 32 l10 -14 l26 10 l0 10 q0 18 -18 18 q-74 -6 -74 -74 z" fill="#fff"/>
    <g class="x5ring"><path id="${id}-r0" d="M968 700 q26 30 0 60"/><path id="${id}-r1" d="M992 680 q44 50 0 100"/></g>
</g></svg></div>
<div class="x5lab" id="${id}-l0">THE CHEF</div><div class="x5lab" id="${id}-l1">TAKES THE ORDERS</div>
<div class="x5lab" id="${id}-l2">ANSWERS THE CALL</div><div class="x5lab red" id="${id}-l3">SOMETHING HAS TO GIVE</div>`;
  const tc = at(s, W("chef")), to = at(s, W("takes the orders")), tp = at(s, W("answers the call")), tg = at(s, W("something"));
  const dur = r3(e - s);
  const pop = (sel, t, origin) => `tl.fromTo("${sel}", {opacity: 0, scale: .4, y: 40}, {opacity: 1, scale: 1, y: 0, duration: .42, ease: "back.out(1.8)", transformOrigin: "${origin}", immediateRender: false}, ${t});\n`;
  const lab = (i, t, next) => `tl.fromTo("#${id}-l${i}", {opacity: 0, y: 30, filter: "blur(8px)"}, {opacity: 1, y: 0, filter: "blur(0px)", duration: .26, ease: "power3.out", immediateRender: false}, ${t});\n` +
    (next !== undefined ? `tl.to("#${id}-l${i}", {opacity: 0, y: -24, filter: "blur(6px)", duration: .16, ease: "power1.in"}, ${r3(next - 0.16)});\n` : "");
  let js = "";
  // intro line, then the kitchen is already cooking
  js += `tl.fromTo("#${id}-t0", {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: .25, ease: "power2.out", immediateRender: false}, .05);\n`;
  js += `tl.to("#${id}-t0", {opacity: 0, y: -16, duration: .18}, ${r3(tc - 0.18)});\n`;
  ["st0", "st1", "st2"].forEach((p, i) => { js += `tl.fromTo("#${id}-${p}", {y: 20, opacity: 0}, {y: -60, opacity: .9, duration: 1.1, ease: "sine.out", repeat: ${Math.ceil(dur / 1.1)}, immediateRender: false}, ${r3(0.1 + i * 0.35)});\n`; });
  js += `tl.fromTo("#${id}-pan", {rotation: 0}, {rotation: -2.5, duration: .3, yoyo: true, repeat: ${Math.ceil(dur / 0.3)}, ease: "sine.inOut", svgOrigin: "540 985", immediateRender: false}, .1);\n`;
  // the chef
  js += pop(`#${id}-chef`, tc, "540px 1010px") + lab(0, tc, to);
  js += `tl.fromTo("#${id}-hat", {rotation: -6}, {rotation: 0, duration: .5, ease: "elastic.out(1, .4)", svgOrigin: "540 540", immediateRender: false}, ${r3(tc + 0.2)});\n`;
  // takes the orders: the pad pops in and the lines write themselves
  js += pop(`#${id}-pad`, to, "230px 950px") + lab(1, to, tp);
  [0, 1, 2, 3].forEach(i => { js += `tl.fromTo("#${id}-w${i}", {strokeDashoffset: 200}, {strokeDashoffset: 0, duration: .22, ease: "power1.inOut", immediateRender: false}, ${r3(to + 0.3 + i * 0.2)});\n`; });
  js += `tl.fromTo("#${id}-pen", {x: -150, y: 0}, {x: 0, y: 165, duration: .8, ease: "none", immediateRender: false}, ${r3(to + 0.3)});\n`;
  // answers the call: the phone pops in and rings
  js += pop(`#${id}-phone`, tp, "850px 970px") + lab(2, tp, tg);
  js += `tl.fromTo("#${id}-ph", {rotation: -7}, {rotation: 7, duration: .07, yoyo: true, repeat: 9, ease: "sine.inOut", svgOrigin: "850 805", immediateRender: false}, ${r3(tp + 0.35)});\n`;
  js += `tl.fromTo(".x5ring path", {opacity: 0}, {opacity: 1, duration: .14, stagger: .08, yoyo: true, repeat: 5, immediateRender: false}, ${r3(tp + 0.35)});\n`;
  // something has to give: stress, the phone goes red, everything shakes
  js += lab(3, tg);
  js += `tl.to("#${id}-smile", {opacity: 0, duration: .1}, ${tg});\ntl.fromTo("#${id}-worry", {opacity: 0}, {opacity: 1, duration: .12, immediateRender: false}, ${tg});\n`;
  js += `tl.fromTo("#${id}-brow", {rotation: 0}, {rotation: 0, opacity: 1, duration: .1, immediateRender: false}, ${tg});\n`;
  js += `tl.fromTo("#${id}-sw0", {opacity: 0, y: -10}, {opacity: 1, y: 40, duration: .7, ease: "power1.in", immediateRender: false}, ${r3(tg + 0.1)});\n`;
  js += `tl.fromTo("#${id}-sw1", {opacity: 0, y: -10}, {opacity: 1, y: 40, duration: .7, ease: "power1.in", immediateRender: false}, ${r3(tg + 0.3)});\n`;
  js += `tl.to("#${id}-scr", {fill: "#F53131", duration: .2}, ${r3(tg + 0.15)});\n`;
  js += `tl.fromTo("#${id}-chef", {x: -9}, {x: 9, duration: .06, yoyo: true, repeat: 7, ease: "sine.inOut", immediateRender: false}, ${r3(tg + 0.1)});\n`;
  comp(id, s, e, html, js); scenes.push({ id, s, e });
}

// styles for the custom scenes + polish (appended last so it wins)
const STYLE = `
.x5svg{position:absolute;inset:0;width:1080px;height:1920px;overflow:visible}
.x5o{position:absolute;inset:0}.x5o svg{position:absolute;inset:0;width:1080px;height:1920px;overflow:visible}
#x5-t0{top:250px}
#x5-chef,#x5-pad,#x5-phone,#x5-worry,#x5-sw0,#x5-sw1,#x5-brow,.x5ring path,.x5steam path{opacity:0}
.x5steam path{fill:none;stroke:#C9C9C9;stroke-width:10;stroke-linecap:round}
.x5lines path{fill:none;stroke:#555;stroke-width:9;stroke-linecap:round;stroke-dasharray:200;stroke-dashoffset:200}
.x5ring path{fill:none;stroke:var(--win);stroke-width:9;stroke-linecap:round}
.x5lab{position:absolute;left:0;right:0;top:1270px;text-align:center;font:400 128px/1 "Bebas Neue",sans-serif;-webkit-text-stroke:3px currentColor;paint-order:stroke fill;color:#111;white-space:nowrap;opacity:0}
.x5lab.red{color:var(--pain)}
.wcard{clip-path:inset(100% 0% 0% 0%)}
.cap{font-weight:700}
.bl{font-size:112px;white-space:nowrap}.cbody{padding-left:90px;padding-right:60px}.clabel{font-size:60px}.tri{font-size:70px}
.xsm{position:absolute;left:0;right:0;text-align:center;font:600 60px "Inter",sans-serif;color:#333;opacity:0}
.xsub{position:absolute;left:0;right:0;text-align:center;font:600 56px "Inter",sans-serif;color:#333;opacity:0}
#x1-a,#x1-b{top:330px}
.x1svg{position:absolute;left:80px;top:470px;width:920px;height:460px;overflow:visible}
.x1ax{fill:none;stroke:#111;stroke-width:6;stroke-linecap:round}
.x1lab{font:600 30px "Inter",sans-serif;fill:#999}
.x1ln{fill:none;stroke:var(--pain);stroke-width:14;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:2400;stroke-dashoffset:2400}
.x1area{fill:var(--pain);fill-opacity:.08;stroke:none;opacity:0}
.x1big{position:absolute;left:0;right:0;top:1030px;text-align:center;font:400 168px/1 "Bebas Neue",sans-serif;-webkit-text-stroke:3px currentColor;paint-order:stroke fill;color:#111;white-space:nowrap}
.x1big span{display:inline-block;opacity:0}
.x2wrap{position:absolute;left:0;right:0;top:430px;display:flex;flex-direction:column;align-items:center}
#x2-n{transform-origin:50% 50%;opacity:0}
.x2role{position:relative;margin-top:70px}
.x2co{margin-top:18px;font:400 190px/1 "Bebas Neue",sans-serif;-webkit-text-stroke:3px currentColor;paint-order:stroke fill;color:#111;letter-spacing:4px;clip-path:inset(0% 100% 0% 0%)}
.x2bar{width:620px;height:16px;border-radius:8px;background:var(--win);margin-top:14px;transform:scaleX(0);transform-origin:0 50%}
.x3top{top:240px}
.x3num{position:absolute;left:0;right:0;top:330px;text-align:center;font:800 230px/1 "Inter",sans-serif;letter-spacing:-8px;color:#111;font-variant-numeric:tabular-nums;opacity:0}
.x3hd{position:absolute;left:150px;top:640px;width:780px;display:grid;grid-template-columns:repeat(7,1fr);font:700 34px "Inter",sans-serif;color:#aaa;text-align:center}
.x3grid{position:absolute;left:150px;top:700px;width:780px;display:grid;grid-template-columns:repeat(7,1fr);gap:16px}
.x3c{height:96px;border-radius:18px;background:#EDEDED;opacity:0}
#x3-s0{top:1290px}#x3-s1{top:1365px}
.x4top{top:300px}
.x4bar{position:absolute;width:260px;border-radius:22px 22px 0 0;transform-origin:50% 100%;transform:scaleY(0)}
.x4bar.gray{background:#CFCFCF}.x4bar.green{background:var(--win)}
.x4num{position:absolute;width:260px;text-align:center;font:800 170px/1 "Inter",sans-serif;letter-spacing:-6px;color:#888;opacity:0}
.x4num.g{color:var(--win)}
.x4base{position:absolute;left:150px;width:780px;top:1250px;height:6px;border-radius:3px;background:#111}
.x4sub{top:1290px}
.x4arr{position:absolute;inset:0;width:1080px;height:1920px;overflow:visible}
.x4arr path{fill:none;stroke:#111;stroke-width:9;stroke-linecap:round;stroke-linejoin:round}
#x4-a{stroke-dasharray:700;stroke-dashoffset:700}#x4-h{opacity:0}
`;

let html = readFileSync("index.html", "utf8");
html = html.replace("</style></head>", `${STYLE}</style></head>`);
html = html.replace('<audio id="mix"', scenes.map(c => `<div id="el-${c.id}" class="layer card-layer" data-composition-id="${c.id}" data-composition-src="compositions/${c.id}.html" data-start="${r3(c.s)}" data-duration="${r3(c.e - c.s)}" data-track-index="5" data-width="1080" data-height="1920"></div>`).join("\n") + '\n<audio id="mix"');
writeFileSync("index.html", html);

// engine cards wipe in too
for (const f of readdirSync("compositions").filter(f => /^c\d+\.html$/.test(f))) {
  const id = f.replace(".html", ""); let c = readFileSync(`compositions/${f}`, "utf8");
  if (!c.includes("inset(100% 0% 0% 0%)")) c = c.replace("const tl = gsap.timeline({ paused: true });", `const tl = gsap.timeline({ paused: true });\n${WIPE(id)}`);
  writeFileSync(`compositions/${f}`, c);
}

// captions ease in (still the whole phrase at once)
let cap = readFileSync("compositions/captions.html", "utf8");
cap = cap.replace('tl.set("#cap" + i, {opacity: 1}, w.s);', 'tl.fromTo("#cap" + i, {opacity: 0, y: 18}, {opacity: 1, y: 0, duration: .14, ease: "power2.out", immediateRender: false}, w.s);');
writeFileSync("compositions/captions.html", cap);
console.log("custom scenes", scenes.map(c => `${c.id} ${r3(c.s)}-${r3(c.e)}`).join(", "));

// ---------- hyper pacing: sound-effect cue sheet + zoom punches and flashes on the big face hits ----------
const sfx = [
  [0.04, "whoosh"], [W("10K"), "pop"], [W("10K") + 0.55, "stamp"],
  [W("so why"), "swipe"], [W("blue"), "thud"], [W("one month"), "whoosh"],
  [W("next month"), "swipe"], [W("demon"), "pop"], [W("the calendar"), "pop"],
  [W("it's like"), "swipe"], [W("chef"), "pop"], [W("takes the orders"), "pop"], [W("takes the orders") + 0.3, "type"],
  [W("answers the call"), "pop"], [W("answers the call") + 0.35, "chime"], [W("something"), "thud"],
  [W("and it's always"), "whoosh"], [W("sales calls"), "stamp"],
  [W("i'm"), "swipe"], [W("jayden"), "pop"], [W("resultage"), "whoosh"],
  [W("so", 3), "whoosh"], [W("online coaches"), "thud"],
  [W("and our one"), "swipe"], [W("15"), "cascade"],
  [W("on a pay-up"), "whoosh"], [W("results basis"), "stamp"],
  [W("with the right"), "swipe"], [W("with the right") + 0.05, "pop"], [W("with the right", 2), "pop"], [W("ready to talk"), "pop"],
  [W("and one business"), "swipe"], [W("4 calls"), "thud"], [W("17"), "stamp"], [W("17") + 0.1, "chime"],
].map(([time, s]) => ({ time: r3(time), sfx: s })).sort((a, b) => a.time - b.time);
writeFileSync("assets/sfx-events.json", JSON.stringify(sfx, null, 1));

const hits = [W("10K") + 0.55, W("sales calls"), W("online coaches"), W("results basis")].map(r3);
let punch = "";
for (const t of hits) {
  punch += `tl.fromTo(".camlift", {scale: 1}, {scale: 1.07, duration: .07, ease: "power2.out", immediateRender: false}, ${t});
tl.to(".camlift", {scale: 1, duration: .3, ease: "power3.out"}, ${r3(t + 0.07)});
tl.fromTo(".camlift", {x: 0}, {x: 10, duration: .035, yoyo: true, repeat: 5, ease: "sine.inOut", immediateRender: false}, ${t});
tl.fromTo("#flash", {opacity: 0}, {opacity: .55, duration: .03, immediateRender: false}, ${t});
tl.to("#flash", {opacity: 0, duration: .16, ease: "power1.out"}, ${r3(t + 0.03)});\n`;
}
html = readFileSync("index.html", "utf8");
html = html.replace("</style></head>", "#flash{position:absolute;inset:0;background:#fff;opacity:0;z-index:4;pointer-events:none}\n.camlift{transform-origin:540px 1000px}\n</style></head>");
html = html.replace('<audio id="mix"', '<div id="flash"></div>\n<audio id="mix"');
html = html.replace('window.__timelines["main"] = tl;', punch + 'window.__timelines["main"] = tl;');
writeFileSync("index.html", html);
console.log("sfx events", sfx.length, "punches", hits.length);
