// Project copy of the skill's build-audio.mjs: synthesized SFX kit + the music.py bed (instead of the drone pad), mixed under the voice, for when the reference video
// has sound effects or music and nothing licensed was supplied. Every sound is generated here (no
// third-party audio, nothing to license). Organic reels, ads and long-form never use this.
// Run inside a project dir with assets/edit-decisions.json (duration), assets/sfx-events.json
// ([{"time": 1.2, "sfx": "pop"}, ...]) and assets/voice-raw.wav.   usage: node build-audio.mjs [bedDb]
// The voice gets one gain value; the finished mix gets one gain value (target -16 LUFS, peaks <= -1.5 dBTP).
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const DUR = JSON.parse(readFileSync("assets/edit-decisions.json", "utf8")).duration;
const EV = JSON.parse(readFileSync("assets/sfx-events.json", "utf8"));
const BED_DB = Number(process.argv[2] ?? -30); // bed level relative, dB
mkdirSync("assets/sfx", { recursive: true });
const FFV = +((spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).stdout.match(/ffmpeg version n?(\d+)/) || [0, 7])[1]);
const graphFlag = FFV >= 7 ? "-/filter_complex" : "-filter_complex_script";
const ff = (args) => { const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { encoding: "utf8" }); if (r.status) throw new Error(r.stderr); return r; };
const ffi = (args) => spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8" });
const gen = (name, expr, d, filt = "") => ff(["-f", "lavfi", "-i", `aevalsrc='${expr}':s=48000:d=${d}`, ...(filt ? ["-af", filt] : []), "-ac", "2", `assets/sfx/${name}.wav`]);
const N = "(random(0)*2-1)";
const cascade = Array.from({ length: 6 }, (_, k) => `gt(t,${0.09 * k})*sin(2*PI*${1100 + 180 * k}*(t-${0.09 * k}))*exp(-(t-${0.09 * k})*55)`).join("+");
const typing = Array.from({ length: 7 }, (_, k) => `gt(t,${0.064 * k})*${N}*exp(-(t-${0.064 * k})*260)`).join("+");
const SFX = {
  tick: [`0.5*sin(2*PI*2300*t)*exp(-t*80)`, 0.1],
  click: [`0.6*${N}*exp(-t*170)`, 0.06, "highpass=f=1800"],
  pop: [`0.7*sin(2*PI*(500*t+900*(1-exp(-t*30))/30))*exp(-t*22)`, 0.25],
  unlock: [`0.42*(sin(2*PI*880*t)+gt(t,0.07)*sin(2*PI*1320*(t-0.07)))*exp(-t*9)`, 0.45],
  whoosh: [`0.6*${N}*sin(PI*t/0.34)^2`, 0.34, "lowpass=f=1600,highpass=f=250"],
  swipe: [`0.5*${N}*sin(PI*t/0.5)^2`, 0.5, "bandpass=f=2600:w=1800"],
  thud: [`0.9*sin(2*PI*(50*t+120*(1-exp(-t*18))/18))*exp(-t*8)+0.25*${N}*exp(-t*90)`, 0.45, "lowpass=f=2500"],
  drop: [`0.45*sin(2*PI*(900*t-700*t*t))*exp(-t*5)`, 0.45],
  chime: [`0.3*(sin(2*PI*1318.5*t)+0.7*sin(2*PI*1975.5*t)+0.35*sin(2*PI*2637*t))*exp(-t*4.5)`, 1.0],
  flick: [`0.55*${N}*exp(-t*45)`, 0.14, "bandpass=f=3500:w=2500"],
  stamp: [`0.9*sin(2*PI*(70*t+90*(1-exp(-t*25))/25))*exp(-t*10)+0.5*${N}*exp(-t*60)`, 0.4, "lowpass=f=3500"],
  cascade: [`0.35*(${cascade})`, 0.8],
  riser: [`0.22*(sin(2*PI*(250*t+350*t*t))+0.5*${N})*t`, 1.0, "lowpass=f=3000"],
  type: [`0.55*(${typing})`, 0.5, "highpass=f=1500"],
  punch: [`0.5*${N}*sin(PI*t/0.26)^2`, 0.26, "lowpass=f=700"],
};
const GAIN = { tick: -14, click: -12, pop: -12, unlock: -12, whoosh: -20, swipe: -20, thud: -11, drop: -16, chime: -15, flick: -16, stamp: -10, cascade: -15, riser: -18, type: -14, punch: -20 };
// audible impact lead: most sounds peak at onset; whoosh/swipe/punch/riser peak mid-file -> start earlier so the peak lands on the visual
const LEAD = { whoosh: 0.17, swipe: 0.25, punch: 0.13, riser: 0 };
for (const [k, [e, d, f]] of Object.entries(SFX)) gen(k, e, d, f);
// music bed: the original track from music.py, copied in as the bed
ff(["-i", "assets/music.wav", "-ac", "2", "-ar", "48000", "assets/sfx/pad.wav"]);
// voice normalize to -16 LUFS-ish (linear gain from measurement)
const m = ffi(["-i", "assets/voice-raw.wav", "-af", "ebur128", "-f", "null", "-"]).stderr.match(/I:\s+(-?[\d.]+) LUFS/g).at(-1);
const vI = parseFloat(m.match(/-?[\d.]+/)[0]);
// build mix graph
const inputs = ["-i", "assets/voice-raw.wav", "-i", "assets/sfx/pad.wav"];
let g = `[0:a]volume=${(-16 - vI).toFixed(2)}dB,asplit=2[v][vsc];[1:a]volume=${BED_DB}dB[padr];[padr][vsc]sidechaincompress=threshold=0.03:ratio=4:attack=30:release=400[pad];`;
const labels = [];
EV.forEach((e, i) => {
  inputs.push("-i", `assets/sfx/${e.sfx}.wav`);
  const t = Math.max(0, e.time - (LEAD[e.sfx] ?? 0));
  g += `[${i + 2}:a]volume=${GAIN[e.sfx]}dB,adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[s${i}];`;
  labels.push(`[s${i}]`);
});
g += `${labels.join("")}amix=inputs=${labels.length}:normalize=0[sfx];[v][pad][sfx]amix=inputs=3:normalize=0,atrim=0:${DUR}[out]`;
writeFileSync("assets/mix-filter.txt", g);
ff([...inputs, graphFlag, "assets/mix-filter.txt", "-map", "[out]", "-ar", "48000", "-c:a", "pcm_f32le", "assets/mix-pre.wav"]);
{ // one gain value on the finished mix: no limiter, no dynamic loudness processing
  const st = ffi(["-i", "assets/mix-pre.wav", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr;
  const I = +st.match(/I:\s+(-?[\d.]+) LUFS/g).at(-1).match(/-?[\d.]+/)[0];
  const P = +((st.match(/Peak:\s+(-?[\d.]+) dBFS/g) || ["Peak: -1.5 dBFS"]).at(-1).match(/-?[\d.]+/)[0]);
  const G = Math.min(-16 - I, -1.5 - P);
  ff(["-i", "assets/mix-pre.wav", "-af", `volume=${G.toFixed(2)}dB`, "-c:a", "pcm_s16le", "assets/mix.wav"]);
}
// stems for review
writeFileSync("assets/stem-filter.txt", g.replace(/,atrim.*$/, "").replace("[v][pad][sfx]amix=inputs=3:normalize=0", "[pad]anull[padout];[sfx]anull[sfxout];[v]anull[vout]"));
ff([...inputs, graphFlag, "assets/stem-filter.txt", "-map", "[vout]", "-c:a", "pcm_s16le", "assets/stem-voice.wav", "-map", "[padout]", "-c:a", "pcm_s16le", "assets/stem-bed.wav", "-map", "[sfxout]", "-c:a", "pcm_s16le", "assets/stem-sfx.wav"]);
const meas = (f) => { const s = ffi(["-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr; return { I: +s.match(/I:\s+(-?[\d.]+) LUFS/g).at(-1).match(/-?[\d.]+/)[0], TP: (s.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/g) || []).at(-1) }; };
const out = { voiceRawI: vI, bedDb: BED_DB, mix: meas("assets/mix.wav"), voice: meas("assets/stem-voice.wav"), bed: meas("assets/stem-bed.wav"), sfx: meas("assets/stem-sfx.wav"), events: EV.length };
writeFileSync("assets/audio-report.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
