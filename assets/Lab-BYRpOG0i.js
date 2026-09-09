import{r as e}from"./rolldown-runtime-hePW80VL.js";import{$ as t,A as n,B as r,C as i,D as a,E as o,G as s,H as c,J as l,K as u,L as d,M as f,N as p,O as m,P as h,Q as g,R as ee,S as te,U as ne,V as re,W as ie,X as _,Y as ae,Z as oe,_ as se,at as v,b as ce,et as le,j as ue,k as de,n as fe,nt as y,q as pe,r as me,t as he,tt as ge,w as _e,x as ve,y as ye,z as be}from"./three-CRWP0EPt.js";import{a as b,o as xe}from"./vendor-rftcwQKw.js";import{t as x}from"./arrow-left-_it5yp05.js";import{n as S,r as C,t as w}from"./index-BtaIxlNj.js";var Se=C(`book-open`,[[`path`,{d:`M12 5v16`,key:`1f6ucr`}],[`path`,{d:`M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z`,key:`1fyvmf`}]]),T=C(`calendar`,[[`path`,{d:`M8 2v3`,key:`1ioesn`}],[`path`,{d:`M16 2v3`,key:`otl347`}],[`rect`,{x:`3`,y:`3`,width:`18`,height:`18`,rx:`2`,key:`h1oib`}],[`path`,{d:`M3 9h18`,key:`1pudct`}]]),E=C(`check`,[[`path`,{d:`M20 6 9 17l-5-5`,key:`1gmf2c`}]]),D=C(`chevron-left`,[[`path`,{d:`m15 18-6-6 6-6`,key:`1wnfg3`}]]),Ce=C(`chevron-right`,[[`path`,{d:`m9 18 6-6-6-6`,key:`mthhwq`}]]),we=C(`copy`,[[`rect`,{width:`14`,height:`14`,x:`8`,y:`8`,rx:`2`,ry:`2`,key:`17jyea`}],[`path`,{d:`M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`,key:`zix9uf`}]]),Te=C(`external-link`,[[`path`,{d:`M15 3h6v6`,key:`1q9fwt`}],[`path`,{d:`M10 14 21 3`,key:`gplh6r`}],[`path`,{d:`M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6`,key:`a6xqqp`}]]),O=C(`file-text`,[[`path`,{d:`M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z`,key:`1oefj6`}],[`path`,{d:`M14 2v5a1 1 0 0 0 1 1h5`,key:`wfsgrz`}],[`path`,{d:`M10 9H8`,key:`b1mrlr`}],[`path`,{d:`M16 13H8`,key:`t4e002`}],[`path`,{d:`M16 17H8`,key:`z1uh3a`}]]),Ee=C(`search`,[[`path`,{d:`m21 21-4.34-4.34`,key:`14j7rj`}],[`circle`,{cx:`11`,cy:`11`,r:`8`,key:`4ej97u`}]]),De=C(`user`,[[`path`,{d:`M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2`,key:`975kel`}],[`circle`,{cx:`12`,cy:`7`,r:`4`,key:`17ys0d`}]]),k=`---\r
title: "Coaxial Aerial Vehicle"\r
date: "Mar 2021"\r
role: "Engineer"\r
description: "A fully autonomous coaxial VTOL that climbs to 100-200m, profiles the air with a four-sensor suite, and flies itself home."\r
tags: ["Showcase", "Aerospace", "Control Systems", "Embedded"]\r
---\r
\r
A small VTOL that climbs to 100 to 200 metres, hovers while it logs a handful of data readings, then flies itself back and lands.\r
\r
![AeroDTA on deployment, ground-station link established](img1.webp)\r
\r
---\r
\r
## Why two motors instead of four\r
\r
I used two brushless motors on a single vertical axis, one on top and one on the bottom, spinning in opposite directions.\r
\r
The torque each rotor puts on the frame works out to\r
\r
$$\r
\\boldsymbol{\\tau}_{\\text{airframe}} = \\boldsymbol{\\tau}_{\\text{top}} + \\boldsymbol{\\tau}_{\\text{bottom}} = k_\\tau\\left(\\omega_{\\text{top}}^2 - \\omega_{\\text{bottom}}^2\\right)\\hat{z}\r
$$\r
\r
where $k_\\tau$ is the motor's torque coefficient and $\\omega$ is each rotor's speed. Because the two rotors spin opposite ways, that difference naturally trends toward zero. Yaw becomes a matter of speeding up one motor and slowing the other, instead of needing a separate control surface just for that. It also keeps the frame narrow.\r
\r
Fine trim and yaw correction come from four small PWM-actuated fins sitting in the airflow below the bottom rotor.\r
\r
---\r
\r
## Attitude and altitude control\r
\r
Roll, pitch, yaw, and climb rate each get their own PID loop running at 400 Hz. Roll and pitch drive the fins, yaw drives the differential motor speed, and climb rate drives common-mode motor speed (both motors moving together). In continuous form, one axis looks like:\r
\r
$$\r
u(t) = K_p\\, e(t) + K_i \\int_0^t e(\\sigma)\\, d\\sigma + K_d \\frac{de(t)}{dt}\r
$$\r
\r
and on the actual flight controller it's discretised into something like this:\r
\r
\`\`\`c\r
// Single-axis PID, called at 400 Hz per axis\r
typedef struct {\r
    float kp, ki, kd;\r
    float integral;\r
    float prev_error;\r
    float integral_limit;\r
} pid_axis_t;\r
\r
float pid_update(pid_axis_t *ax, float setpoint, float measured, float dt) {\r
    float error = setpoint - measured;\r
\r
    ax->integral += error * dt;\r
    ax->integral = clampf(ax->integral, -ax->integral_limit, ax->integral_limit);\r
\r
    float derivative = (error - ax->prev_error) / dt;\r
    ax->prev_error = error;\r
\r
    return ax->kp * error + ax->ki * ax->integral + ax->kd * derivative;\r
}\r
\`\`\`\r
\r
Altitude uses two loops instead of one. The outer loop reads barometer and GPS altitude (blended with a complementary filter) and outputs a target climb rate. The inner loop tracks that climb rate by adjusting common-mode motor speed. I split it this way because a single loop mapping altitude error straight to thrust tends to either overshoot or crawl near the target. Splitting it lets the inner loop react fast while the outer loop just decides where it should be heading.\r
\r
---\r
\r
## Communication\r
\r
A radio transmitter streams telemetry continuously to a ground station rather than waiting on requests, so a dropped packet just costs one sample instead of stalling the link. The base station app plots the profile live as it comes in and logs everything to a file for later.\r
\r
---\r
\r
## Airframe\r
\r
The frame uses a cross-braced lattice of 3D-printed composite parts, chosen for stiffness rather than pure minimum weight, since a flexing frame shows up as noise in the IMU, especially noise that lines up with rotor RPM. Four splayed landing legs give it a wide, stable base for uneven ground.\r
\r
---\r
\r
Built for atmospheric research, environmental monitoring, and testing out stabilization ideas in the field, something I plan to redo in the future.\r
`,A=`---\r
title: "Neurex AI"\r
date: "Jan 2023"\r
role: "Engineer"\r
description: "A five-stage math pipeline that reads price as a noisy signal instead of a prediction problem."\r
tags: ["Showcase", "Signal Processing", "Machine Learning", "Finance"]\r
demourl: "https://tradescove.com"\r
---\r
\r
There's no LLM anywhere in Neurex. It's a deterministic pipeline: reconstruct the signal, derive a few independent readings of it, compare against learned structure, filter, then let a small reinforcement-learning model decide whether to reject the setup. Most attempts at this ask a model to predict price, which is close to unlearnable.\r
\r
A price chart is a noisy signal, and cleaning up noisy signals is a solved problem in other fields. The human behavior that creates the noise (panic, hesitation, chasing a move) leaves structure behind, and structure is learnable even when the underlying event isn't predictable.\r
\r
---\r
\r
## The pipeline\r
\r
\`\`\`\r
raw price ──▶ reconstruct ──▶ derive ──▶ compare ──▶ filter ──▶ decide\r
              (zero-lag)     (indicator   (custom     (engineering  (RL: reject\r
                              series)      KNN)        + trading     or pass)\r
                                                        filters)\r
\`\`\`\r
\r
Five stages, each narrowing the candidate set. Stages 2 through 4 define a candidate zone by overlap; stage 5 is the only one that gets a vote on whether a signal actually fires.\r
\r
---\r
\r
## Why the distance metric matters\r
\r
Standard distance metrics impose a fixed geometry on the comparison. Euclidean distance treats every direction the same, which is fine for a static space but wrong for one where volatility itself is shifting underneath you.\r
\r
In general form, a weighted distance between two points $x, y \\in \\mathbb{R}^n$ is\r
\r
$$\r
d(x, y) = \\sqrt{\\sum_{i=1}^{n} w_i(t) \\, (x_i - y_i)^2}\r
$$\r
\r
where the weights $w_i(t)$ are fixed in a standard KNN and time-varying here, adapting to the current volatility regime rather than to a static training-time snapshot. The actual weighting function is where the real work is, and that part isn't public.\r
\r
\`\`\`python\r
# illustrative only, not the real weighting function\r
def adaptive_distance(x, y, regime_weights):\r
    return sum(w * (xi - yi) ** 2 for xi, yi, w in zip(x, y, regime_weights)) ** 0.5\r
\`\`\`\r
\r
---\r
\r
## Filter stack\r
\r
Every stage gets a filter tuned to what it's actually looking at. Some of these come from trading (multi-EMA and similar), and some are borrowed from signal-processing disciplines that deal with much higher-stakes noise, aerospace telemetry and rocketry guidance being two of them. None of that is exotic on its own; the value is in how the stages are layered and handed off to each other.\r
\r
:::note type=info title="Why borrow filters from aerospace"\r
A rocket's guidance system can't afford to smooth a signal at the cost of delay, since delay is the one thing you can't get back mid-flight. That constraint (clean the signal without lagging behind it) turns out to map onto trading almost exactly, which is why some of the filter math is closer to a telemetry stack than to anything in a typical trading toolkit.\r
:::\r
\r
---\r
\r
## Testing\r
\r
Two-phase validation: a historical backtest, then continuous live forward-testing over an extended period on selected pairs, with no post-hoc adjustment to signals once they've fired.\r
\r
| Metric      | Backtest  | Live forward test     |\r
| ----------- | --------- | --------------------- |\r
| Win rate    | >90%      | 87.98%                |\r
| Sample size | 4000+     | 1000+                 |\r
| Duration    | 84 months | 36 months, continuous |\r
\r
:::note type=yellow title=""\r
Figures shown are internal, representative test results for illustrative purposes only. They reflect specific instruments, time periods and configurations, and are not a forecast or guarantee of future results. Past performance does not indicate future performance. Nothing on this page is financial advice, an offer, or a solicitation to trade. Trading carries risk of loss.\r
:::\r
`,Oe=`---\r
title: "Annotated Surrogate Retrieval for Polish Statutory Law"\r
date: "Sep 2026"\r
role: "Author"\r
description: "Three retrieval designs for Polish statutory law built on document surrogates, evaluated against fourteen baselines and four controls on 300 Polish bar exam questions over 82,508 articles."\r
tags: ["Research", "Information Retrieval", "NLP", "Legal Tech"]\r
githuburl: "https://github.com/OryCore/Research/tree/master/Annotated%20Surrogate%20Retrieval%20for%20Polish%20Statutory%20Law"\r
paperurl: https://arxiv.org/abs/2608.30929\r
researchgateurl: https://www.researchgate.net/publication/413832839\r
doi: 10.48550/arXiv.2608.30929\r
---\r
\r
Given a legal question in Polish, the task is to find the one statutory article that governs it, out of 82,508 candidates. Not a set of plausible articles, the article, since the downstream generator is graded on what it puts at rank one.\r
\r
The core idea is document surrogates: instead of only matching a question against the raw statutory text, I attach language-model-generated annotations to each article at index time, a summary, a theme, a concept set, and a handful of hypothetical questions the article would answer, and retrieve against those alongside the text itself.\r
\r
---\r
\r
## Three designs, one frontier\r
\r
I built three systems that sit at different points on the cost-quality tradeoff:\r
\r
- **ASCR** matches against surrogate fields in two cascaded stages (act-level, then article-level), then reranks the top candidates with one listwise model call.\r
- **ASCR-H** adds a dense retrieval branch fused into that cascade before reranking, which runs concurrently with the other calls so it costs no extra latency.\r
- **DTF** drops both language-model stages entirely. Three retrievers (dense, lexical over the text, lexical over the surrogate questions) get fused with weighted reciprocal rank fusion, then re-scored with a deterministic prior that exploits the act named in the question. No model call before generation.\r
\r
Rank fusion across the three retrievers in DTF uses weighted reciprocal rank fusion:\r
\r
$$\r
s_{\\text{RRF}}(a) = \\sum_i \\frac{w_i}{k_0 + \\text{rank}_{R_i}(a)}, \\qquad k_0 = 20\r
$$\r
\r
and lexical matching throughout the paper is BM25:\r
\r
$$\r
\\text{BM25}(q, x) = \\sum_{t \\in q} \\text{idf}(t)\\,\\frac{f_{t,x}(k_1+1)}{f_{t,x} + k_1\\left(1 - b + b\\frac{|x|}{\\overline{|x|}}\\right)}\r
$$\r
\r
with the standard defaults, $k_1 = 1.2$, $b = 0.75$.\r
\r
---\r
\r
## What actually happened\r
\r
Evaluated against fourteen baselines and four controls (oracle, closed-book, random, and a "correct act but random article" control) on 300 questions drawn from the 2024 and 2025 Polish bar exam, over paired McNemar tests:\r
\r
| Configuration              | Hit@1  | Hit@20 | Citation acc. | Median latency |\r
| -------------------------- | ------ | ------ | ------------- | -------------- |\r
| ASCR-H                     | 72.3%  | 84.5%  | 67.3%         | 7.8 s          |\r
| DTF                        | 51.9%  | 86.0%  | 70.3%         | 0.82 s         |\r
| BM25 (raw)                 | 61.7%  | 79.2%  | 66.0%         | 0.73 s         |\r
| Dense retrieval            | 52.3%  | 72.7%  | 61.7%         | 0.73 s         |\r
| Oracle (ceiling)           | 100.0% | 100.0% | 70.3%         | —              |\r
| Closed-book (no retrieval) | 0.0%   | 0.0%   | 47.0%         | 0.67 s         |\r
\r
ASCR-H wins at rank one by a wide margin, significant against every non-oracle configuration except one of its own ablations. That lead disappears by a cutoff of ten, and DTF overtakes on point estimate from twenty onward while running at about a ninth of the latency and less than half the cost.\r
\r
:::note type=info title="Reranking is the whole story at rank one"\r
Removing the reranking stage alone drops Hit@1 from 72.3% to 44.7%, a 27.6-point swing, nearly three times the next largest effect from any other component I tested. Everything else (query analysis, dense fusion, the concept-matching term) matters, but reranking is what actually orders the head of the list.\r
:::\r
\r
:::note type=warning title="Rank-one gains don't reach the generated answer"\r
This was the most surprising result. ASCR-H leads every ranking metric, but its citation accuracy (67.3%) is statistically indistinguishable from plain BM25 (66.0%) and from DTF (70.3%, which actually scores higher and matches the oracle ceiling). What predicts whether the generator cites the right article correctly isn't where it sits in the list, it's whether it's in the context window at all.\r
:::\r
\r
:::note type=purple title="Near-miss context is worse than no context"\r
A control that supplies the correct act but a random article within it scores 0.4% Hit@1 and 37.7% citation accuracy, nine points below a control that gets no context at all. A plausible but wrong provision actively displaces correct answers the model already had from its own training. Retrieval that's close but wrong isn't a lesser version of helpful, it's actively harmful.\r
:::\r
\r
## Three things that didn't work\r
\r
Lemmatisation, pseudo-relevance feedback, and query rewriting all failed to improve retrieval on this task, each for a different reason: exam questions already quote statutory language closely, so there's little surface-form mismatch to fix; feedback expansion widens the candidate pool but disorders the head, which is the only part that's scored; and rewriting adds a full model call and roughly a second of latency for no measurable gain.\r
\r
---\r
\r
## Reading it\r
\r
The benchmark, per-question outputs, and paired significance tests are public on GitHub. The paper itself is on arXiv.\r
\r
- **Paper (arXiv):** [arxiv.org/abs/2608.30929](https://arxiv.org/abs/2608.30929)\r
- **ResearchGate:** [researchgate.net/publication/413832839](https://www.researchgate.net/publication/413832839_Annotated_Surrogate_Retrieval_for_Polish_Statutory_Law)\r
- **Code, benchmark & results:** [github.com/OryCore/Research](https://github.com/OryCore/Research/tree/master/Annotated%20Surrogate%20Retrieval%20for%20Polish%20Statutory%20Law)\r
- **DOI:** [10.48550/arXiv.2608.30929](https://doi.org/10.48550/arXiv.2608.30929)\r
`,ke=`/Portfolio/assets/img1-5Xeqanj6.webp`,Ae=`/Portfolio/assets/video1-C15d8XMo.webm`,j=`/Portfolio/assets/badge-DbjJKAWB.webp`,je=`/Portfolio/assets/img1-DbjoxUXO.webp`,M=e(v(),1),N=y(),Me={src:``,ascii:!0,cellSize:10,cellAspect:.6,charset:Array.from({length:95},(e,t)=>String.fromCharCode(32+t)).join(``),colored:!0,color:`#ffffff`,contrast:1.5,edgeContrast:3,exposure:1,invert:!1,invertColor:!1,background:``,highlight:`#066aff`,environmentIntensity:1,roughness:-1,scale:3,xOffset:0,yOffset:0,floatIntensity:2,rotationIntensity:1,floatSpeed:2,orbit:!0,zoom:!1,autoRotate:!1,autoRotateSpeed:2,fov:65,cameraDistance:4.2,dracoDecoderPath:`https://www.gstatic.com/draco/versioned/decoders/1.5.7/`,onLoad:null,onError:null},Ne=`
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`,Pe=`
vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}
`,Fe=`
precision highp float;
out vec4 outColor;
uniform sampler2D tScene;
uniform sampler2D tShapes;
uniform vec2 uResolution;
uniform vec2 uCellPx;
uniform int uGlyphCount;
uniform float uContrast;
uniform float uEdgeContrast;
uniform float uExposure;
uniform float uInvert;
${Pe}
const vec2 INNER[6] = vec2[6](
  vec2(0.28, 0.26), vec2(0.72, 0.14),
  vec2(0.28, 0.56), vec2(0.72, 0.44),
  vec2(0.28, 0.86), vec2(0.72, 0.74)
);
const vec2 OUTER[10] = vec2[10](
  vec2(0.28, -0.2), vec2(0.72, -0.2),
  vec2(-0.22, 0.25), vec2(1.22, 0.25),
  vec2(-0.22, 0.5), vec2(1.22, 0.5),
  vec2(-0.22, 0.75), vec2(1.22, 0.75),
  vec2(0.28, 1.2), vec2(0.72, 1.2)
);
const vec2 RING[6] = vec2[6](
  vec2(1.0, 0.0), vec2(0.5, 0.8660254), vec2(-0.5, 0.8660254),
  vec2(-1.0, 0.0), vec2(-0.5, -0.8660254), vec2(0.5, -0.8660254)
);
vec2 cellBase;
vec4 fetchTap(vec2 p) {
  vec2 uv = p / uResolution;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture(tScene, uv);
}
vec4 sampleCircle(vec2 c) {
  vec2 middle = cellBase + vec2(c.x, 1.0 - c.y) * uCellPx;
  float r = uCellPx.y * 0.161;
  vec4 acc = fetchTap(middle);
  for (int k = 0; k < 6; k++) acc += fetchTap(middle + RING[k] * r);
  return acc / 7.0;
}
float circleLum(vec4 acc) {
  vec3 straight = toSrgb(acc.rgb / max(acc.a, 1e-4));
  float level = clamp(dot(straight, vec3(0.2126, 0.7152, 0.0722)) * uExposure, 0.0, 1.0);
  level = mix(level, 1.0 - level, uInvert);
  return level * acc.a;
}
float dirContrast(float value, float ext) {
  float peak = max(value, ext);
  if (peak < 1e-4) return value;
  return pow(value / peak, uEdgeContrast) * peak;
}
void main() {
  cellBase = floor(gl_FragCoord.xy) * uCellPx;
  float v[6];
  vec3 colAcc = vec3(0.0);
  float alphaAcc = 0.0;
  for (int i = 0; i < 6; i++) {
    vec4 acc = sampleCircle(INNER[i]);
    v[i] = circleLum(acc);
    colAcc += acc.rgb;
    alphaAcc += acc.a;
  }
  float e[10];
  for (int i = 0; i < 10; i++) e[i] = circleLum(sampleCircle(OUTER[i]));
  v[0] = dirContrast(v[0], max(max(e[0], e[1]), max(e[2], e[4])));
  v[1] = dirContrast(v[1], max(max(e[0], e[1]), max(e[3], e[5])));
  v[2] = dirContrast(v[2], max(e[2], max(e[4], e[6])));
  v[3] = dirContrast(v[3], max(e[3], max(e[5], e[7])));
  v[4] = dirContrast(v[4], max(max(e[4], e[6]), max(e[8], e[9])));
  v[5] = dirContrast(v[5], max(max(e[5], e[7]), max(e[8], e[9])));
  float peak = max(max(max(v[0], v[1]), max(v[2], v[3])), max(v[4], v[5]));
  if (peak > 1e-4) {
    for (int i = 0; i < 6; i++) v[i] = pow(v[i] / peak, uContrast) * peak;
  }
  int best = 0;
  float bestD = 1e9;
  for (int g = 0; g < uGlyphCount; g++) {
    float d = 0.0;
    for (int i = 0; i < 6; i++) {
      float diff = v[i] - texelFetch(tShapes, ivec2(i, g), 0).r;
      d += diff * diff;
    }
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  vec3 cellColor = toSrgb(colAcc / max(alphaAcc, 1e-4));
  outColor = vec4(cellColor, float(best) / 255.0);
}`,Ie=`
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D tScene;
uniform sampler2D tCells;
uniform sampler2D tAtlas;
uniform vec2 uResolution;
uniform vec2 uCellPx;
uniform vec2 uGrid;
uniform vec2 uAtlasGrid;
uniform vec2 uAtlasPad;
uniform vec2 uAtlasInner;
uniform float uAscii;
uniform float uColored;
uniform float uInvertColor;
uniform vec3 uColor;
uniform vec3 uBackground;
uniform float uHasBg;
${Pe}
// Shifts lightness to its complement and carries the chroma offset along, so
// hue survives. A plain 1.0 - c swaps hue for its opposite, and scaling by a
// luminance ratio blows up on near-black pixels.
vec3 invertTone(vec3 c) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return clamp(vec3(1.0 - l) + (c - l), 0.0, 1.0);
}
void main() {
  if (uAscii < 0.5) {
    vec4 raw = texture(tScene, vUv);
    vec3 rawColor = toSrgb(raw.rgb);
    if (uInvertColor > 0.5) {
      // Unpremultiply first, or partly-covered edge pixels invert wrong.
      rawColor = invertTone(toSrgb(raw.rgb / max(raw.a, 1e-4))) * raw.a;
    }
    if (uHasBg > 0.5) {
      outColor = vec4(uBackground * (1.0 - raw.a) + rawColor, 1.0);
    } else {
      outColor = vec4(rawColor * raw.a, raw.a);
    }
    return;
  }
  vec2 fragCoord = vUv * uResolution;
  vec2 cellPos = fragCoord / uCellPx;
  vec2 cell = clamp(floor(cellPos), vec2(0.0), uGrid - 1.0);
  vec4 info = texelFetch(tCells, ivec2(cell), 0);
  float glyph = floor(info.a * 255.0 + 0.5);
  vec2 local = clamp(cellPos - cell, 0.0, 1.0);
  float gx = mod(glyph, uAtlasGrid.x);
  float gy = floor(glyph / uAtlasGrid.x);
  vec2 atlasUv = vec2(
    (gx + uAtlasPad.x + local.x * uAtlasInner.x) / uAtlasGrid.x,
    (uAtlasGrid.y - gy - 1.0 + uAtlasPad.y + local.y * uAtlasInner.y) /
      uAtlasGrid.y
  );
  vec2 atlasStep = uAtlasInner / uAtlasGrid;
  float mask = textureGrad(
    tAtlas,
    atlasUv,
    dFdx(cellPos) * atlasStep,
    dFdy(cellPos) * atlasStep
  ).a;
  vec3 sceneColor = mix(info.rgb, invertTone(info.rgb), uInvertColor);
  vec3 glyphColor = mix(uColor, sceneColor, uColored);
  if (uHasBg > 0.5) {
    outColor = vec4(mix(uBackground, glyphColor, mask), 1.0);
  } else {
    outColor = vec4(glyphColor * mask, mask);
  }
}`,Le=[{position:[-10.906,-1,1.846],rotation:[0,-.195,0],scale:[2.328,7.905,4.651]},{position:[-5.607,-.754,-.758],rotation:[0,.994,0],scale:[1.97,1.534,3.955]},{position:[6.167,-.16,7.803],rotation:[0,.561,0],scale:[3.927,6.285,3.687]},{position:[-2.017,.018,6.124],rotation:[0,.333,0],scale:[2.002,4.566,2.064]},{position:[2.291,-.756,-2.621],rotation:[0,-.286,0],scale:[1.546,1.552,1.496]},{position:[-2.193,-.369,-5.547],rotation:[0,.516,0],scale:[3.875,3.487,2.986]}],Re=[{kind:`ring`,intensity:15,position:[2,3,-2],scale:[10,10,10],lookAtCenter:!0},{kind:`box`,intensity:80,position:[-14,10,8],scale:[.1,2.5,2.5]},{kind:`box`,intensity:80,position:[-14,14,-4],scale:[.1,2.5,2.5],withLight:!0},{kind:`box`,intensity:23,position:[14,12,0],scale:[.1,5,5],withLight:!0},{kind:`box`,intensity:16,position:[0,9,14],scale:[5,5,.1],withLight:!0},{kind:`box`,intensity:80,position:[7,8,-14],scale:[2.5,2.5,.1],withLight:!0},{kind:`box`,intensity:80,position:[-7,16,-14],scale:[2.5,2.5,.1],withLight:!0},{kind:`box`,intensity:1,position:[0,20,0],scale:[.1,.1,.1],withLight:!0},{kind:`box`,intensity:20,position:[0,15,0],scale:[10,1,10],withLight:!0}],ze=new le(0,-1,4).normalize(),Be=.3,P=2048,F=512,Ve=127,He=1,I=6,L=64,Ue=.08,R=.006,We=64,z=8,Ge=255,Ke=[[.28,.26],[.72,.14],[.28,.56],[.72,.44],[.28,.86],[.72,.74]];function qe(e){return Math.min(Math.max(e||.6,.35),1.25)}function Je(e){let t=new Set([` `]),n=[` `];for(let r of e){if(n.length>=Ge)break;r===`
`||r===`\r`||r===`	`||t.has(r)||(t.add(r),n.push(r))}return n}function Ye(e,t,n,r,i){let a=new Float32Array(i*6),o=r*.26,s=n+16,c=r+16;for(let l=0;l<i;l++){let i=l%t*s+z,u=Math.floor(l/t)*c+z;for(let t=0;t<6;t++){let s=Ke[t][0]*n,c=Ke[t][1]*r,d=0,f=0;for(let t=Math.floor(c-o);t<=Math.ceil(c+o);t++)for(let a=Math.floor(s-o);a<=Math.ceil(s+o);a++){let l=a+.5-s,p=t+.5-c;l*l+p*p>o*o||(f+=1,!(a<-8||t<-8||a>=n+z||t>=r+z)&&(d+=e.data[((u+t)*e.width+i+a)*4+3]))}a[l*6+t]=f?d/(f*255):0}}for(let e=0;e<6;e++){let t=0;for(let n=0;n<i;n++)t=Math.max(t,a[n*6+e]);if(t>0)for(let n=0;n<i;n++)a[n*6+e]/=t}return a}function Xe(e){if(e.length<4)return null;let t=(t,n)=>{for(let r=0;r<n.length;r++)if(e[t+r]!==n.charCodeAt(r))return!1;return!0};if(t(0,`glTF`))return`glb`;if(e[0]===137&&t(1,`PNG`)||e[0]===255&&e[1]===216||t(0,`RIFF`)&&t(8,`WEBP`)||t(0,`GIF8`))return`bitmap`;let n=``;try{n=new TextDecoder().decode(e.subarray(0,2048)).replace(/^\uFEFF/,``).trimStart()}catch{return null}return n.startsWith(`{`)?`gltf`:n.startsWith(`<`)&&n.includes(`<svg`)?`svg`:null}function Ze(e,t){let n=document.createElement(`canvas`);return n.width=Math.max(1,Math.round(e)),n.height=Math.max(1,Math.round(t)),n}function B(e,t,n){let r=Ze(t,n),i=r.getContext(`2d`);if(!i)throw Error(`2d context unavailable`);return i.drawImage(e,0,0,r.width,r.height),r}function Qe(e){return new Promise((t,n)=>{let r=URL.createObjectURL(e),i=new Image;i.onload=()=>{URL.revokeObjectURL(r),t(i)},i.onerror=()=>{URL.revokeObjectURL(r),n(Error(`Could not decode the image`))},i.src=r})}async function $e(e){if(typeof createImageBitmap!=`function`)return null;try{let t=await createImageBitmap(e),n=Math.max(t.width,t.height,1),r=Math.min(1,P/n),i=B(t,t.width*r,t.height*r);return t.close(),i}catch{return null}}async function et(e,t){let n=t===`svg`;if(!n){let t=await $e(e);if(t)return t}let r=await Qe(e),i=r.naturalWidth||P,a=r.naturalHeight||P,o=Math.max(i,a,1),s=n?P/o:Math.min(1,P/o);return B(r,i*s,a*s)}function tt(e,t,n){let r=[];for(let i=0;i<n-1;i++)for(let n=0;n<t-1;n++){let a=i*t+n,o=e[a]|e[a+1]<<1|e[a+t+1]<<2|e[a+t]<<3;if(o===0||o===15)continue;let s=n+.5,c=i+.5;switch(o){case 1:case 14:r.push(n,c,s,i);break;case 2:case 13:r.push(s,i,n+1,c);break;case 3:case 12:r.push(n,c,n+1,c);break;case 4:case 11:r.push(n+1,c,s,i+1);break;case 6:case 9:r.push(s,i,s,i+1);break;case 7:case 8:r.push(n,c,s,i+1);break;case 5:r.push(n,c,s,i,n+1,c,s,i+1);break;default:r.push(s,i,n+1,c,n,c,s,i+1)}}let i=r.length/4,a=t*2+1,o=new Map,s=e=>r[e*2+1]*2*a+r[e*2]*2;for(let e=0;e<i;e++)for(let t of[e*2,e*2+1]){let n=s(t),r=o.get(n);r?r.push(e):o.set(n,[e])}let c=new Uint8Array(i),l=[];for(let e=0;e<i;e++){if(c[e])continue;let t=[],n=e,i=r[e*4],s=r[e*4+1];for(;n>=0&&!c[n];){c[n]=1;let e=n*4,l=r[e]===i&&r[e+1]===s;i=l?r[e+2]:r[e],s=l?r[e+3]:r[e+1],t.push(i,s);let u=o.get(s*2*a+i*2),d=-1;if(u){for(let e of u)if(!c[e]){d=e;break}}n=d}t.length>=8&&l.push(t)}return l}function nt(e,t){let n=e.length/2;if(n<4)return e;let r=new Uint8Array(n);r[0]=1,r[n-1]=1;let i=[0,n-1],a=t*t;for(;i.length;){let t=i.pop(),n=i.pop();if(t-n<2)continue;let o=e[n*2],s=e[n*2+1],c=e[t*2]-o,l=e[t*2+1]-s,u=c*c+l*l,d=-1,f=a;for(let r=n+1;r<t;r++){let t=e[r*2]-o,n=e[r*2+1]-s,i=u>0?(t*c+n*l)/u:0,a=i<0?0:i>1?1:i,p=t-c*a,m=n-l*a,h=p*p+m*m;h>f&&(d=r,f=h)}d<0||(r[d]=1,i.push(n,d,d,t))}let o=[];for(let t=0;t<n;t++)r[t]&&o.push(e[t*2],e[t*2+1]);return o}function rt(e){let t=0;for(let n=0,r=e.length-2;n<e.length;r=n,n+=2)t+=(e[r]-e[n])*(e[r+1]+e[n+1]);return Math.abs(t)/2}function it(e,t,n){let r=!1;for(let i=0,a=e.length-2;i<e.length;a=i,i+=2){let o=e[i+1],s=e[a+1];if(o>n==s>n)continue;let c=(n-o)/(s-o);t<e[i]+c*(e[a]-e[i])&&(r=!r)}return r}function at(e,n,r){let i=()=>new _([new t(0,0),new t(n,0),new t(n,r),new t(0,r)]),a=Math.min(1,F/Math.max(e.width,e.height,1)),o=a<1?B(e,e.width*a,e.height*a):e,s=o.getContext(`2d`,{willReadFrequently:!0});if(!s)return[i()];let l=o.width,u=o.height,d=s.getImageData(0,0,l,u).data,f=l+2,p=u+2,m=new Uint8Array(f*p),h=0;for(let e=0;e<u;e++)for(let t=0;t<l;t++){let n=+(d[(e*l+t)*4+3]>=Ve);m[(e+1)*f+t+1]=n,h+=n}if(h>=l*u*.995)return[i()];let g=tt(m,f,p).map(e=>nt(e,He)).filter(e=>e.length>=6&&rt(e)>=I).map(e=>({points:e,area:rt(e),depth:0})).sort((e,t)=>t.area-e.area).slice(0,L);if(!g.length)return[i()];for(let e of g)for(let t of g)t!==e&&t.area>e.area&&it(t.points,e.points[0],e.points[1])&&(e.depth+=1);let ee=e=>{let i=[];for(let a=0;a<e.length;a+=2)i.push(new t((e[a]-.5)/l*n,(1-(e[a+1]-.5)/u)*r));return i},te=new Map;for(let e of g)e.depth%2==0&&te.set(e,new _(ee(e.points)));for(let e of g){if(e.depth%2==0)continue;let t=null;for(let n of g)n.depth===e.depth-1&&it(n.points,e.points[0],e.points[1])&&(!t||n.area<t.area)&&(t=n);let n=t?te.get(t):void 0;n&&n.holes.push(new c(ee(e.points)))}let ne=[...te.values()];return ne.length?ne:[i()]}function ot(e,t){let n=Math.max(e.width,e.height,1),r=e.width/n,i=e.height/n,a=new de(at(e,r,i),{depth:Ue,bevelEnabled:!0,bevelThickness:R,bevelSize:R,bevelOffset:0,bevelSegments:2,steps:1,curveSegments:1}),o=a.getAttribute(`position`),s=new Float32Array(o.count*2);for(let e=0;e<o.count;e++)s[e*2]=o.getX(e)/r,s[e*2+1]=o.getY(e)/i;a.setAttribute(`uv`,new te(s,2));let c=new _e(e);c.colorSpace=pe,c.anisotropy=t;let l=new be({map:c,roughness:.6,metalness:0});return new d(a,l)}function st(e){e.traverse(e=>{let t=e;t.geometry&&t.geometry.dispose();let n=Array.isArray(t.material)?t.material:[t.material];for(let e of n)if(e){for(let t of Object.values(e))t instanceof g&&t.dispose();e.dispose()}})}function ct(e,c={}){let{canvas:g}=e,_={...Me,...c},v;try{v=new ye({canvas:g,antialias:!1,alpha:!0,powerPreference:`high-performance`})}catch{return null}v.toneMapping=4,v.setClearColor(0,0);let de=new l,y=new ne(_.fov,1,.1,200);y.position.copy(ze).multiplyScalar(_.cameraDistance);let b=new f;b.position.y=Be;let xe=new f;b.add(xe),de.add(b);let x=new me(y,g);x.enableDamping=!0,x.enablePan=!1;let S=new ge(1,1,{samples:4});S.texture.colorSpace=pe;let C=new t(1,1),w=new t(6,10),Se=new t(1,1),T=new ge(1,1,{depthBuffer:!1,stencilBuffer:!1,minFilter:r,magFilter:r}),E=new ae({glslVersion:ue,vertexShader:Ne,fragmentShader:Ie,uniforms:{tScene:{value:S.texture},tCells:{value:T.texture},tAtlas:{value:null},uResolution:{value:C},uCellPx:{value:w},uGrid:{value:Se},uAtlasGrid:{value:new t(1,1)},uAtlasPad:{value:new t(0,0)},uAtlasInner:{value:new t(1,1)},uAscii:{value:1},uColored:{value:1},uInvertColor:{value:0},uColor:{value:new a(1,1,1)},uBackground:{value:new a(0,0,0)},uHasBg:{value:0}},depthTest:!1,depthWrite:!1,blending:0}),D=new i;D.setAttribute(`position`,new te(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3));let Ce=new d(D,E);Ce.frustumCulled=!1;let we=new l;we.add(Ce);let Te=new re(-1,1,1,-1,0,1),O=new ae({glslVersion:ue,vertexShader:Ne,fragmentShader:Fe,uniforms:{tScene:{value:S.texture},tShapes:{value:null},uResolution:{value:C},uCellPx:{value:w},uGlyphCount:{value:1},uContrast:{value:1.5},uEdgeContrast:{value:3},uExposure:{value:1},uInvert:{value:0}},depthTest:!1,depthWrite:!1,blending:0}),Ee=new d(D,O);Ee.frustumCulled=!1;let De=new l;De.add(Ee);let k=null,A=null,Oe=null,ke=0,Ae=new se(v),j=null,je=null,M=null,N=!0;function Pe(){j=new l;let e=new f;e.position.set(0,-.5,0),j.add(e);for(let[t,n]of[[-15,15],[15,15],[15,-15],[-15,-15]]){let r=new oe(16777215,2,0,.2,1,0);r.position.set(t,20,n),e.add(r,r.target)}let t=new ie(16777215,100,28,2);t.position.set(.5,14,.5),e.add(t);let n=new ve,r=new d(n,new be({color:`gray`,side:1}));r.position.set(0,13.2,0),r.scale.set(31.5,28.5,31.5),e.add(r);let i=new be({color:16777215});for(let t of Le){let r=new d(n,i);r.position.set(...t.position),r.rotation.set(...t.rotation),r.scale.set(...t.scale),e.add(r)}for(let t of Re){let n=t.kind===`ring`?new u(.5,1,64):new ve,r=new ee({side:2,toneMapped:!1});r.color.set(t.kind===`ring`?_.highlight:`#ffffff`).multiplyScalar(t.intensity),t.kind===`ring`&&(je=r);let i=new d(n,r);if(i.position.set(...t.position),i.scale.set(...t.scale),t.lookAtCenter&&i.lookAt(0,0,0),e.add(i),t.withLight){let n=new ie(16777215,100,28,2);n.position.set(...t.position),e.add(n)}}}function P(){j||Pe(),je&&je.color.set(_.highlight).multiplyScalar(15),M?.dispose(),M=Ae.fromScene(j,0,.1,1e3),de.environment=M.texture}let F=null,Ve=1,He=null,I=0,L=!1,Ue=new he,R=new fe;R.setDecoderPath(_.dracoDecoderPath),Ue.setDRACOLoader(R);function Ge(){F&&F.traverse(e=>{let t=e,n=Array.isArray(t.material)?t.material:[t.material];for(let e of n){let t=e;t&&typeof t.roughness==`number`&&(t.userData.baseRoughness===void 0&&(t.userData.baseRoughness=t.roughness),t.roughness=_.roughness>=0?_.roughness:t.userData.baseRoughness)}})}function Ke(){F&&xe.scale.setScalar(_.scale/Ve)}function B(){F&&=(xe.remove(F),st(F),null)}function Qe(e){B(),F=e;let t=new ce().setFromObject(F),n=t.getSize(new le),r=t.getCenter(new le);Ve=Math.max(n.x,n.y,n.z,1e-4),F.position.sub(r),Ge(),Ke(),xe.add(F)}async function $e(){let e=_.src;if(e===He)return;He=e;let t=++I;if(!e){B();return}try{let n=await fetch(e);if(!n.ok)throw Error(`HTTP ${n.status}`);let r=await n.arrayBuffer();if(L||t!==I)return;let i=new Uint8Array(r),a=Xe(i);if(!a)throw Error(`Unrecognized asset format`);if(a===`glb`||a===`gltf`){R.setDecoderPath(_.dracoDecoderPath);let n=e.slice(0,e.lastIndexOf(`/`)+1),o=a===`glb`?r:new TextDecoder().decode(i),s=await Ue.parseAsync(o,n);if(L||t!==I){st(s.scene);return}Qe(s.scene)}else{let e=await et(new Blob([r],{type:a===`svg`?`image/svg+xml`:``}),a);if(L||t!==I)return;Qe(ot(e,v.capabilities.getMaxAnisotropy()))}_.onLoad?.()}catch(e){if(L||t!==I)return;_.onError?.(e)}}let tt=window.matchMedia(`(prefers-reduced-motion: reduce)`),nt=tt.matches,rt=()=>{nt=tt.matches,nt&&b.rotation.set(0,0,0),ct()};tt.addEventListener(`change`,rt);function it(){let e=qe(_.cellAspect);if(Oe===_.charset&&ke===e)return;let t=Je(_.charset),r=We,i=Math.max(Math.round(r*e),8),a=i+16,c=Math.ceil(Math.sqrt(t.length)),l=Math.ceil(t.length/c),u=Ze(c*a,l*80),d=u.getContext(`2d`);if(!d)return;Oe=_.charset,ke=e,d.clearRect(0,0,u.width,u.height),d.fillStyle=`#ffffff`,d.textAlign=`center`,d.textBaseline=`middle`,d.font=`600 ${Math.floor(Math.min(r*.92,i/.58))}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;for(let e=0;e<t.length;e++)d.fillText(t[e],e%c*a+a/2,Math.floor(e/c)*80+40);let f=Ye(d.getImageData(0,0,u.width,u.height),c,i,r,t.length);k?.dispose(),A?.dispose(),k=new _e(u),k.minFilter=h,k.magFilter=p,k.wrapS=o,k.wrapT=o,A=new m(f,6,t.length,s,n),A.needsUpdate=!0,E.uniforms.tAtlas.value=k,E.uniforms.uAtlasGrid.value.set(c,l),E.uniforms.uAtlasPad.value.set(z/a,z/80),E.uniforms.uAtlasInner.value.set(i/a,r/80),O.uniforms.tShapes.value=A,O.uniforms.uGlyphCount.value=t.length}function at(){let e=v.getPixelRatio(),t=Math.max(_.cellSize,3)*e,n=t*qe(_.cellAspect);w.set(n,t);let r=Math.max(Math.ceil(C.x/n),1),i=Math.max(Math.ceil(C.y/t),1);Se.set(r,i),(T.width!==r||T.height!==i)&&T.setSize(r,i)}function ct(){de.environmentIntensity=_.environmentIntensity,x.enableRotate=_.orbit,x.enableZoom=_.zoom,x.autoRotate=_.autoRotate&&!nt,x.autoRotateSpeed=_.autoRotateSpeed,y.fov=_.fov,y.updateProjectionMatrix(),b.position.x=_.xOffset,b.position.y=Be+_.yOffset,O.uniforms.uContrast.value=Math.max(_.contrast,.05),O.uniforms.uEdgeContrast.value=Math.max(_.edgeContrast,.05),O.uniforms.uExposure.value=Math.max(_.exposure,0),O.uniforms.uInvert.value=+!!_.invert,E.uniforms.uAscii.value=+!!_.ascii,E.uniforms.uColored.value=+!!_.colored,E.uniforms.uInvertColor.value=+!!_.invertColor,E.uniforms.uColor.value.setStyle(_.color||`#ffffff`,``),E.uniforms.uHasBg.value=+!!_.background,_.background&&E.uniforms.uBackground.value.setStyle(_.background,``),it(),at(),Ge(),Ke()}function lt(){let e=Math.max(g.clientWidth,1),t=Math.max(g.clientHeight,1),n=Math.min(window.devicePixelRatio||1,2);v.setPixelRatio(n),v.setSize(e,t,!1);let r=Math.round(e*n),i=Math.round(t*n);S.setSize(r,i),C.set(r,i),y.aspect=e/t,y.updateProjectionMatrix(),at()}let V=new ResizeObserver(lt);V.observe(g),lt(),ct(),$e();let H=!0,ut=!1;function dt(e){if(!H){mt=0,ft();return}let t=mt?Math.min((e-mt)/1e3,.1):0;mt=e,N&&(N=!1,P()),x.update(),nt||(W+=t*_.floatSpeed,b.rotation.x=Math.cos(W/4)/8*_.rotationIntensity,b.rotation.y=Math.sin(W/4)/8*_.rotationIntensity,b.rotation.z=Math.sin(W/4)/20*_.rotationIntensity,b.position.y=Be+_.yOffset+Math.sin(W/1.5)/10*_.floatIntensity),v.setRenderTarget(S),v.render(de,y),_.ascii&&(v.setRenderTarget(T),v.render(De,Te)),v.setRenderTarget(null),v.render(we,Te)}function U(){ut||!H||L||(ut=!0,v.setAnimationLoop(dt))}function ft(){ut&&(ut=!1,v.setAnimationLoop(null))}let pt=typeof IntersectionObserver<`u`?new IntersectionObserver(e=>{H=e[e.length-1]?.isIntersecting??!0,H?U():ft()}):null;pt?.observe(g);let mt=0,W=Math.random()*100;return U(),{setOptions(e){let t=!1;for(let[n,r]of Object.entries(e))if(typeof r!=`function`&&_[n]!==r){t=!0;break}if(!t){Object.assign(_,e);return}let n=_.highlight,r=_.cameraDistance;Object.assign(_,e),_.highlight!==n&&(N=!0),_.cameraDistance!==r&&y.position.copy(ze).multiplyScalar(_.cameraDistance),ct(),lt(),$e(),U()},resize:lt,destroy(){L=!0,I+=1,ft(),V.disconnect(),pt?.disconnect(),tt.removeEventListener(`change`,rt),x.dispose(),B(),j&&st(j),M?.dispose(),Ae.dispose(),R.dispose(),S.dispose(),T.dispose(),O.dispose(),k?.dispose(),A?.dispose(),D.dispose(),E.dispose(),v.dispose()}}}function lt({className:e,style:t,...n}){let r=(0,M.useRef)(null),i=(0,M.useRef)(null),[a]=(0,M.useState)(n);return(0,M.useEffect)(()=>{let e=r.current;if(e)return i.current=ct({canvas:e},a),()=>{i.current?.destroy(),i.current=null}},[a]),(0,M.useEffect)(()=>{i.current?.setOptions(n)}),(0,N.jsx)(`div`,{className:e,style:{position:`relative`,...t},children:(0,N.jsx)(`canvas`,{ref:r,style:{position:`absolute`,inset:0,width:`100%`,height:`100%`,display:`block`,touchAction:`none`}})})}var V=e=>new Set(e.trim().split(/\s+/)),H=[{open:`"`,close:`"`,escape:!0},{open:`'`,close:`'`,escape:!0}],ut=/^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*)?\.?\d[\d_]*(?:[eE][+-]?\d+)?)[uUlLfFdDmMn]*/,dt={javascript:{aliases:[`js`,`jsx`,`mjs`,`cjs`,`node`],keywords:V(`
      as async await break case catch class const continue debugger default delete do else
      export extends finally for from function get if import in instanceof let new of return
      set static super switch this throw try typeof var void while with yield`),literals:V(`true false null undefined NaN Infinity`),builtins:V(`
      Array Boolean Date Error JSON Map Math Number Object Promise Proxy Reflect RegExp Set
      String Symbol WeakMap WeakSet BigInt console document window globalThis fetch
      setTimeout setInterval structuredClone`),lineComment:[`//`],blockComment:[[`/*`,`*/`]],strings:[...H,{open:"`",close:"`",escape:!0,interpolate:!0}],regex:!0},typescript:{aliases:[`ts`,`tsx`],inherit:`javascript`,extraKeywords:V(`
      abstract any asserts bigint boolean declare enum implements infer interface is keyof
      namespace never number object private protected public readonly require satisfies string
      symbol type undefined unique unknown`),types:V(`Array Partial Record Readonly Pick Omit Promise ReturnType Awaited`)},python:{aliases:[`py`],keywords:V(`
      and as assert async await break class continue def del elif else except finally for from
      global if import in is lambda match nonlocal not or pass raise return try while with yield`),literals:V(`True False None NotImplemented Ellipsis`),builtins:V(`
      abs all any bool bytes callable dict dir enumerate filter float format frozenset getattr
      hasattr hash id input int isinstance issubclass iter len list map max min next object open
      ord print property range repr reversed round set setattr sorted str sum super tuple type zip
      self cls __init__ __name__ __main__`),lineComment:[`#`],strings:[{open:`"""`,close:`"""`,escape:!0,multiline:!0},{open:`'''`,close:`'''`,escape:!0,multiline:!0},...H],prefixedStrings:/^[rRbBfFuU]{1,2}(?=["'])/,decorator:/^@[\w.]+/},java:{keywords:V(`
      abstract assert break case catch class const continue default do else enum extends final
      finally for goto if implements import instanceof interface native new package private
      protected public return static strictfp super switch synchronized this throw throws
      transient try var volatile while yield record sealed permits`),literals:V(`true false null`),types:V(`
      boolean byte char double float int long short void String Object Integer Double Boolean
      Long List Map Set ArrayList HashMap Optional Stream`),annotation:/^@\w+/,lineComment:[`//`],blockComment:[[`/*`,`*/`]],strings:[{open:`"""`,close:`"""`,escape:!0,multiline:!0},...H]},c:{keywords:V(`
      auto break case const continue default do else enum extern for goto if inline register
      restrict return sizeof static struct switch typedef union volatile while _Atomic
      _Bool _Static_assert`),literals:V(`NULL true false`),types:V(`
      char double float int long short signed unsigned void size_t ssize_t int8_t int16_t
      int32_t int64_t uint8_t uint16_t uint32_t uint64_t bool FILE`),lineComment:[`//`],blockComment:[[`/*`,`*/`]],strings:H,preprocessor:!0},cpp:{aliases:[`c++`,`cc`,`hpp`,`cxx`],inherit:`c`,extraKeywords:V(`
      alignas alignof and catch class co_await co_return co_yield concept constexpr consteval
      constinit decltype delete dynamic_cast explicit export friend mutable namespace new
      noexcept nullptr operator private protected public reinterpret_cast requires static_assert
      static_cast template this throw try typeid typename using virtual`),types:V(`
      string vector map unordered_map set unordered_set array pair tuple optional variant
      shared_ptr unique_ptr weak_ptr ostream istream stringstream size_t std`)},csharp:{aliases:[`cs`,`c#`,`dotnet`],keywords:V(`
      abstract as async await base break case catch checked class const continue default
      delegate do else enum event explicit extern finally fixed for foreach get goto if
      implicit in init interface internal is lock namespace new operator out override params
      private protected public readonly record ref return sealed set sizeof stackalloc static
      struct switch this throw try typeof unchecked unsafe using var virtual void volatile
      when where while yield`),literals:V(`true false null`),types:V(`
      bool byte char decimal double dynamic float int long object sbyte short string uint
      ulong ushort List Dictionary Task IEnumerable Nullable Span Console`),attribute:/^\[[A-Z]\w*(?:\([^)]*\))?\]/,lineComment:[`//`],blockComment:[[`/*`,`*/`]],strings:[{open:`@"`,close:`"`,escape:!1},...H],preprocessor:!0},bash:{aliases:[`sh`,`shell`,`zsh`,`console`],keywords:V(`
      if then elif else fi for while until do done case esac function in select time break
      continue return exit local export readonly declare source alias unset trap shift`),builtins:V(`
      awk cat cd chmod chown cp curl cut date df du echo env find git grep head kill ln ls
      make mkdir mv node npm printf ps pwd python rm rsync sed sort ssh sudo tail tar tee
      touch tr uname uniq wc wget xargs yarn docker kubectl`),lineComment:[`#`],strings:[{open:`"`,close:`"`,escape:!0,interpolate:!0},{open:`'`,close:`'`,escape:!1}],variable:/^\$(?:\{[^}]*\}|[\w@*#?$!-]+)/,prompt:/^\s*\$\s/},cmd:{aliases:[`bat`,`batch`,`powershell`,`ps1`,`dos`],caseInsensitive:!0,keywords:V(`
      if else for in do goto call exit set setlocal endlocal shift rem echo pause exist not
      errorlevel defined equ neu lss leq gtr geq param function return foreach where select`),builtins:V(`
      cd dir copy move del ren mkdir md rmdir rd type find findstr cls start tasklist taskkill
      ping ipconfig net sc reg powershell cmd xcopy robocopy attrib chdir`),lineComment:[`::`],lineCommentWord:/^rem\b/i,strings:[{open:`"`,close:`"`,escape:!1}],variable:/^(?:%[\w~:.]+%|%%?[a-zA-Z]|\$[\w:]+)/,operators:/^[+\-*/=<>!&|^~?:]+/,label:/^:[\w.-]+/},sql:{aliases:[`postgres`,`postgresql`,`mysql`,`sqlite`,`plsql`],caseInsensitive:!0,keywords:V(`
      add all alter analyze and any as asc begin between by cascade case cast check column
      commit constraint create cross cube current_date current_timestamp database default
      delete desc distinct drop else end except exists explain false fetch filter first
      foreign from full grant group having if ilike in index inner insert intersect into is
      join key left like limit not null nulls offset on or order outer over partition primary
      references rename replace returning revoke right rollback row rows select set some table
      then to transaction true truncate union unique update using values view when where
      window with`),types:V(`
      bigint bit blob boolean bytea char character date decimal double float int integer
      interval json jsonb numeric real serial smallint text time timestamp timestamptz uuid
      varchar xml`),builtins:V(`
      abs avg cast coalesce concat count date_trunc extract greatest json_agg lag lead least
      length lower max min now nullif rank row_number substring sum to_char trim upper`),lineComment:[`--`],blockComment:[[`/*`,`*/`]],strings:[{open:`'`,close:`'`,escape:!1,doubled:!0},{open:`"`,close:`"`,escape:!1,doubled:!0},{open:"`",close:"`",escape:!1}]}},U=new Map;for(let[e,t]of Object.entries(dt)){let n=t.inherit?dt[t.inherit]:{},r={...n,...t,keywords:new Set([...n.keywords??[],...t.keywords??[],...t.extraKeywords??[]]),literals:new Set([...n.literals??[],...t.literals??[]]),builtins:new Set([...n.builtins??[],...t.builtins??[]]),types:new Set([...n.types??[],...t.types??[]])};U.set(e,r);for(let e of t.aliases??[])U.set(e,r)}[...new Set(U.keys())].sort();var ft=/^[+\-*/%=<>!&|^~?:]+/,pt=/[A-Za-z_$\\]/,mt=/^[A-Za-z0-9_$]+/;function W(e,t){let n=t.trimEnd();if(n)return!/[A-Za-z0-9_$)\]]$/.test(n);for(let t=e.length-1;t>=0;t--){let n=e[t];if(n.c!==null||n.t.trim())return n.c===`key`?!0:n.c===`op`||n.c===`punc`?!/[)\]]$/.test(n.t):!1}return!0}function ht(e,t){let n=[],r=0,i=``,a=(e,t)=>{i&&=(n.push({c:null,t:i}),``),n.push({c:e,t})},o=()=>{for(let e=n.length-1;e>=0;e--){if(n[e].t.includes(`
`))return!i.trim();if(n[e].t.trim())return!1}return!i.trim()};for(;r<e.length;){let s=e.slice(r),c=e[r];if(t.prompt&&o()){let e=t.prompt.exec(s);if(e){a(`punc`,e[0]),r+=e[0].length;continue}}let l=!1;for(let[n,i]of t.blockComment??[])if(s.startsWith(n)){let t=e.indexOf(i,r+n.length),o=t===-1?e.length:t+i.length;a(`com`,e.slice(r,o)),r=o,l=!0;break}if(l)continue;for(let n of t.lineComment??[])if(s.startsWith(n)){let t=e.indexOf(`
`,r),n=t===-1?e.length:t;a(`com`,e.slice(r,n)),r=n,l=!0;break}if(l)continue;if(t.lineCommentWord&&o()&&t.lineCommentWord.test(s)){let t=e.indexOf(`
`,r),n=t===-1?e.length:t;a(`com`,e.slice(r,n)),r=n;continue}if(t.preprocessor&&c===`#`&&o()){let t=e.indexOf(`
`,r),n=t===-1?e.length:t;a(`key`,e.slice(r,n)),r=n;continue}for(let e of[`decorator`,`annotation`,`attribute`,`label`]){if(!t[e])continue;let n=t[e].exec(s);if(n){a(e===`label`?`fn`:`builtin`,n[0]),r+=n[0].length,l=!0;break}}if(l)continue;if(t.variable){let e=t.variable.exec(s);if(e){a(`var`,e[0]),r+=e[0].length;continue}}let u=``;if(t.prefixedStrings){let e=t.prefixedStrings.exec(s);e&&(u=e[0])}let d=s.slice(u.length),f=(t.strings??[]).find(e=>d.startsWith(e.open));if(f){let t=r+u.length+f.open.length;for(;t<e.length;){if(f.escape&&e[t]===`\\`){t+=2;continue}if(e.startsWith(f.close,t)){if(f.doubled&&e.startsWith(f.close,t+f.close.length)){t+=f.close.length*2;continue}t+=f.close.length;break}if(!f.multiline&&e[t]===`
`)break;t++}a(`str`,e.slice(r,t)),r=t;continue}if(t.regex&&c===`/`&&W(n,i)){let t=r+1,n=!1,i=!1;for(;t<e.length;){if(e[t]===`\\`){t+=2;continue}if(e[t]===`[`)n=!0;else if(e[t]===`]`)n=!1;else if(e[t]===`/`&&!n){i=!0,t++;break}else if(e[t]===`
`)break;t++}if(i){for(;t<e.length&&/[dgimsuvy]/.test(e[t]);)t++;a(`str`,e.slice(r,t)),r=t;continue}}if(/\d/.test(c)||c===`.`&&/\d/.test(e[r+1]??``)){let e=ut.exec(s);if(e){a(`num`,e[0]),r+=e[0].length;continue}}if(pt.test(c)){let e=(mt.exec(s)??[c])[0],n=t.caseInsensitive?e.toLowerCase():e,o=s.slice(e.length).match(/^\s*(.?)/)?.[1]??``,l=null;t.keywords.has(n)?l=`key`:t.literals.has(n)?l=`num`:t.types.has(n)||t.types.has(e)?l=`type`:t.builtins.has(n)||t.builtins.has(e)?l=`builtin`:o===`(`?l=`fn`:t.blockComment&&/^[A-Z][a-z]/.test(e)&&(l=`type`),l?a(l,e):i+=e,r+=e.length;continue}let p=(t.operators??ft).exec(s);if(p){a(`op`,p[0]),r+=p[0].length;continue}if(`()[]{},;.`.includes(c)){a(`punc`,c),r++;continue}i+=c,r++}return i&&n.push({c:null,t:i}),n}function gt(e,t){let n=e.replace(/\r\n?/g,`
`).replace(/\n+$/,``),r=U.get((t||``).toLowerCase());if(!r)return n.split(`
`).map(e=>e?[{c:null,t:e}]:[]);let i=ht(n,r),a=[[]];for(let e of i)e.t.split(`
`).forEach((t,n)=>{n>0&&a.push([]),t&&a[a.length-1].push({c:e.c,t})});return a}var _t={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`},G=e=>String(e).replace(/[&<>"]/g,e=>_t[e]),vt={alpha:`α`,beta:`β`,gamma:`γ`,delta:`δ`,epsilon:`ε`,varepsilon:`ε`,zeta:`ζ`,eta:`η`,theta:`θ`,vartheta:`ϑ`,iota:`ι`,kappa:`κ`,lambda:`λ`,mu:`μ`,nu:`ν`,xi:`ξ`,pi:`π`,varpi:`ϖ`,rho:`ρ`,varrho:`ϱ`,sigma:`σ`,varsigma:`ς`,tau:`τ`,upsilon:`υ`,phi:`φ`,varphi:`ϕ`,chi:`χ`,psi:`ψ`,omega:`ω`,Gamma:`Γ`,Delta:`Δ`,Theta:`Θ`,Lambda:`Λ`,Xi:`Ξ`,Pi:`Π`,Sigma:`Σ`,Upsilon:`Υ`,Phi:`Φ`,Psi:`Ψ`,Omega:`Ω`},yt={times:`×`,div:`÷`,pm:`±`,mp:`∓`,cdot:`⋅`,ast:`∗`,star:`⋆`,circ:`∘`,bullet:`∙`,oplus:`⊕`,ominus:`⊖`,otimes:`⊗`,odot:`⊙`,leq:`≤`,le:`≤`,geq:`≥`,ge:`≥`,neq:`≠`,ne:`≠`,equiv:`≡`,approx:`≈`,sim:`∼`,simeq:`≃`,cong:`≅`,propto:`∝`,ll:`≪`,gg:`≫`,subset:`⊂`,supset:`⊃`,subseteq:`⊆`,supseteq:`⊇`,in:`∈`,notin:`∉`,ni:`∋`,cup:`∪`,cap:`∩`,setminus:`∖`,to:`→`,rightarrow:`→`,leftarrow:`←`,leftrightarrow:`↔`,Rightarrow:`⇒`,Leftarrow:`⇐`,Leftrightarrow:`⇔`,mapsto:`↦`,land:`∧`,lor:`∨`,lnot:`¬`,forall:`∀`,exists:`∃`,nexists:`∄`,wedge:`∧`,vee:`∨`,perp:`⊥`,parallel:`∥`,angle:`∠`},bt={infty:`∞`,partial:`∂`,nabla:`∇`,emptyset:`∅`,varnothing:`∅`,ell:`ℓ`,hbar:`ℏ`,Re:`ℜ`,Im:`ℑ`,aleph:`ℵ`,degree:`°`,dots:`…`,ldots:`…`,cdots:`⋯`,vdots:`⋮`,ddots:`⋱`,prime:`′`,neg:`¬`,surd:`√`,top:`⊤`,bot:`⊥`,therefore:`∴`,because:`∵`,mathbbR:`ℝ`,mathbbN:`ℕ`,mathbbZ:`ℤ`,mathbbQ:`ℚ`,mathbbC:`ℂ`},xt={sum:`∑`,prod:`∏`,coprod:`∐`,bigcup:`⋃`,bigcap:`⋂`,bigoplus:`⨁`,bigotimes:`⨂`,bigvee:`⋁`,bigwedge:`⋀`,int:`∫`,iint:`∬`,iiint:`∭`,oint:`∮`,lim:`lim`,max:`max`,min:`min`,sup:`sup`,inf:`inf`,argmax:`arg max`,argmin:`arg min`},St=new Set(`sin.cos.tan.cot.sec.csc.arcsin.arccos.arctan.sinh.cosh.tanh.log.ln.lg.exp.det.dim.ker.deg.gcd.hom.Pr.mod.bmod.tr.rank`.split(`.`)),Ct={"(":`(`,")":`)`,"[":`[`,"]":`]`,"\\{":`{`,"\\}":`}`,"|":`|`,"\\|":`‖`,"\\langle":`⟨`,"\\rangle":`⟩`,"\\lceil":`⌈`,"\\rceil":`⌉`,"\\lfloor":`⌊`,"\\rfloor":`⌋`,".":``},wt={quad:`1em`,qquad:`2em`,",":`0.167em`,":":`0.222em`,";":`0.278em`,"!":`-0.167em`," ":`0.25em`};function Tt(e){let t=[],n=0;for(;n<e.length;){let r=e[n];if(r===`\\`){if(e[n+1]===`\\`){t.push({type:`newline`}),n+=2;continue}let r=/^\\([a-zA-Z]+|.)/.exec(e.slice(n));if(!r){n++;continue}t.push({type:`command`,name:r[1]}),n+=r[0].length;continue}if(r===`{`){t.push({type:`open`}),n++;continue}if(r===`}`){t.push({type:`close`}),n++;continue}if(r===`^`||r===`_`){t.push({type:`script`,kind:r}),n++;continue}if(r===`&`){t.push({type:`amp`}),n++;continue}if(/\s/.test(r)){n++;continue}let i=/^\d+(\.\d+)?/.exec(e.slice(n));if(i){t.push({type:`number`,value:i[0]}),n+=i[0].length;continue}t.push({type:`char`,value:r}),n++}return t}function Et(e,t){let n=e[t.i];if(!n)return null;if(n.type===`open`)return t.i++,{type:`group`,children:Dt(e,t)};if(n.type===`command`)return jt(e,t);if(t.i++,n.type===`number`)return{type:`num`,value:n.value};if(n.type===`newline`)return{type:`newline`};if(n.type===`amp`)return{type:`amp`};let r=n.value;return Ct[r]!==void 0&&`()[]|`.includes(r)?{type:`delim`,value:r}:`+-=<>*/`.includes(r)?{type:`op`,value:r===`-`?`−`:r===`*`?`∗`:r}:/[a-zA-Z]/.test(r)?{type:`ident`,value:r}:{type:`atom`,value:r}}function Dt(e,t){let n=[];for(;t.i<e.length&&e[t.i].type!==`close`;){let r=Ot(e,t);r&&n.push(r)}return t.i++,n}function Ot(e,t){let n=Et(e,t);if(!n)return null;for(;e[t.i]?.type===`script`;){let r=e[t.i].kind;t.i++;let i=Et(e,t);if(!i)break;n=r===`^`?{type:`scripted`,base:n,sup:i,sub:n.sub??null}:{type:`scripted`,base:n,sub:i,sup:n.sup??null},n.base.type===`scripted`&&(n={type:`scripted`,base:n.base.base,sup:n.sup??n.base.sup,sub:n.sub??n.base.sub})}return n}function K(e,t){let n=Et(e,t);return n?n.type===`group`?n:{type:`group`,children:[n]}:{type:`group`,children:[]}}function kt(e,t){if(e[t.i]?.type!==`open`)return Et(e,t)?.value??``;t.i++;let n=``,r=1;for(;t.i<e.length;){let i=e[t.i];if(i.type===`open`&&r++,i.type===`close`&&(r--,r===0))break;i.type===`char`||i.type===`number`?n+=i.value:i.type===`command`?n+=`\\${i.name}`:n+=` `,t.i++}return t.i++,n}var At={matrix:[``,``],pmatrix:[`(`,`)`],bmatrix:[`[`,`]`],Bmatrix:[`{`,`}`],vmatrix:[`|`,`|`],Vmatrix:[`‖`,`‖`]};function jt(e,t){let{name:n}=e[t.i];if(t.i++,n===`begin`||n===`end`){let r=kt(e,t);return n===`end`?{type:`endenv`,env:r}:Mt(e,t,r)}if(n===`frac`||n===`dfrac`||n===`tfrac`)return{type:`frac`,numerator:K(e,t),denominator:K(e,t)};if(n===`sqrt`){let n=null;if(e[t.i]?.type===`char`&&e[t.i].value===`[`){t.i++;let r=[];for(;t.i<e.length;){let n=e[t.i];if(n.type===`char`&&n.value===`]`){t.i++;break}let i=Ot(e,t);i?r.push(i):t.i++}n={type:`group`,children:r}}return{type:`sqrt`,index:n,radicand:K(e,t)}}if(n===`left`||n===`right`){let r=e[t.i],i=`.`;return r?.type===`char`?(i=r.value,t.i++):r?.type===`command`&&(i=`\\${r.name}`,t.i++),{type:n===`left`?`left`:`right`,delim:i}}if(n===`text`||n===`textrm`||n===`mbox`)return{type:`text`,value:kt(e,t)};if(n===`mathbf`||n===`bm`||n===`boldsymbol`)return{type:`style`,weight:`bold`,child:K(e,t)};if(n===`mathrm`||n===`operatorname`)return{type:`style`,upright:!0,child:K(e,t)};if(n===`mathbb`){let n=kt(e,t);return{type:`atom`,value:bt[`mathbb${n}`]??n}}return n===`overline`||n===`underline`||n===`widebar`?{type:`overline`,under:n===`underline`,child:K(e,t)}:n===`hat`||n===`bar`||n===`vec`||n===`tilde`||n===`dot`?{type:`accent`,mark:{hat:`̂`,bar:`̄`,vec:`⃗`,tilde:`̃`,dot:`̇`}[n],child:K(e,t)}:wt[n]===void 0?vt[n]?{type:`ident`,value:vt[n],greek:!0}:yt[n]?{type:`op`,value:yt[n]}:bt[n]?{type:`atom`,value:bt[n]}:xt[n]?{type:`big`,value:xt[n],word:xt[n].length>1}:St.has(n)?{type:`func`,value:n}:Ct[`\\${n}`]===void 0?{type:`unknown`,value:`\\${n}`}:{type:`delim`,value:`\\${n}`}:{type:`space`,width:wt[n]}}function Mt(e,t,n){let r=[[[]]],i=()=>r[r.length-1].push([]),a=()=>r.push([[]]);for(;t.i<e.length;){let n=e[t.i];if(n.type===`command`&&n.name===`end`){t.i++,kt(e,t);break}if(n.type===`amp`){t.i++,i();continue}if(n.type===`newline`){t.i++,a();continue}let o=Ot(e,t);if(o){let e=r[r.length-1];e[e.length-1].push(o)}else t.i++}for(;r.length>1&&r[r.length-1].every(e=>!e.length);)r.pop();return{type:`env`,env:n,rows:r}}function q(e){if(!e||typeof e!=`object`)return 1;switch(e.type){case`frac`:return q(e.numerator)+q(e.denominator);case`sqrt`:return q(e.radicand)+.15;case`scripted`:{let t=q(e.base);return e.base?.type===`big`?t+(e.sup?.7:0)+(e.sub?.7:0):t+(e.sup&&e.sub?.5:.25)}case`big`:return 1.4;case`group`:return Math.max(1,...e.children.map(q));case`env`:return Math.max(1,e.rows.length*1.35);case`style`:case`accent`:return q(e.child);default:return 1}}function J(e,t){let n=``;for(let r=0;r<e.length;r++){let i=e[r];if(i.type===`delim`&&(i.value===`(`||i.value===`[`)){let a=i.value===`(`?`)`:`]`,o=1,s=r+1;for(;s<e.length;s++)if(e[s].type===`delim`&&e[s].value===i.value)o++;else if(e[s].type===`delim`&&e[s].value===a&&(o--,o===0))break;if(s<e.length){let o=e.slice(r+1,s),c=Math.max(1,...o.map(q));if(c>1.3){let e=` style="--stretch:${c.toFixed(2)}"`;n+=`<span class="mrow-paren"><span class="stretchy mo-tight"${e}>${G(i.value)}</span>${J(o,t)}<span class="stretchy mo-tight"${e}>${G(a)}</span></span>`,r=s;continue}}}if(i.type===`left`){let a=[],o=1,s=`.`;for(r++;r<e.length;r++){if(e[r].type===`left`&&o++,e[r].type===`right`&&(o--,o===0)){s=e[r].delim;break}a.push(e[r])}let c=Ct[i.delim]??i.delim,l=Ct[s]??s,u=Math.max(1,...a.map(q)),d=u>1.05?` style="--stretch:${u.toFixed(2)}"`:``;n+=`<span class="mrow-paren"><span class="stretchy mo-tight"${d}>${G(c)}</span>${J(a,t)}<span class="stretchy mo-tight"${d}>${G(l)}</span></span>`;continue}n+=Y(i,t)}return n}function Y(e,t){switch(e.type){case`group`:return J(e.children,t);case`ident`:return`<span class="mi">${G(e.value)}</span>`;case`num`:return G(e.value);case`op`:return`<span class="mo">${G(e.value)}</span>`;case`atom`:case`unknown`:return G(e.value);case`delim`:return`<span class="mo-tight">${G(Ct[e.value]??e.value)}</span>`;case`text`:return`<span style="font-style:normal">${G(e.value)}</span>`;case`func`:return`<span class="mo-tight" style="font-style:normal">${G(e.value)}</span>`;case`space`:return`<span style="display:inline-block;width:${e.width}"></span>`;case`style`:return`<span style="${e.weight===`bold`?`font-weight:600`:`font-style:normal`}">${Y(e.child,t)}</span>`;case`accent`:return`<span>${Y(e.child,t)}${e.mark}</span>`;case`overline`:return`<span class="${e.under?`munder`:`mover`}">${Y(e.child,t)}</span>`;case`frac`:return`<span class="mfrac"><span>${Y(e.numerator,t)}</span><span>${Y(e.denominator,t)}</span></span>`;case`sqrt`:return`<span class="msqrt">${e.index?`<span class="mroot">${Y(e.index,t)}</span>`:``}<svg class="radical" viewBox="0 0 24 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 58 L6 58 L12 95 L23 1 L24 1" fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke"/></svg><span class="radicand">${Y(e.radicand,t)}</span></span>`;case`big`:{let n=e.word?null:t.display?`1.8em`:`1.25em`;return`<span class="mo">${e.word?`<span style="font-style:normal">${G(e.value)}</span>`:`<span style="font-size:${n};line-height:1">${G(e.value)}</span>`}</span>`}case`scripted`:return Nt(e,t);case`env`:return Pt(e,t);case`newline`:case`amp`:case`endenv`:case`right`:return``;default:return G(e.value??``)}}function Nt(e,t){let n=Y(e.base,t),r=e.sup?Y(e.sup,t):null,i=e.sub?Y(e.sub,t):null;return t.display&&e.base.type===`big`?`<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;padding-inline:0.24em">${r?`<span style="font-size:0.62em;line-height:1.15;margin-bottom:0.1em">${r}</span>`:``}${n}${i?`<span style="font-size:0.62em;line-height:1.15;margin-top:0.1em">${i}</span>`:``}</span>`:r&&i?`${n}<span style="display:inline-flex;flex-direction:column;font-size:0.74em;line-height:1.05;vertical-align:-0.1em"><span>${r}</span><span>${i}</span></span>`:r?`${n}<span class="msup">${r}</span>`:`${n}<span class="msub">${i}</span>`}function Pt(e,t){let{env:n,rows:r}=e;if(n===`aligned`||n===`align`||n===`align*`||n===`gather`){let e=r.map(e=>`<span style="display:contents">${e.map((e,n)=>`<span style="text-align:${n===0?`right`:`left`};padding-right:${n===0?`0.25em`:`0`}">${J(e,t)}</span>`).join(``)}</span>`).join(``);return`<span style="display:inline-grid;grid-template-columns:repeat(${Math.max(...r.map(e=>e.length),1)},auto);row-gap:0.45em;align-items:baseline">${e}</span>`}if(n===`cases`){let e=r.map(e=>e.map((e,n)=>`<span style="text-align:left;padding-right:${n===0?`1em`:`0`}">${J(e,t)}</span>`).join(``)).join(``),n=Math.max(...r.map(e=>e.length),1);return`<span class="mrow-paren"><span class="stretchy mo-tight" style="--stretch:${r.length*1.4}">{</span><span style="display:inline-grid;grid-template-columns:repeat(${n},auto);row-gap:0.3em">${e}</span></span>`}let i=At[n];if(i){let e=Math.max(...r.map(e=>e.length),1),n=r.map(e=>e.map(e=>`<span style="padding:0.1em 0.4em">${J(e,t)}</span>`).join(``)).join(``),a=r.length*1.3;return`<span class="mrow-paren">${i[0]?`<span class="stretchy mo-tight" style="--stretch:${a}">${G(i[0])}</span>`:``}<span style="display:inline-grid;grid-template-columns:repeat(${e},auto);align-items:center">${n}</span>${i[1]?`<span class="stretchy mo-tight" style="--stretch:${a}">${G(i[1])}</span>`:``}</span>`}return r.map(e=>e.map(e=>J(e,t)).join(` `)).join(` `)}function Ft(e,{display:t=!1}={}){let n=String(e).trim();if(!n)return``;try{let e=Tt(n),r={i:0},i=[];for(;r.i<e.length;){let t=Ot(e,r);t?i.push(t):r.i++}let a=J(i,{display:t});return`<span class="${t?`math math-display`:`math math-inline`}" role="math">${a}</span>`}catch{return`<span class="math-error" role="math">${G(n)}</span>`}}var It=/^-?\d+(\.\d+)?$/;function Lt(e){let t=e.trim();if(!t)return``;if(t.startsWith(`"`)&&t.endsWith(`"`)||t.startsWith(`'`)&&t.endsWith(`'`))return t.slice(1,-1);if(t===`true`)return!0;if(t===`false`)return!1;if(t===`null`||t===`~`)return null;if(It.test(t))return Number(t);if(t.startsWith(`[`)&&t.endsWith(`]`)){let e=t.slice(1,-1).trim();return e?e.split(`,`).map(e=>Lt(e)):[]}if(t.startsWith(`{`)&&t.endsWith(`}`)){let e=t.slice(1,-1).trim();if(!e)return{};let n={};for(let t of Rt(e)){let e=t.indexOf(`:`);e!==-1&&(n[t.slice(0,e).trim()]=Lt(t.slice(e+1)))}return n}return t}function Rt(e){let t=[],n=0,r=null,i=0;for(let a=0;a<e.length;a++){let o=e[a];r?o===r&&(r=null):o===`"`||o===`'`?r=o:o===`[`||o===`{`?n++:o===`]`||o===`}`?n--:o===`,`&&n===0&&(t.push(e.slice(i,a)),i=a+1)}return t.push(e.slice(i)),t.map(e=>e.trim()).filter(Boolean)}function zt(e){let t=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(e);if(!t)return{data:{},body:e};let n={},r=t[1].split(/\r?\n/),i=null,a=null,o=null,s=()=>{i&&a&&(n[i]=a),i&&o&&(n[i]=o),a=null,o=null};for(let e of r){if(!e.trim()||e.trim().startsWith(`#`))continue;let t=/^\s+/.test(e),r=e.trim();if(t&&r.startsWith(`- `)&&i){(a??=[]).push(Lt(r.slice(2)));continue}if(t&&i&&r.includes(`:`)){let e=r.indexOf(`:`);(o??={})[r.slice(0,e).trim()]=Lt(r.slice(e+1));continue}s();let c=r.indexOf(`:`);if(c===-1)continue;i=r.slice(0,c).trim();let l=r.slice(c+1).trim();l===``?n[i]=``:n[i]=Lt(l)}return s(),{data:n,body:e.slice(t[0].length)}}function Bt(e){return String(e).toLowerCase().normalize(`NFKD`).replace(/[\u0300-\u036f]/g,``).replace(/[^a-z0-9]+/g,`-`).replace(/^-+|-+$/g,``).slice(0,72)||`section`}function Vt(e){let t={},n=/([\w-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s]+)|([\w-]+)/g,r;for(;r=n.exec(e);)r[3]?t[r[3]]=!0:t[r[1]]=r[2].replace(/^["']|["']$/g,``);return t}var Ht=new Set([`gallery`,`video`,`audio`,`model`]),X={heading:/^(#{1,6})\s+(.*)$/,fence:/^(\s*)(`{3,}|~{3,})\s*(.*)$/,directive:/^:::\s*([\w-]+)\s*(.*)$/,directiveEnd:/^:::\s*$/,hr:/^\s{0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/,bullet:/^(\s*)([-*+])\s+(.*)$/,ordered:/^(\s*)(\d{1,9})[.)]\s+(.*)$/,quote:/^\s{0,3}>\s?(.*)$/,tableRule:/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/,footnote:/^\[\^([^\]]+)\]:\s*(.*)$/,task:/^\[([ xX])\]\s+(.*)$/};function Ut(e,t){let n=[],r=0,i=[],a=()=>{if(!i.length)return;let e=i.join(`
`).trim();i.length=0,e&&n.push({type:`paragraph`,children:Z(e,t)})};for(;r<e.length;){let o=e[r];if(!o.trim()){a(),r++;continue}let s=X.fence.exec(o);if(s){a();let t=s[2][0],i=s[2].length,o=s[3].trim(),c=[];for(r++;r<e.length;){let n=X.fence.exec(e[r]);if(n&&n[2][0]===t&&n[2].length>=i&&!n[3].trim()){r++;break}c.push(e[r]),r++}n.push(Kt(c.join(`
`),o));continue}if(o.trim()===`$$`){a();let t=[];for(r++;r<e.length&&e[r].trim()!==`$$`;)t.push(e[r]),r++;r++,n.push({type:`math`,display:!0,html:Ft(t.join(`
`),{display:!0})});continue}let c=X.directive.exec(o);if(c){a();let i=c[1].toLowerCase(),o=Vt(c[2]),s=[],l=1;for(r++;r<e.length;){if(X.directive.test(e[r]))l++;else if(X.directiveEnd.test(e[r])&&(l--,l===0)){r++;break}s.push(e[r]),r++}n.push({type:`directive`,name:i,attrs:o,value:Ht.has(i)?s.map(e=>e.trim()).filter(Boolean):null,children:Ht.has(i)?[]:Ut(s,t)});continue}let l=X.footnote.exec(o);if(l){a();let n=[l[2]];for(r++;r<e.length&&/^\s{2,}\S/.test(e[r]);)n.push(e[r].trim()),r++;t.footnotes.push({id:l[1],children:Z(n.join(` `).trim(),t)});continue}let u=X.heading.exec(o);if(u){a();let e=u[1].length,i=Z(u[2].trim(),t),o=Zt(i),s=Qt(Bt(o),t);n.push({type:`heading`,depth:e,id:s,children:i}),t.headings.push({id:s,text:o,depth:e}),r++;continue}if(X.hr.test(o)){a(),n.push({type:`thematicBreak`}),r++;continue}if(o.includes(`|`)&&r+1<e.length&&X.tableRule.test(e[r+1])){a();let i=Wt(e[r]),o=Wt(e[r+1]).map(e=>{let t=e.startsWith(`:`),n=e.endsWith(`:`);return t&&n?`center`:n?`right`:t?`left`:null});r+=2;let s=[];for(;r<e.length&&e[r].includes(`|`)&&e[r].trim();)s.push(Wt(e[r]).map(e=>Z(e,t))),r++;n.push({type:`table`,align:o,header:i.map(e=>Z(e,t)),rows:s});continue}if(X.quote.test(o)){a();let i=[];for(;r<e.length&&(X.quote.test(e[r])||e[r].trim()&&i.length);){let t=X.quote.exec(e[r]);i.push(t?t[1]:e[r]),r++}n.push({type:`blockquote`,children:Ut(i,t)});continue}if(X.bullet.test(o)||X.ordered.test(o)){a();let{node:i,next:o}=Gt(e,r,t);n.push(i),r=o;continue}i.push(o),r++}return a(),n}function Wt(e){return e.trim().replace(/^\||\|$/g,``).split(/(?<!\\)\|/).map(e=>e.trim().replace(/\\\|/g,`|`))}function Gt(e,t,n){let r=X.ordered.exec(e[t]),i=!!r,a=(r??X.bullet.exec(e[t]))[1].length,o=[],s=t,c=!1,l=null;for(;s<e.length;){let t=e[s],n=i?X.ordered.exec(t):X.bullet.exec(t);if(n&&n[1].length===a){l&&o.push(l),l=[n[3]],s++;continue}if(!t.trim()){if(s+1<e.length&&e[s+1].trim()&&/^\s{2,}/.test(e[s+1])){c=!0,l?.push(``),s++;continue}break}if(l&&/^\s{2,}/.test(t)){l.push(t.slice(a+2)),s++;continue}if(l&&!n){l.push(t.trim()),s++;continue}break}l&&o.push(l);let u=o.map(e=>{let t=e[0]??``,r=X.task.exec(t);return r&&(e=[r[2],...e.slice(1)]),{type:`listItem`,checked:r?r[1].toLowerCase()===`x`:null,children:Ut(e,n)}});return{node:{type:`list`,ordered:i,start:i?Number(r[2]):null,tight:!c,children:u},next:s}}function Kt(e,t){let[n,...r]=t.split(/\s+/),i=r.join(` `),a=(n||``).toLowerCase(),o=/\{([\d,\s-]+)\}/.exec(i),s=new Set;if(o)for(let e of o[1].split(`,`)){let[t,n]=e.trim().split(`-`).map(Number);if(t)for(let e=t;e<=(n||t);e++)s.add(e)}let c=Vt(i.replace(/\{[\d,\s-]+\}/,``));return{type:`code`,lang:a,filename:c.title||c.file||null,numbers:c.numbers!==`false`&&e.split(`
`).length>4,highlight:[...s],lines:gt(e,a)}}var qt=/[\\`*_{}[\]()#+\-.!$~|<>]/;function Z(e,t){let n=[],r=``,i=0,a=()=>{r&&n.push({type:`text`,value:r}),r=``};for(;i<e.length;){let o=e[i];if(o===`\\`&&i+1<e.length&&qt.test(e[i+1])){r+=e[i+1],i+=2;continue}if(o==="`"){let t=/^`+/.exec(e.slice(i))[0],r=e.indexOf(t,i+t.length);if(r!==-1){a(),n.push({type:`inlineCode`,value:e.slice(i+t.length,r).trim()}),i=r+t.length;continue}}if(o===`$`&&e[i+1]!==`$`){let t=Jt(e,i+1);if(t!==-1){a(),n.push({type:`math`,display:!1,html:Ft(e.slice(i+1,t),{display:!1})}),i=t+1;continue}}if(o===`<`){let t=/^<((?:https?|mailto):[^>\s]+)>/.exec(e.slice(i));if(t){a();let e=t[1];n.push({type:`link`,url:e,children:[{type:`text`,value:e.replace(/^mailto:/,``)}]}),i+=t[0].length;continue}}if(o===`!`&&e[i+1]===`[`){let t=Xt(e,i+1);if(t&&t.url!==null){a(),n.push({type:`image`,url:t.url,title:t.title,alt:t.label}),i=t.end;continue}}if(o===`[`){let r=/^\[\^([^\]]+)\]/.exec(e.slice(i));if(r){a(),t.refs.add(r[1]),n.push({type:`footnoteRef`,id:r[1]}),i+=r[0].length;continue}let o=Xt(e,i);if(o&&o.url!==null){a(),n.push({type:`link`,url:o.url,title:o.title,children:Z(o.label,t)}),i=o.end;continue}}if(o===`*`||o===`_`||o===`~`){let r=RegExp(`^\\${o}+`).exec(e.slice(i))[0],s=o===`~`?2:Math.min(r.length,2),c=o.repeat(s);if(r.length>=s){let r=i+s,l=Yt(e,r,c);if(l!==-1&&l>r){a();let c=Z(e.slice(r,l),t),u=o===`~`?`delete`:s===2?`strong`:`emphasis`;n.push({type:u,children:c}),i=l+s;continue}}}if(o===`
`){/ {2}$/.test(r)||r.endsWith(`\\`)?(r=r.replace(/(\s{2}|\\)$/,``),a(),n.push({type:`break`})):r+=` `,i++;continue}r+=o,i++}return a(),n}function Jt(e,t){for(let n=t;n<e.length;n++){if(e[n]===`\\`){n++;continue}if(e[n]!==`$`)continue;let t=e[n-1];if(!(t===void 0||/\s/.test(t))&&!/\d/.test(e[n+1]??``))return n}return-1}function Yt(e,t,n){for(let r=t;r<=e.length-n.length;r++){if(e[r]===`\\`){r++;continue}if(e[r]==="`"){let t=/^`+/.exec(e.slice(r))[0],n=e.indexOf(t,r+t.length);if(n!==-1){r=n+t.length-1;continue}}if(e.startsWith(n,r)&&!/\s/.test(e[r-1]??`x`))return r}return-1}function Xt(e,t){let n=0,r=t;for(;r<e.length;r++){if(e[r]===`\\`){r++;continue}if(e[r]===`[`)n++;else if(e[r]===`]`&&(n--,n===0))break}if(n!==0)return null;let i=e.slice(t+1,r);if(e[r+1]!==`(`)return null;let a=0,o=r+1;for(;o<e.length;o++){if(e[o]===`\\`){o++;continue}if(e[o]===`(`)a++;else if(e[o]===`)`&&(a--,a===0))break}if(a!==0)return null;let s=e.slice(r+2,o).trim(),c=/^(\S+)\s+["'(](.*)["')]$/.exec(s);return{label:i,url:c?c[1]:s,title:c?c[2]:null,end:o+1}}function Zt(e){return e.map(e=>e.type===`text`||e.type===`inlineCode`?e.value:e.children?Zt(e.children):``).join(``)}function Qt(e,t){let n=t.ids.get(e)??0;return t.ids.set(e,n+1),n?`${e}-${n}`:e}function $t(e){let t={headings:[],footnotes:[],refs:new Set,ids:new Map},n=Ut(e.replace(/\r\n?/g,`
`).replace(/\t/g,`  `).split(`
`),t),r=t.footnotes.filter(e=>t.refs.has(e.id)),i=e.replace(/```[\s\S]*?```/g,``).replace(/[#>*_`|-]/g,` `).split(/\s+/).filter(Boolean).length;return{ast:{type:`root`,children:n,footnotes:r},headings:t.headings,wordCount:i}}var en={"font-body":`ui-sans-serif, system-ui, -apple-system, sans-serif`,"font-mono":`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,"font-size":`16px`,"line-height":`1.7`,measure:`68ch`,radius:`8px`,space:`1.15em`,"rule-width":`1px`,bg:`transparent`,fg:`#e6e9ee`,muted:`#98a2b3`,accent:`#5aa2f0`,"accent-soft":`rgba(90, 162, 240, 0.15)`,surface:`#1b1f25`,border:`#2c333c`,hairline:`#242a31`,selection:`rgba(90, 162, 240, 0.3)`,"code-bg":`#1b1f25`,"code-fg":`#e6e9ee`,"code-inline-bg":`rgba(255, 255, 255, 0.07)`,"code-size":`0.875em`,gutter:`#5b6572`,"hl-line":`rgba(90, 162, 240, 0.12)`,"hl-edge":`#5aa2f0`,"tok-key":`#c792ea`,"tok-str":`#8fd68f`,"tok-num":`#f2b263`,"tok-com":`#6b7684`,"tok-fn":`#6db3f2`,"tok-type":`#5ecfd6`,"tok-op":`#b6bec9`,"tok-punc":`#8b95a1`,"tok-var":`#e6e9ee`,"tok-builtin":`#f0906b`,"callout-fill":`14%`,"callout-label-shade":`#000`,"callout-label-mix":`72%`,"callout-label-light":`#fff`,"callout-label-light-mix":`88%`,"note-bg":`rgba(255, 255, 255, 0.03)`,"note-accent":`#5f7086`,"note-border":`#2c333c`,"warn-border":`#d4674f`,"tip-border":`#5aa2f0`,"cal-yellow":`#e0a63a`,"cal-orange":`#e08148`,"cal-green":`#5cb87a`,"cal-red":`#e0685a`,"cal-purple":`#a98ae6`,"cal-pink":`#e07aa8`},tn={dark:{"callout-label-shade":`#fff`,"callout-label-mix":`78%`},light:{bg:`transparent`,fg:`#333a44`,muted:`#69737f`,accent:`#0e6579`,"accent-soft":`rgba(14, 101, 121, 0.12)`,surface:`#e8ecf0`,border:`#d1d9e0`,hairline:`#dfe4e9`,selection:`rgba(14, 101, 121, 0.18)`,"code-bg":`#edf0f3`,"code-fg":`#2e353f`,"code-inline-bg":`rgba(24, 42, 60, 0.07)`,gutter:`#98a3af`,"hl-line":`rgba(14, 101, 121, 0.1)`,"hl-edge":`#0e6579`,"tok-key":`#8639a6`,"tok-str":`#1f7449`,"tok-num":`#8f5510`,"tok-com":`#7b8693`,"tok-fn":`#1a5ba3`,"tok-type":`#0d6c78`,"tok-op":`#4b5560`,"tok-punc":`#7b8693`,"tok-var":`#2e353f`,"tok-builtin":`#a04729`,"note-bg":`rgba(20, 40, 60, 0.035)`,"note-border":`#d1d9e0`,"warn-accent":`#9c6b0c`,"cal-yellow":`#9c6b0c`,"cal-orange":`#a8541f`,"cal-green":`#1f7449`,"cal-red":`#b03a2c`,"cal-purple":`#6b3fa8`,"cal-pink":`#a83a6b`},petrol:{"font-body":`var(--font-sans, ui-sans-serif, system-ui, sans-serif)`,bg:`transparent`,fg:`oklch(0.245 0.012 75)`,muted:`oklch(0.525 0.015 75)`,accent:`oklch(0.485 0.085 205)`,"accent-soft":`oklch(0.485 0.085 205 / 0.13)`,surface:`oklch(0.951 0.009 85)`,border:`oklch(0.898 0.009 80)`,hairline:`oklch(0.925 0.008 82)`,selection:`oklch(0.485 0.085 205 / 0.18)`,"code-bg":`oklch(0.955 0.008 85)`,"code-fg":`oklch(0.245 0.012 75)`,"code-inline-bg":`oklch(0.245 0.012 75 / 0.07)`,gutter:`oklch(0.7 0.012 80)`,"hl-line":`oklch(0.485 0.085 205 / 0.1)`,"hl-edge":`oklch(0.485 0.085 205)`,"tok-key":`oklch(0.475 0.108 308)`,"tok-str":`oklch(0.478 0.088 150)`,"tok-num":`oklch(0.548 0.108 68)`,"tok-com":`oklch(0.615 0.012 80)`,"tok-fn":`oklch(0.518 0.098 248)`,"tok-type":`oklch(0.478 0.082 205)`,"tok-op":`oklch(0.452 0.014 75)`,"tok-punc":`oklch(0.585 0.013 78)`,"tok-var":`oklch(0.245 0.012 75)`,"tok-builtin":`oklch(0.528 0.128 36)`,"note-bg":`oklch(0.951 0.009 85)`,"note-border":`oklch(0.898 0.009 80)`,"warn-border":`oklch(0.552 0.168 27)`,"tip-border":`oklch(0.485 0.085 205)`,"cal-yellow":`oklch(0.578 0.128 78)`,"cal-orange":`oklch(0.558 0.142 44)`,"cal-green":`oklch(0.518 0.108 152)`,"cal-red":`oklch(0.542 0.158 27)`,"cal-purple":`oklch(0.502 0.132 300)`,"cal-pink":`oklch(0.542 0.138 348)`},"petrol-dark":{"font-body":`var(--font-sans, ui-sans-serif, system-ui, sans-serif)`,bg:`transparent`,fg:`oklch(0.955 0.005 240)`,muted:`oklch(0.715 0.017 242)`,accent:`oklch(0.735 0.098 197)`,"accent-soft":`oklch(0.735 0.098 197 / 0.16)`,surface:`oklch(0.218 0.013 244)`,border:`oklch(0.985 0.02 240 / 12%)`,hairline:`oklch(0.985 0.02 240 / 8%)`,selection:`oklch(0.735 0.098 197 / 0.28)`,"code-bg":`oklch(0.218 0.013 244)`,"code-fg":`oklch(0.955 0.005 240)`,"code-inline-bg":`oklch(0.985 0.02 240 / 10%)`,gutter:`oklch(0.505 0.015 244)`,"hl-line":`oklch(0.735 0.098 197 / 0.12)`,"hl-edge":`oklch(0.735 0.098 197)`,"tok-key":`oklch(0.752 0.108 310)`,"tok-str":`oklch(0.782 0.105 150)`,"tok-num":`oklch(0.802 0.098 82)`,"tok-com":`oklch(0.598 0.018 244)`,"tok-fn":`oklch(0.742 0.095 250)`,"tok-type":`oklch(0.782 0.088 195)`,"tok-op":`oklch(0.782 0.012 240)`,"tok-punc":`oklch(0.662 0.015 242)`,"tok-var":`oklch(0.955 0.005 240)`,"tok-builtin":`oklch(0.752 0.118 40)`,"note-bg":`oklch(0.985 0.02 240 / 4%)`,"note-border":`oklch(0.985 0.02 240 / 12%)`,"warn-border":`oklch(0.658 0.168 25)`,"tip-border":`oklch(0.735 0.098 197)`},paper:{fg:`#2b2620`,muted:`#6d6459`,accent:`#9a5518`,"accent-soft":`rgba(154, 85, 24, 0.12)`,surface:`#f4efe6`,border:`#ded5c6`,hairline:`#eae3d7`,"font-body":`Georgia, "Iowan Old Style", serif`,"line-height":`1.75`,"code-bg":`#f4efe6`,"code-inline-bg":`rgba(0, 0, 0, 0.05)`,"code-fg":`#2b2620`,gutter:`#a99c8a`,"hl-line":`rgba(154, 85, 24, 0.1)`,"hl-edge":`#9a5518`,"tok-key":`#8a3d6b`,"tok-str":`#3f6b34`,"tok-num":`#96591b`,"tok-com":`#8d8375`,"tok-fn":`#2f5d8f`,"tok-type":`#1f6b70`,"tok-op":`#5c5348`,"tok-punc":`#8d8375`,"tok-var":`#2b2620`,"tok-builtin":`#a1512c`,"cal-yellow":`oklch(0.578 0.128 78)`,"cal-orange":`oklch(0.558 0.142 44)`,"cal-green":`oklch(0.518 0.108 152)`,"cal-red":`oklch(0.542 0.158 27)`,"cal-purple":`oklch(0.502 0.132 300)`,"cal-pink":`oklch(0.542 0.138 348)`},inherit:{fg:`inherit`,muted:`currentColor`,bg:`transparent`,surface:`rgba(127, 127, 127, 0.08)`,"code-bg":`rgba(127, 127, 127, 0.08)`,"code-inline-bg":`rgba(127, 127, 127, 0.14)`,border:`rgba(127, 127, 127, 0.28)`,hairline:`rgba(127, 127, 127, 0.18)`}};function nn(e){if(!e)return{...en};if(typeof e==`string`)return{...en,...tn[e]??{}};let t=e.extends?nn(e.extends):{...en},n={...e};return delete n.extends,{...t,...n}}function rn(e=`dark`,{prefix:t=`md`,selector:n=null,varsOnly:r=!1}={}){let i=nn(e),a=t,o=n??`.${a}`,s=Object.entries(i).map(([e,t])=>`  --${a}-${e}: ${t};`).join(`
`);return r?`${o} {\n${s}\n}\n`:`${o} {
${s}

  color: var(--${a}-fg);
  background: var(--${a}-bg);
  font-family: var(--${a}-font-body);
  font-size: var(--${a}-font-size);
  line-height: var(--${a}-line-height);
  max-width: var(--${a}-measure);
  overflow-wrap: break-word;
}

${o} ::selection { background: var(--${a}-selection); }
${o} > * + * { margin-top: var(--${a}-space); }
${o} > :first-child { margin-top: 0; }

/* Headings */
${o} h1, ${o} h2, ${o} h3,
${o} h4, ${o} h5, ${o} h6 {
  line-height: 1.25;
  font-weight: 600;
  letter-spacing: -0.015em;
  scroll-margin-top: 5rem;
  text-wrap: balance;
}
${o} h1 { font-size: 2em; margin-top: 1.6em; }
${o} h2 { font-size: 1.5em; margin-top: 1.8em; }
${o} h3 { font-size: 1.25em; margin-top: 1.6em; }
${o} h4 { font-size: 1.05em; margin-top: 1.4em; }
${o} h5, ${o} h6 { font-size: 1em; margin-top: 1.2em; }
${o} .${a}-anchor {
  color: var(--${a}-muted);
  text-decoration: none;
  margin-left: 0.4em;
  opacity: 0;
  transition: opacity 120ms ease;
}
${o} :is(h1, h2, h3, h4, h5, h6):hover .${a}-anchor,
${o} .${a}-anchor:focus-visible { opacity: 1; }

/* Text */
${o} a {
  color: var(--${a}-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
}
${o} strong { font-weight: 650; }
${o} del { color: var(--${a}-muted); }
${o} hr {
  border: 0;
  border-top: var(--${a}-rule-width) solid var(--${a}-hairline);
  margin: 2.5em 0;
}
${o} blockquote {
  margin-inline: 0;
  padding-left: 1.1em;
  border-left: 2px solid var(--${a}-accent);
  color: var(--${a}-muted);
  font-style: italic;
}
${o} blockquote > * + * { margin-top: 0.7em; }

/* Lists */
${o} ul, ${o} ol { padding-left: 1.4em; }
${o} li + li { margin-top: 0.4em; }
${o} li > ul, ${o} li > ol { margin-top: 0.4em; }
${o} li::marker { color: var(--${a}-muted); }
${o} .${a}-task { list-style: none; margin-left: -1.4em; }
${o} .${a}-task input { margin-right: 0.5em; accent-color: var(--${a}-accent); }

/* Media */
${o} img, ${o} video { max-width: 100%; height: auto; border-radius: var(--${a}-radius); }
${o} figure { margin: 2em 0; }
${o} figcaption {
  margin-top: 0.6em;
  color: var(--${a}-muted);
  font-size: 0.875em;
}
${o} .${a}-gallery {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  margin: 2em 0;
}

/* Tables */
${o} .${a}-table-wrap { overflow-x: auto; margin: 1.6em 0; }
${o} table { width: 100%; border-collapse: collapse; font-size: 0.9375em; }
${o} th {
  text-align: left;
  font-weight: 550;
  color: var(--${a}-muted);
  padding: 0 1em 0.5em 0;
  border-bottom: var(--${a}-rule-width) solid var(--${a}-border);
}
${o} td {
  padding: 0.5em 1em 0.5em 0;
  border-bottom: var(--${a}-rule-width) solid var(--${a}-hairline);
  vertical-align: top;
}

/* Code */
${o} code {
  font-family: var(--${a}-font-mono);
  font-size: var(--${a}-code-size);
}
${o} :not(pre) > code {
  background: var(--${a}-code-inline-bg);
  padding: 0.15em 0.4em;
  border-radius: calc(var(--${a}-radius) / 2);
}
${o} .${a}-code {
  position: relative;
  margin: 1.6em 0;
  background: var(--${a}-code-bg);
  color: var(--${a}-code-fg);
  border: var(--${a}-rule-width) solid var(--${a}-border);
  border-radius: var(--${a}-radius);
  overflow: hidden;
}
${o} .${a}-code-head {
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.35em 0.45em 0.35em 0.95em;
  min-height: 2.8em;
  border-bottom: var(--${a}-rule-width) solid var(--${a}-hairline);
  color: var(--${a}-muted);
  font-family: var(--${a}-font-mono);
  font-size: 0.75em;
}
${o} .${a}-code-name { margin-right: auto; }
${o} .${a}-code-head .${a}-copy { position: static; font-size: 1em; margin-left: 0.4em; }

${o} .${a}-code pre {
  margin: 0;
  padding: 0.9em 0;
  overflow-x: auto;
  tab-size: 2;
  line-height: 1.6;
}
${o} .${a}-line { display: block; padding-inline: 0.9em; }
${o} .${a}-line[data-hl] {
  background: var(--${a}-hl-line);
  box-shadow: inset 2px 0 0 var(--${a}-hl-edge);
}
${o} .${a}-gutter {
  display: inline-block;
  width: 2.5ch;
  margin-right: 1.2em;
  text-align: right;
  color: var(--${a}-gutter);
  user-select: none;
}
${o} .${a}-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 2.25em;
  height: 2.25em;
  padding: 0;
  font: inherit;
  color: var(--${a}-muted);
  background: transparent;
  border: var(--${a}-rule-width) solid transparent;
  border-radius: calc(var(--${a}-radius) / 2);
  cursor: pointer;
  transition: color 120ms ease, background 120ms ease, border-color 120ms ease;
}
${o} .${a}-copy svg { width: 1.4em; height: 1.4em; display: block; pointer-events: none; }
${o} .${a}-copy:hover {
  color: var(--${a}-fg);
  background: var(--${a}-code-inline-bg);
  border-color: var(--${a}-border);
}
${o} .${a}-copy[data-copied] { color: var(--${a}-tok-str); border-color: currentColor; }
${o} .${a}-copy:focus-visible { outline: 2px solid var(--${a}-accent); outline-offset: 1px; }
${o} .${a}-copy[data-copied] { color: var(--${a}-tok-str); }
@media (hover: none) {
  ${o} .${a}-copy { opacity: 1; }
}
${o} .${a}-code-bare .${a}-copy {
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  z-index: 2;
  font-size: 0.875em;
  background: var(--${a}-surface);
  border-color: var(--${a}-border);
}
${o} .tok-key { color: var(--${a}-tok-key); }
${o} .tok-str { color: var(--${a}-tok-str); }
${o} .tok-num { color: var(--${a}-tok-num); }
${o} .tok-com { color: var(--${a}-tok-com); font-style: italic; }
${o} .tok-fn { color: var(--${a}-tok-fn); }
${o} .tok-type { color: var(--${a}-tok-type); }
${o} .tok-op { color: var(--${a}-tok-op); }
${o} .tok-punc { color: var(--${a}-tok-punc); }
${o} .tok-var { color: var(--${a}-tok-var); }
${o} .tok-builtin { color: var(--${a}-tok-builtin); }

/* Callouts */
${o} .${a}-callout {
  --cal: var(--${a}-note-border);
  margin: 1.6em 0;
  padding: 0.9em 1.1em;
  background: color-mix(in oklab, var(--cal) var(--${a}-callout-fill), transparent);
  border: var(--${a}-rule-width) solid color-mix(in oklab, var(--cal) 38%, transparent);
  border-radius: var(--${a}-radius);
  color: var(--cal);
  color: color-mix(in oklab, var(--cal) var(--${a}-callout-label-mix), var(--${a}-callout-label-shade));

}
${o} .${a}-callout > * + * { margin-top: 0.2em; }
${o} .${a}-callout-label {
  font-family: var(--${a}-font-mono);
  font-size: 1em;
  letter-spacing: 0.02em;
  font-weight: 650;
  color: var(--cal);
  color: color-mix(in oklab, var(--cal) var(--${a}-callout-label-light-mix), var(--${a}-callout-label-light));
}
${o} .${a}-callout-warning,
${o} .${a}-callout-yellow { --cal: var(--${a}-cal-yellow); }
${o} .${a}-callout-orange,
${o} .${a}-callout-caution { --cal: var(--${a}-cal-orange); }
${o} .${a}-callout-success,
${o} .${a}-callout-green { --cal: var(--${a}-cal-green); }
${o} .${a}-callout-destructive,
${o} .${a}-callout-danger,
${o} .${a}-callout-error,
${o} .${a}-callout-red { --cal: var(--${a}-cal-red); }
${o} .${a}-callout-purple { --cal: var(--${a}-cal-purple); }
${o} .${a}-callout-pink { --cal: var(--${a}-cal-pink); }
${o} .${a}-callout-tip,
${o} .${a}-callout-info,
${o} .${a}-callout-blue,
${o} .${a}-callout-finding { --cal: var(--${a}-tip-border); }
${o} .${a}-callout-note,
${o} .${a}-callout-aside { --cal: var(--${a}-muted); }
${o} details.${a}-details {
  border: var(--${a}-rule-width) solid var(--${a}-border);
  border-radius: var(--${a}-radius);
  padding: 0.7em 1em;
}
${o} details.${a}-details summary { cursor: pointer; font-weight: 550; }

/* Footnotes */
${o} .${a}-fnref { font-size: 0.75em; text-decoration: none; }
${o} .${a}-footnotes {
  margin-top: 3em;
  padding-top: 1.2em;
  border-top: var(--${a}-rule-width) solid var(--${a}-hairline);
  font-size: 0.9em;
  color: var(--${a}-muted);
}

/* Math */
${o} .math { font-family: var(--${a}-font-mono); line-height: 1.2; }
${o} .math-display {
  display: block;
  margin: 1.6em 0;
  text-align: center;
  overflow-x: auto;
  overflow-y: hidden;
  font-size: 1.05em;
}
${o} .math-inline { display: inline-block; vertical-align: baseline; padding-inline: 0.08em; }
${o} .math .mi { font-style: italic; padding-right: 0.02em; }
${o} .math .mo { padding-inline: 0.22em; }
${o} .math .mo-tight { padding-inline: 0.08em; }
${o} .math .mfrac {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  text-align: center;
  vertical-align: middle;
  padding-inline: 0.18em;
  font-size: 0.94em;
}
${o} .math .mfrac > span {
  padding-inline: 0.22em;
}
${o} .math .mfrac > span:first-child {
  padding-bottom: 0.12em;
}
${o} .math .mfrac > span:last-child {
  border-top: 1px solid currentColor;
  padding-top: 0.12em;
}
${o} .math .mover {
  display: inline-block;
  border-top: 1px solid currentColor;
  padding-top: 0.12em;
  margin-top: 0.12em;
}
${o} .math .munder {
  display: inline-block;
  border-bottom: 1px solid currentColor;
  padding-bottom: 0.1em;
}

${o} .math .msup, ${o} .math .msub { font-size: 0.74em; line-height: 1; }
${o} .math .msup { vertical-align: 0.48em; }
${o} .math .msub { vertical-align: -0.28em; }
${o} .math .msqrt {
  display: inline-flex;
  align-items: stretch;
  vertical-align: middle;
  padding-top: 0.08em;
}
${o} .math .msqrt > .radical {
  flex: none;
  width: 0.55em;
  align-self: stretch;
  overflow: visible;
}
${o} .math .msqrt > .radicand {
  border-top: 1px solid currentColor;
  padding: 0.16em 0.16em 0 0.08em;
}
${o} .math .msqrt > .mroot {
  align-self: flex-start;
  font-size: 0.6em;
  margin-right: -0.3em;
  z-index: 1;
}
${o} .math .mrow-paren { display: inline-flex; align-items: center; }
${o} .math .stretchy {
  display: inline-block;
  transform: scaleY(var(--stretch, 1));
  transform-origin: center;
  will-change: transform;
}
${o} .math .mrow-paren { align-items: center; }
${o} .math-error {
  color: var(--${a}-warn-border);
  font-family: var(--${a}-font-mono);
  border-bottom: 1px dotted currentColor;
}

@media (prefers-reduced-motion: reduce) {
  ${o} * { transition-duration: 0.001ms !important; }
}
`}var an={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`},Q=e=>String(e??``).replace(/[&<>"']/g,e=>an[e]);function on(e){let t=String(e??``).trim();return/^(javascript|vbscript):/i.test(t)||/^data:/i.test(t)&&!/^data:image\//i.test(t)?`#`:t}var $=(e,t)=>t==null||t===!1||t===``?``:` ${e}="${Q(t)}"`;function sn(e){let t=(t,n)=>{let r=t.attrs.type??(t.name===`note`?`note`:t.name),i=t.attrs.title??r.charAt(0).toUpperCase()+r.slice(1);return`<aside class="${e}-callout ${e}-callout-${Q(r)}"><p class="${e}-callout-label">${Q(i)}</p>`+n.blocks(t.children)+`</aside>`};return{note:t,warning:t,tip:t,finding:t,aside:t,info:t,details:(t,n)=>`<details class="${e}-details"><summary>${Q(t.attrs.title??`Details`)}</summary>`+n.blocks(t.children)+`</details>`,figure:(e,t)=>{let n=t.url(e.attrs.src);return n?`<figure><img${$(`src`,n)}${$(`alt`,e.attrs.alt??``)} loading="lazy" decoding="async">`+(e.attrs.caption?`<figcaption>${Q(e.attrs.caption)}</figcaption>`:``)+`</figure>`:``},gallery:(t,n)=>{let r=(t.value??[]).map(e=>n.url(e.split(/\s+/)[0])).filter(Boolean).map(e=>`<img${$(`src`,e)} alt="" loading="lazy" decoding="async">`).join(``);return r?`<div class="${e}-gallery">${r}</div>`:``},video:(e,t)=>{let n=t.url(e.attrs.src??e.value?.[0]);return n?`<figure><video controls preload="none" playsinline${$(`poster`,t.url(e.attrs.poster))}${e.attrs.loop?` loop`:``}${$(`src`,n)}></video>`+(e.attrs.caption?`<figcaption>${Q(e.attrs.caption)}</figcaption>`:``)+`</figure>`:``},audio:(e,t)=>{let n=t.url(e.attrs.src??e.value?.[0]);return n?`<figure><audio controls preload="none"${$(`src`,n)}></audio></figure>`:``}}}function cn(e){let t=e.prefix,n={...sn(t),...e.directives??{}},r=e.renderers??{},i=t=>t?on(e.resolveUrl(t)):``,a={blocks:e=>c(e),inline:e=>o(e),url:i,escape:Q,attr:$,prefix:t};function o(e){return(e??[]).map(s).join(``)}function s(n){let s=r[n.type];if(s){let e=s(n,a);if(e!=null)return e}switch(n.type){case`text`:return Q(n.value);case`strong`:return`<strong>${o(n.children)}</strong>`;case`emphasis`:return`<em>${o(n.children)}</em>`;case`delete`:return`<del>${o(n.children)}</del>`;case`inlineCode`:return`<code>${Q(n.value)}</code>`;case`break`:return`<br>`;case`math`:return n.html;case`link`:{let t=i(n.url),r=/^https?:/i.test(t)&&e.externalLinks;return`<a${$(`href`,t)}${$(`title`,n.title)}`+(r?` target="_blank" rel="noreferrer noopener"`:``)+`>${o(n.children)}</a>`}case`image`:return`<img${$(`src`,i(n.url))}${$(`alt`,n.alt??``)}${$(`title`,n.title)} loading="lazy" decoding="async">`;case`footnoteRef`:return`<sup id="ref-${Q(n.id)}"><a class="${t}-fnref" href="#fn-${Q(n.id)}">[${Q(n.id)}]</a></sup>`;default:return``}}function c(e){return(e??[]).map(l).join(`
`)}function l(i){let l=r[i.type];if(l){let e=l(i,a);if(e!=null)return e}switch(i.type){case`paragraph`:return i.children.length===1&&i.children[0].type===`image`?`<figure>${s(i.children[0])}</figure>`:`<p>${o(i.children)}</p>`;case`heading`:{let n=Math.min(i.depth,6),r=e.anchors?`<a class="${t}-anchor" href="#${Q(i.id)}" aria-label="Link to this section">#</a>`:``;return`<h${n} id="${Q(i.id)}">${o(i.children)}${r}</h${n}>`}case`list`:{let e=i.ordered?`ol`:`ul`;return`<${e}${i.ordered&&i.start!==1?$(`start`,i.start):``}>${i.children.map(e=>{let n=e.checked===null?``:`<input type="checkbox" disabled${e.checked?` checked`:``}>`;return`<li${e.checked===null?``:` class="${t}-task"`}>${n}${i.tight&&e.children.length===1&&e.children[0].type===`paragraph`?o(e.children[0].children):c(e.children)}</li>`}).join(``)}</${e}>`}case`blockquote`:return`<blockquote>${c(i.children)}</blockquote>`;case`thematicBreak`:return`<hr>`;case`math`:return i.html;case`code`:return dn(i,t,e);case`table`:{let e=i.header.map((e,t)=>`<th${$(`style`,i.align[t]?`text-align:${i.align[t]}`:``)}>${o(e)}</th>`).join(``),n=i.rows.map(e=>`<tr>`+e.map((e,t)=>`<td${$(`style`,i.align[t]?`text-align:${i.align[t]}`:``)}>${o(e)}</td>`).join(``)+`</tr>`).join(``);return`<div class="${t}-table-wrap"><table><thead><tr>${e}</tr></thead><tbody>${n}</tbody></table></div>`}case`directive`:{let e=n[i.name];if(e){let t=e(i,a);if(t!=null)return t}return n.note(i,a)}default:return``}}function u(e){if(!e?.length)return``;let n=e.map(e=>`<li id="fn-${Q(e.id)}">${o(e.children)} <a href="#ref-${Q(e.id)}" aria-label="Back to reference">&#8617;</a></li>`).join(``);return`<section class="${t}-footnotes"><ol>${n}</ol></section>`}return{blocks:c,inline:o,footnotes:u}}var ln=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,un=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>`;function dn(e,t,n){let r=n.lineNumbers===`auto`?e.numbers:!!n.lineNumbers,i=new Set(e.highlight??[]),a=!!(e.filename||e.lang&&n.showLanguage),o=n.copyButton?`<button type="button" class="${t}-copy" data-${t}-copy aria-label="Copy code" title="Copy code">${ln}</button>`:``,s=a?`<div class="${t}-code-head"><span class="${t}-code-name">${Q(e.filename??e.lang)}</span>`+(e.filename&&e.lang?`<span>${Q(e.lang)}</span>`:``)+o+`</div>`:``,c=e.lines.map((e,n)=>{let a=r?`<span class="${t}-gutter">${n+1}</span>`:``,o=e.map(e=>e.c?`<span class="tok-${e.c}">${Q(e.t)}</span>`:Q(e.t)).join(``);return`<span class="${t}-line"${i.has(n+1)?` data-hl`:``}>${a}${o}\n</span>`}).join(``);return`<div class="${t}-code${a?``:` ${t}-code-bare`}"${$(`data-lang`,e.lang)}>${s}${a?``:o}<pre><code>${c}</code></pre></div>`}var fn={theme:`light`,darkTheme:null,darkSelector:null,selector:null,prefix:`md`,anchors:!0,externalLinks:!0,lineNumbers:`auto`,copyButton:!0,autoCopy:!0,showLanguage:!0,resolveUrl:e=>e,wpm:220,renderers:null,directives:null};function pn(e={}){let t={...fn,...e},n=cn(t);t.autoCopy&&t.copyButton&&gn(t.prefix);let r=t.selector??`.${t.prefix}`,i=rn(t.theme,{prefix:t.prefix,selector:t.selector})+(t.darkTheme?rn(t.darkTheme,{prefix:t.prefix,selector:t.darkSelector??`.dark ${r}, .dark${r}`,varsOnly:!0}):``);function a(e){let{data:n,body:r}=zt(String(e??``)),{ast:i,headings:a,wordCount:o}=$t(r);return{meta:n,ast:i,headings:a,wordCount:o,readingTime:Math.max(1,Math.round(o/t.wpm))}}function o(e){let t=a(e),r=n.blocks(t.ast.children)+n.footnotes(t.ast.footnotes);return{...t,html:r,toc:mn(t.headings)}}return{render:o,parse:a,css:i,theme:nn(t.theme),options:t,renderAst:e=>n.blocks(e.children)+n.footnotes(e.footnotes)}}function mn(e){let t=[],n=[{depth:0,children:t}];for(let t of e){let e={...t,children:[]};for(;n.length>1&&n[n.length-1].depth>=t.depth;)n.pop();n[n.length-1].children.push(e),n.push(e)}return t}var hn=new Set;function gn(e=`md`){typeof document>`u`||hn.has(e)||(hn.add(e),_n(document,{prefix:e}))}function _n(e,{prefix:t=`md`}={}){let n=async n=>{let r=n.target.closest(`[data-${t}-copy]`);if(!r||!e.contains(r))return;let i=r.closest(`.${t}-code`)?.querySelector(`code`);if(!i)return;let a=i.cloneNode(!0);a.querySelectorAll(`.${t}-gutter`).forEach(e=>e.remove());let o=a.textContent.replace(/\n$/,``);try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(o);else{let e=document.createElement(`textarea`);e.value=o,e.setAttribute(`readonly`,``),e.style.cssText=`position:fixed;top:-9999px;opacity:0`,document.body.appendChild(e),e.select(),document.execCommand(`copy`),e.remove()}r.innerHTML=un,r.setAttribute(`data-copied`,``),r.setAttribute(`aria-label`,`Copied`),clearTimeout(r._resetTimer),r._resetTimer=setTimeout(()=>{r.innerHTML=ln,r.removeAttribute(`data-copied`),r.setAttribute(`aria-label`,`Copy code`)},1500)}catch{}};return e.addEventListener(`click`,n),()=>e.removeEventListener(`click`,n)}var vn=4,yn=Object.assign({"/content/projects/Aerial Vehicle/entry.md":k,"/content/projects/Neurex/entry.md":A,"/content/research/ASRPSL/entry.md":Oe}),bn=Object.assign({"/content/journal/Showcase/img1.webp":ke,"/content/journal/Showcase/video1.webm":Ae,"/content/projects/Aerial Vehicle/badge.webp":j,"/content/projects/Aerial Vehicle/img1.webp":je}),xn=()=>Object.entries(yn).map(([e,t])=>{let n=e.split(`/`),r=n[2],i=n[3],a=`/content/${r}/${i}/`,o={},s=t.match(/---\r?\n([\s\S]*?)\r?\n---/);if(s){let e=s[1].split(/\r?\n/),t=null,n=``;e.forEach(e=>{let r=e.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);r?(t&&(o[t]=c(n)),t=r[1].toLowerCase(),n=r[2]):t&&e.trim()&&(n+=` `+e.trim())}),t&&(o[t]=c(n))}function c(e){let t=e.trim();return t.startsWith(`"`)&&t.endsWith(`"`)||t.startsWith(`'`)&&t.endsWith(`'`)?t.slice(1,-1):t.startsWith(`[`)&&t.endsWith(`]`)?t.slice(1,-1).split(`,`).map(e=>e.trim().replace(/^["']|["']$/g,``)):t}o.tags=Array.isArray(o.tags)?o.tags:o.tags?String(o.tags).split(`,`).map(e=>e.trim()).filter(Boolean):[];let l=s?t.replace(/---\r?\n[\s\S]*?\r?\n---/,``):t;l=l.replace(/\]\(([^)]+\.(webp|webm|mp4|png|jpg|jpeg|gif|avif))\)/gi,(e,t)=>{let n=t.replace(/^\.\//,``),r=bn[`${a}${n}`];return r?`](${r})`:e});let u=bn[`${a}badge.webp`]||null;return{id:i,category:r,meta:o,content:l,badgeUrl:u}}),Sn=`
  .md :is(h1, h2, h3, h4, h5, h6)[id] { scroll-margin-top: 10rem; }
  .md [id^="fn-"] { scroll-margin-top: 1.5rem; }
  .md [id^="ref-"] { scroll-margin-top: 10rem; }
  @media (prefers-reduced-motion: no-preference) {
    html { scroll-behavior: smooth; }
  }
`,Cn=[{key:`githuburl`,label:`View Source`,Icon:S,iconClass:`size-4 dark:invert`},{key:`demourl`,label:`Live Demo`,Icon:Te},{key:`paperurl`,label:`Read Paper`,Icon:Se},{key:`researchgateurl`,label:`ResearchGate`,Icon:e=>(0,N.jsxs)(`svg`,{role:`img`,viewBox:`0 0 24 24`,fill:`currentColor`,xmlns:`http://www.w3.org/2000/svg`,...e,children:[(0,N.jsx)(`title`,{children:`ResearchGate`}),(0,N.jsx)(`path`,{d:`M19.586 0c-.818 0-1.508.19-2.073.565-.563.377-.97.936-1.213 1.68a3.193 3.193 0 0 0-.112.437 8.365 8.365 0 0 0-.078.53 9 9 0 0 0-.05.727c-.01.282-.013.621-.013 1.016a31.121 31.123 0 0 0 .014 1.017 9 9 0 0 0 .05.727 7.946 7.946 0 0 0 .077.53h-.005a3.334 3.334 0 0 0 .113.438c.245.743.65 1.303 1.214 1.68.565.376 1.256.564 2.075.564.8 0 1.536-.213 2.105-.603.57-.39.94-.916 1.175-1.65.076-.235.135-.558.177-.93a10.9 10.9 0 0 0 .043-1.207v-.82c0-.095-.047-.142-.14-.142h-3.064c-.094 0-.14.047-.14.141v.956c0 .094.046.14.14.14h1.666c.056 0 .084.03.084.086 0 .36 0 .62-.036.865-.038.244-.1.447-.147.606-.108.385-.348.664-.638.876-.29.212-.738.35-1.227.35-.545 0-.901-.15-1.21-.353-.306-.203-.517-.454-.67-.915a3.136 3.136 0 0 1-.147-.762 17.366 17.367 0 0 1-.034-.656c-.01-.26-.014-.572-.014-.939a26.401 26.403 0 0 1 .014-.938 15.821 15.822 0 0 1 .035-.656 3.19 3.19 0 0 1 .148-.76 1.89 1.89 0 0 1 .742-1.01c.344-.244.593-.352 1.137-.352.508 0 .815.096 1.144.303.33.207.528.492.764.925.047.094.111.118.198.07l1.044-.43c.075-.048.09-.115.042-.199a3.549 3.549 0 0 0-.466-.742 3 3 0 0 0-.679-.607 3.313 3.313 0 0 0-.903-.41A4.068 4.068 0 0 0 19.586 0zM8.217 5.836c-1.69 0-3.036.086-4.297.086-1.146 0-2.291 0-3.007-.029v.831l1.088.2c.744.144 1.174.488 1.174 2.264v11.288c0 1.777-.43 2.12-1.174 2.263l-1.088.2v.832c.773-.029 2.12-.086 3.465-.086 1.29 0 2.951.057 3.667.086v-.831l-1.49-.2c-.773-.115-1.174-.487-1.174-2.264v-4.784c.688.057 1.29.057 2.206.057 1.748 3.123 3.41 5.472 4.355 6.56.86 1.032 2.177 1.691 3.839 1.691.487 0 1.003-.086 1.318-.23v-.744c-1.031 0-2.063-.716-2.808-1.518-1.26-1.376-2.95-3.582-4.355-6.074 2.32-.545 4.04-2.722 4.04-4.9 0-3.208-2.492-4.698-5.758-4.698zm-.515 1.29c2.406 0 3.839 1.26 3.839 3.552 0 2.263-1.547 3.782-4.097 3.782-.974 0-1.404-.03-2.063-.086v-7.19c.66-.059 1.547-.059 2.32-.059z`})]})},{key:`doi`,label:`DOI`,Icon:e=>(0,N.jsx)(`div`,{className:`grayscale`,children:(0,N.jsxs)(`svg`,{role:`img`,viewBox:`0 0 24 24`,fill:`#FAB70C`,xmlns:`http://www.w3.org/2000/svg`,...e,children:[(0,N.jsx)(`title`,{children:`DOI`}),(0,N.jsx)(`path`,{d:`M24 12c0 6.633-5.367 12-12 12S0 18.633 0 12 5.367 0 12 0s12 5.367 12 12ZM7.588 6.097v4.471c-.663-.925-1.403-1.373-2.406-1.373-2.046 0-3.244 1.441-3.244 3.847 0 2.357 1.325 3.848 3.166 3.848 1.12 0 1.88-.4 2.445-1.325l-.039 1.042h2.045V6.097Zm-1.763 8.942c-1.12 0-1.802-.76-1.802-2.045 0-1.325.682-2.085 1.802-2.085 1.081 0 1.802.76 1.802 2.085 0 1.285-.672 2.045-1.802 2.045Zm12.253-1.948c0-2.172-1.578-3.789-3.906-3.789-2.328 0-3.945 1.695-3.945 3.789 0 2.133 1.578 3.789 3.945 3.789 2.289 0 3.906-1.656 3.906-3.789Zm-2.094-.01c0 1.14-.711 1.89-1.851 1.89-1.139 0-1.851-.75-1.851-1.89 0-1.139.712-1.89 1.851-1.89 1.149 0 1.861.751 1.851 1.89Zm2.6-5.795c0 .633.517 1.227 1.189 1.227.633 0 1.188-.555 1.188-1.227a1.17 1.17 0 0 0-1.188-1.189c-.672 0-1.179.556-1.189 1.189Zm.166 9.341h2.055V9.604H18.75Z`})]})}),resolve:e=>{let t=String(e??``).trim();return t?/^https?:/i.test(t)?t:`https://doi.org/${t.replace(/^doi:\s*/i,``)}`:null}}];function wn(e,t){let[n,r]=(0,M.useState)([]);return(0,M.useLayoutEffect)(()=>{let t=e.current;if(!t)return;let n=e=>{let t=e.cloneNode(!0);return t.querySelectorAll(`a`).forEach(e=>{let t=(e.textContent||``).trim();(!t||/^[#¶§🔗]+$/.test(t)||/anchor|permalink|headerlink/i.test(e.getAttribute(`class`)||``))&&e.remove()}),(t.textContent||``).replace(/\s+/g,` `).trim()||(e.textContent||``).replace(/[#¶§🔗]/g,``).replace(/\s+/g,` `).trim()},i=new Set,a=[...t.querySelectorAll(`h2, h3`)].filter(e=>!e.closest(`.footnotes`)).map((e,t)=>{let r=n(e)||`Section ${t+1}`,a=e.id;if(!a||i.has(a)){let t=r.toLowerCase().replace(/[^\w\u00C0-\u024F]+/g,`-`).replace(/^-+|-+$/g,``)||`section`;a=t;let n=1;for(;i.has(a);)a=`${t}-${n++}`;e.id=a}return i.add(a),{id:a,text:r,level:e.tagName===`H3`?3:2}});r(a)},[e,t]),n}var Tn=({entry:e,onBack:t})=>{let[n,r]=(0,M.useState)(!1),i=(0,M.useRef)(null),a=()=>{e.meta.bibtex&&(navigator.clipboard.writeText(e.meta.bibtex),r(!0),setTimeout(()=>r(!1),2e3))},o=(0,M.useMemo)(()=>{try{return pn({theme:`petrol`,darkTheme:`inherit`,prefix:`md`})}catch{return{css:``,render:()=>({html:`<p>Theme error</p>`,headings:[]})}}},[]),s=(0,M.useMemo)(()=>{try{let t=o.render(String(e.content));return t&&t.html&&(t.html=t.html.replace(/<img[^>]+src=["']([^"']+\.(webm|mp4))["'][^>]*>/gi,(e,t,n)=>`<video width="100%" controls controlslist="nodownload noplaybackrate noremoteplayback" disablePictureInPicture disableRemotePlayback playsInline oncontextmenu="return false;" style="border-radius: 12px; margin: 2rem 0; border: 1px solid var(--border); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);"><source src="${t}" type="video/${n}" /></video>`)),t}catch{return{html:`<p class="text-destructive">Error parsing markdown.</p>`,headings:[]}}},[e.content,o]),c=wn(i,s.html);return(0,M.useLayoutEffect)(()=>{let e=document.getElementById(`right-scroll-pane`);e&&e.scrollTo(0,0)},[e.id]),(0,N.jsxs)(`div`,{className:`w-full h-full flex flex-col items-center animate-in fade-in duration-500 pb-[30vh]`,children:[o.css&&(0,N.jsx)(`style`,{dangerouslySetInnerHTML:{__html:String(o.css)}}),(0,N.jsx)(`style`,{dangerouslySetInnerHTML:{__html:Sn}}),(0,N.jsxs)(`div`,{className:`w-full max-w-[80rem] px-6 lg:px-12 py-12 lg:py-16`,children:[(0,N.jsxs)(w,{variant:`ghost`,onClick:t,className:`lg:hidden mb-10 gap-2 -ml-4 text-muted-foreground hover:text-foreground`,children:[(0,N.jsx)(x,{className:`size-4`}),` Back to Lab`]}),(0,N.jsxs)(`div`,{className:`w-full max-w-5xl mb-12 pb-10 border-b border-border/30`,children:[(0,N.jsxs)(`div`,{className:`flex flex-col sm:flex-row sm:items-center gap-5 mb-6`,children:[(0,N.jsx)(`h1`,{className:`text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight max-w-5xl`,children:e.meta.title||e.id}),e.badgeUrl&&(0,N.jsx)(`img`,{src:e.badgeUrl,alt:`${e.id} badge`,className:`size-20 sm:size-24 object-contain drop-shadow-xl shrink-0`})]}),e.meta.description&&(0,N.jsx)(`p`,{className:`text-lg sm:text-xl text-muted-foreground mb-8 max-w-4xl leading-relaxed`,children:e.meta.description}),(0,N.jsxs)(`div`,{className:`flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-mono uppercase tracking-wider text-muted-foreground mb-8`,children:[e.category&&(0,N.jsx)(`span`,{className:`text-primary font-bold`,children:e.category}),e.meta.date&&(0,N.jsxs)(`span`,{className:`flex items-center gap-2`,children:[(0,N.jsx)(T,{className:`size-4`}),` `,e.meta.date]}),(e.meta.author||e.meta.role)&&(0,N.jsxs)(`span`,{className:`flex items-center gap-2`,children:[(0,N.jsx)(De,{className:`size-4`}),` `,e.meta.author||e.meta.role]})]}),(0,N.jsxs)(`div`,{className:`flex flex-wrap gap-4`,children:[Cn.map(({key:t,label:n,Icon:r,iconClass:i,resolve:a})=>{let o=a?a(e.meta[t]):e.meta[t];return o?(0,N.jsxs)(w,{variant:`outline`,className:`gap-2 rounded-full border-border/40 hover:bg-muted/30`,onClick:()=>window.open(o,`_blank`,`noopener,noreferrer`),children:[(0,N.jsx)(r,{className:i||`size-4`}),` `,n]},t):null}),e.category===`research`&&e.meta.bibtex&&(0,N.jsxs)(w,{variant:`outline`,className:`gap-2 rounded-full border-border/40 hover:bg-muted/30`,onClick:a,children:[n?(0,N.jsx)(E,{className:`size-4 text-green-500`}):(0,N.jsx)(we,{className:`size-4`}),n?`Copied to Clipboard`:`Cite (BibTeX)`]})]})]}),(0,N.jsxs)(`div`,{className:`w-full max-w-5xl flex flex-col xl:flex-row gap-12 relative items-start`,children:[(0,N.jsxs)(`div`,{className:`flex-1 w-full min-w-0`,children:[c.length>0&&(0,N.jsxs)(`details`,{className:`xl:hidden mb-10 rounded-2xl border border-border/40 bg-muted/10 px-5 py-4`,children:[(0,N.jsx)(`summary`,{className:`cursor-pointer text-xs font-bold uppercase tracking-widest text-muted-foreground`,children:`On this page`}),(0,N.jsx)(`nav`,{className:`mt-4 flex flex-col gap-3 border-l border-border/40 pl-4`,children:c.map(e=>(0,N.jsx)(`a`,{href:`#${e.id}`,className:`block break-words text-sm leading-snug text-muted-foreground ${e.level===2?`font-medium`:`ml-3`}`,children:e.text},e.id))})]}),(0,N.jsx)(`div`,{ref:i,className:`md prose prose-neutral dark:prose-invert w-full prose-headings:tracking-tight prose-a:text-primary`,style:{maxWidth:`none`},dangerouslySetInnerHTML:{__html:s.html||``}})]}),(0,N.jsxs)(`div`,{className:`hidden xl:block w-64 shrink-0 min-w-0 sticky top-12 self-start`,children:[(0,N.jsx)(`h4`,{className:`text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6`,children:`On this page`}),(0,N.jsx)(`nav`,{className:`md-toc flex flex-col gap-3 border-l border-border/40 pl-5 pr-1 max-h-[calc(100vh-9rem)] overflow-y-auto overscroll-contain`,children:c.length>0?c.map(e=>(0,N.jsx)(`a`,{href:`#${e.id}`,className:`block break-words text-sm leading-snug text-muted-foreground transition-colors hover:text-foreground ${e.level===2?`font-medium mt-2`:`ml-3`}`,children:e.text},e.id)):(0,N.jsx)(`span`,{className:`text-sm text-muted-foreground/50`,children:`No sections found.`})})]})]})]})]})};function En(){let e=b(),[t,n]=xe(),[r,i]=(0,M.useState)(null),[a,o]=(0,M.useState)([]),[s,c]=(0,M.useState)(``),[l,u]=(0,M.useState)(1),[d,f]=(0,M.useState)(!0);(0,M.useEffect)(()=>{let e=document.documentElement,t=()=>f(!e.classList.contains(`dark`));t();let n=new MutationObserver(t);return n.observe(e,{attributes:!0,attributeFilter:[`class`]}),()=>n.disconnect()},[]);let p=t.get(`tab`)||`research`;(0,M.useEffect)(()=>{o(xn())},[]),(0,M.useEffect)(()=>{u(1)},[p,s]);let m=e=>{n({tab:e}),i(null)},h=(0,M.useMemo)(()=>{let e=a.filter(e=>e.category===p);if(s.trim()){let t=s.toLowerCase().trim();e=e.filter(e=>{let n=(e.meta.title||``).toLowerCase().includes(t),r=(e.meta.description||``).toLowerCase().includes(t),i=(e.meta.tags||[]).some(e=>String(e).toLowerCase().includes(t));return n||r||i})}return e},[a,p,s]),g=Math.ceil(h.length/vn),ee=h.slice((l-1)*vn,l*vn);return(0,N.jsxs)(`div`,{className:`flex flex-col lg:flex-row h-screen w-full bg-background overflow-hidden animate-in fade-in duration-700`,children:[(0,N.jsxs)(`div`,{className:`w-full lg:w-[480px] xl:w-[550px] shrink-0 border-r border-border/30 flex flex-col h-full bg-background relative z-20 transition-all ${r?`hidden lg:flex`:`flex`}`,children:[(0,N.jsxs)(`div`,{className:`p-8 lg:p-10 border-b border-border/30 shrink-0 flex flex-col gap-8`,children:[(0,N.jsxs)(w,{variant:`ghost`,size:`sm`,className:`w-fit gap-2 text-muted-foreground hover:text-foreground -ml-4`,onClick:()=>e(`/`),children:[(0,N.jsx)(x,{className:`size-4`}),` Home`]}),(0,N.jsx)(`div`,{className:`flex items-center gap-6 border-b border-border/20 pb-1`,children:[`research`,`projects`,`journal`].map(e=>(0,N.jsx)(`button`,{onClick:()=>m(e),className:`text-sm font-medium tracking-wide uppercase transition-all duration-300 pb-2 border-b-2 relative top-[1px] ${p===e?`text-foreground border-foreground`:`text-muted-foreground border-transparent hover:text-foreground`}`,children:e},e))}),(0,N.jsxs)(`div`,{className:`relative w-full`,children:[(0,N.jsx)(Ee,{className:`absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60`}),(0,N.jsx)(`input`,{type:`text`,placeholder:`Search...`,value:s,onChange:e=>c(e.target.value),className:`w-full h-12 pl-10 pr-4 rounded-full border border-border/40 bg-muted/10 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/20 transition-all placeholder:text-muted-foreground/50`})]})]}),(0,N.jsx)(`div`,{className:`flex-1 overflow-y-auto flex flex-col`,children:ee.length===0?(0,N.jsxs)(`div`,{className:`w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-4 min-h-[300px]`,children:[(0,N.jsx)(O,{className:`size-12 stroke-1`}),(0,N.jsx)(`p`,{className:`text-sm font-medium`,children:`Nothing found matching your criteria.`})]}):ee.map(e=>{let t=r?.id===e.id;return(0,N.jsxs)(`div`,{onClick:()=>i(e),className:`group cursor-pointer py-10 px-8 lg:px-10 border-b border-border/20 transition-all duration-300 flex flex-col gap-4 ${t?`bg-muted/30`:`hover:bg-muted/10`}`,children:[(0,N.jsxs)(`div`,{className:`flex flex-col sm:flex-row sm:items-baseline justify-between gap-3`,children:[(0,N.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,N.jsx)(`h3`,{className:`font-bold text-2xl tracking-tight transition-colors duration-300 ${t?`text-primary`:`text-foreground/90 group-hover:text-primary`}`,children:e.meta.title||e.id}),e.badgeUrl&&(0,N.jsx)(`img`,{src:e.badgeUrl,alt:`Badge`,className:`size-8 object-contain drop-shadow-sm shrink-0`})]}),e.meta.date&&(0,N.jsx)(`span`,{className:`text-sm font-mono text-muted-foreground/60 shrink-0`,children:e.meta.date})]}),(0,N.jsx)(`p`,{className:`text-base leading-relaxed text-muted-foreground/80 max-w-md line-clamp-2`,children:e.meta.description||`No description provided.`}),(0,N.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-4 pt-2`,children:[(0,N.jsx)(`div`,{className:`flex flex-wrap gap-2`,children:e.meta.tags?.map(e=>(0,N.jsx)(`span`,{className:`text-[11px] px-3 py-1 rounded-full font-mono uppercase tracking-widest text-muted-foreground/80 bg-muted/30 border border-border/30 group-hover:border-border/60 transition-colors`,children:e},e))}),(0,N.jsx)(`div`,{className:`flex items-center gap-4 text-muted-foreground/60`,children:Cn.map(({key:t,label:n,Icon:r,iconClass:i,resolve:a})=>{let o=a?a(e.meta[t]):e.meta[t];return o?(0,N.jsx)(r,{"aria-label":n,className:`${i||`size-5`} opacity-60 hover:opacity-100 hover:text-foreground transition-all cursor-pointer`,onClick:e=>{e.stopPropagation(),window.open(o,`_blank`,`noopener,noreferrer`)}},t):null})})]})]},e.id)})}),g>1&&(0,N.jsxs)(`div`,{className:`p-6 lg:p-8 border-t border-border/30 shrink-0 flex items-center justify-between bg-background`,children:[(0,N.jsxs)(`span`,{className:`text-sm font-mono text-muted-foreground/60`,children:[`Page `,(0,N.jsx)(`span`,{className:`text-foreground`,children:l}),` of `,(0,N.jsx)(`span`,{className:`text-foreground`,children:g})]}),(0,N.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,N.jsx)(w,{variant:`ghost`,size:`icon`,onClick:()=>u(e=>Math.max(1,e-1)),disabled:l===1,className:`rounded-full size-10 text-muted-foreground hover:text-foreground hover:bg-muted/30`,children:(0,N.jsx)(D,{className:`size-5`})}),(0,N.jsx)(w,{variant:`ghost`,size:`icon`,onClick:()=>u(e=>Math.min(g,e+1)),disabled:l===g,className:`rounded-full size-10 text-muted-foreground hover:text-foreground hover:bg-muted/30`,children:(0,N.jsx)(Ce,{className:`size-5`})})]})]})]}),(0,N.jsx)(`div`,{id:`right-scroll-pane`,className:`flex-1 h-full overflow-y-auto relative bg-background/50 ${r?`block`:`hidden lg:block`}`,children:r?(0,N.jsx)(Tn,{entry:r,onBack:()=>i(null)}):(0,N.jsxs)(`div`,{className:`w-full h-full flex flex-col items-center justify-center relative overflow-hidden`,children:[(0,N.jsx)(`div`,{className:`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none`}),(0,N.jsx)(`div`,{className:`rotate-6 w-[500px] h-[600px] xl:w-[600px] xl:h-[700px] relative z-20 pointer-events-none flex items-center justify-center`,children:(0,N.jsx)(lt,{src:`/Portfolio//models/Flask.glb`,colored:!0,invertColor:d,autoRotate:!0,autoRotateSpeed:1,scale:3.8,className:`w-full h-full opacity-80 drop-shadow-xl mix-blend-screen`})})]})})]})}export{En as default};