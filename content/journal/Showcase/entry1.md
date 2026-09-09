---
title: "Showcase"
date: "Sep 2026"
role: "Architect"
description: "A change-ringing engine that models four tonnes of swinging bronze as a compound pendulum and treats the music itself as a walk through the symmetric group."
tags: ["Showcase", "Simulation", "Group Theory", "Audio"]
githuburl: "https://github.com"
demourl: "https://yourdemo.com"
---

Church bells are the loudest musical instrument most people never see. A ring of twelve is roughly **eleven tonnes of bronze** hung on plain bearings, swinging a full 360°, controlled by twelve people pulling on twelve ropes with about a second and a half of latency between intention and sound.[^1]

`Tenor` simulates that. Not the sound — sampling handles the sound — but the _mechanics_: the moment when a bell sits balanced mouth-up and a ringer decides whether to hold it there or let it go. Everything musical in change ringing comes out of that one decision, repeated some ten thousand times an hour.

The engine is ~~a toy~~ a teaching instrument. It runs at 240 Hz on a phone.

---

## The instrument

A bell does not hang from its crown. It is bolted to a headstock, the headstock carries a wheel, and the rope wraps around the wheel. Pulling the rope rotates the whole assembly through a full circle until the bell comes to rest upside down against a mechanical stay.

![A ring of twelve viewed from the ringing chamber ceiling](img1.webp)

### Some text here and there

The video below shows a single bell through one complete handstroke–backstroke cycle, slowed four times. Watch the rope: the ringer is doing almost nothing for most of the swing, and everything in the last fifteen degrees.

> The bell is rung by the ringer only in the sense that a sailing boat is moved by its crew. You are negotiating with something much larger than you, using a rope, in advance.

## The physics of a swinging bell

A bell is a compound pendulum, not a point mass. Its behaviour is governed by the moment of inertia $I$ about the bearing axis, the mass $m$, and the distance $d$ from the axis to the centre of mass. For small displacements the period is $T = 2\pi\sqrt{I / mgd}$ — but a full-circle bell never operates anywhere near small displacements, so that expression is useless in practice.

Writing the Lagrangian for the assembly gives us something we can actually integrate:

$$
\mathcal{L} = \frac{1}{2} I \dot{\theta}^2 + mgd\cos\theta
$$

which yields the equation of motion:

$$
I\ddot{\theta} + mgd\sin\theta = -c\,\dot{\theta} + \tau_{\text{rope}}(t)
$$

where $c$ is the bearing friction coefficient and $\tau_{\text{rope}}$ is the torque the ringer applies through the wheel. The rope torque is not constant: it depends on where the rope is currently tangent to the wheel, which itself depends on $\theta$.

For a bell swinging to a true amplitude $\theta_0$, the exact period is an elliptic integral:

$$
T(\theta_0) = 4\sqrt{\frac{I}{mgd}} \; K\!\left(\sin\frac{\theta_0}{2}\right), \qquad K(k) = \int_0^{\pi/2} \frac{d\varphi}{\sqrt{1 - k^2\sin^2\varphi}}
$$

This is the entire craft in one equation. As $\theta_0 \to \pi$ the period diverges, so a bell rung _closer to balance_ takes longer to come round. A ringer speeding up or slowing down is not pulling harder or softer in any direct sense — they are choosing an amplitude, and the elliptic integral converts that choice into a delay.[^2]

The solver runs a semi-implicit integrator over the state vector

$$
\mathbf{s} = \begin{pmatrix} \theta \\ \dot{\theta} \\ \phi \\ \dot{\phi} \end{pmatrix}, \qquad
J = \begin{pmatrix} 0 & 1 & 0 & 0 \\ -\omega_0^2\cos\theta & -c/I & k/I & 0 \\ 0 & 0 & 0 & 1 \\ k/m_r & 0 & -k/m_r & -c_r/m_r \end{pmatrix}
$$

with $\phi$ tracking the rope's own elastic stretch, which matters more than you would expect on the heavy bells.

---

## Method notation as permutations

The musical layer has nothing to do with physics. A **row** is a permutation of $n$ bells; a **change** is a transposition-set carrying one row to the next. On six bells the complete set of rows — an _extent_ — is all $6! = 720$ permutations, each rung exactly once.

Legal changes are constrained: a bell may move at most one position per row. So each change is a product of disjoint adjacent transpositions, and the space of methods is the set of Hamiltonian cycles on a particular subgraph of the Cayley graph of $S_n$.

A change acts as a permutation matrix. The cross change on four bells, swapping both pairs:

$$
X = \begin{pmatrix} 0 & 1 & 0 & 0 \\ 1 & 0 & 0 & 0 \\ 0 & 0 & 0 & 1 \\ 0 & 0 & 1 & 0 \end{pmatrix}, \qquad
X \cdot \begin{pmatrix} 1 \\ 2 \\ 3 \\ 4 \end{pmatrix} = \begin{pmatrix} 2 \\ 1 \\ 4 \\ 3 \end{pmatrix}
$$

Plain Bob Minor, the first method most ringers learn, has place notation `&-16-16-16,+12`. Expanded, one lead is:

$$
X \cdot 16 \cdot X \cdot 16 \cdot X \cdot 16 \cdot X \cdot 16 \cdot X \cdot 16 \cdot X \cdot 12
$$

Twelve changes, repeated five times, returns you to rounds — a _plain course_ of sixty rows. Getting all 720 requires calls that break the course structure at chosen points.

---

## Engine architecture

