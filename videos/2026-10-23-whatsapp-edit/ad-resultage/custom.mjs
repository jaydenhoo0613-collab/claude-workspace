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

// styles for the custom scenes + polish (appended last so it wins)
const STYLE = `
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