The simulation and the method logic are deliberately separate. Bells know nothing about music; the composer knows nothing about bronze. They meet at a scheduler that converts a desired strike time into a target amplitude and hands it to the ringer model.

```js {4-7} title=src/core/bell.js
export function stepBell(bell, dt) {
  const { theta, omega, I, mgd, friction } = bell;

  // The restoring torque vanishes at balance — this is why a bell
  // rung near theta = PI can be held almost indefinitely, and why
  // the integrator needs a small dt up there to stay stable.
  const restoring = -mgd * Math.sin(theta);
  const damping = -friction * omega;

  const alpha = (restoring + damping + bell.ropeTorque) / I;
  const nextOmega = omega + alpha * dt;

  return { ...bell, omega: nextOmega, theta: theta + nextOmega * dt };
}
```

The composer is pure and synchronous, which makes the whole method library testable without instantiating a single bell:

```js {3,9-11} title=src/music/method.js
export function* course(startRow, notation) {
  let row = [...startRow];
  for (const change of cycle(notation)) {
    row = applyChange(row, change);
    yield row;
  }
}

export function applyChange(row, places) {
  // Bells named in `places` stay put; everything else swaps in pairs.
  const next = [...row];
  for (let i = 0; i < row.length - 1; i++) {
    if (places.has(i + 1) || places.has(i + 2)) continue;
    [next[i], next[i + 1]] = [row[i + 1], row[i]];
    i++;
  }
  return next;
}
```

Place notation parsing is small enough to fit in a single grammar:

```ebnf title=src/music/notation.ebnf
method     = [ "&" ] block { "," block } ;
block      = change { separator change } ;
change     = "-" | "x" | "X" | places ;
places     = digit { digit } ;
separator  = "." | "" ;
digit      = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "0" | "E" | "T" ;
```

---

## Benchmark results

![Live Platform Demo](video1.webm)

Measured on the twelve at Liverpool, which is the worst case by a wide margin — the tenor alone is over four tonnes and needs a smaller timestep than everything else combined.

| Module                    | Render Time |            Status |
| :------------------------ | :---------: | ----------------: |
| **Bell integrator** (×12) |    3.1ms    |      Fixed 240 Hz |
| **Rope elasticity**       |    0.9ms    |  Heavy bells only |
| **Method composer**       |    0.2ms    |       Precomputed |
| **Strike scheduler**      |    1.4ms    |        Predictive |
| **Sample mixer**          |    6.7ms    | Web Audio worklet |
| **Rope rendering**        |    2.2ms    |         Instanced |

Sample data for the four heaviest rings in the model, weights given in the traditional hundredweight–quarter–pound notation:

| Tower               | Bells | Tenor weight | Approx. mass | Extent time |
| :------------------ | :---: | :----------- | -----------: | ----------: |
| Liverpool Cathedral |  12   | 82–0–11      |      4170 kg |           — |
| Exeter Cathedral    |  12   | 72–2–2       |      3685 kg |           — |
| St Paul's Cathedral |  12   | 61–3–2       |      3140 kg |           — |
| St Mary-le-Bow      |  12   | 41–3–21      |      2130 kg |           — |

An extent on twelve is left blank deliberately. $12! = 479{,}001{,}600$ rows at roughly four rows a second is about **thirty-eight years** of continuous ringing, which is outside the scope of the benchmark suite.[^3]

---

## Constraints and gotchas

:::note type=warning title="Timestep and the balance point"
The restoring torque goes to zero as $\theta \to \pi$, so a fixed timestep that is stable through the bottom of the swing will drift badly at the top. The integrator drops to a 960 Hz substep whenever $|\pi - \theta| < 0.15$ rad. Removing this makes bells appear to hold balance forever, which looks correct and is not.
:::

:::note type=info title="Why 240 Hz"
Human ringers perceive striking errors down to about 20 ms. A 60 Hz simulation quantises strike times to 16.7 ms, which sits right at that threshold and makes good ringing indistinguishable from mediocre ringing. 240 Hz puts the quantisation error safely below perception.
:::

:::note type=tip title="Start on six"
The method library ships with everything up to Surprise Maximus, but the physics is far more legible on six bells. Load `plain-bob-minor` with the tower set to `default-6` and slow the transport to 0.25× — you can watch a single bell's amplitude change one row before its strike position does.
:::

:::note type=danger title="Audio autoplay"
The mixer allocates its worklet on first user gesture. Calling `Tenor.mount()` during page load without a preceding interaction leaves the graph suspended, and the simulation will run silently with no error. Check `ctx.state === "running"` before reporting success.
:::

---

## Roadmap

- [x] Compound pendulum solver with rope elasticity
- [x] Place notation parser and method library
- [x] Predictive strike scheduler
- [ ] Odd-struckness modelling (each bell's individual strike offset)
- [ ] Multi-user ringing over WebRTC — the latency budget here is brutal
- [ ] Tower acoustics: a ringing chamber is not an anechoic space

Sources for the method definitions come from the [Central Council method library](https://github.com), and the bell weights from published tower records.

[^1]: The delay is not incidental. A bell struck _now_ was committed to roughly a second and a half ago, which means ringers are always playing to a prediction of where the other eleven bells will be, not where they are.

[^2]: This is also why bells cannot be rung quietly, or quickly stopped. The only variables available are amplitude and timing, and both are constrained by an equation with no elementary closed form.

[^3]: The longest peal actually rung is somewhat over 40,000 changes and took around a full day. Extents above eight bells are theoretical objects, not performances.
