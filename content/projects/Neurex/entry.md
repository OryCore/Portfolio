---
title: "Neurex AI"
date: "Jan 2023"
role: "Engineer"
description: "A five-stage math pipeline that reads price as a noisy signal instead of a prediction problem."
tags: ["Showcase", "Signal Processing", "Machine Learning", "Finance"]
demourl: "https://tradescove.com"
---

There's no LLM anywhere in Neurex. It's a deterministic pipeline: reconstruct the signal, derive a few independent readings of it, compare against learned structure, filter, then let a small reinforcement-learning model decide whether to reject the setup. Most attempts at this ask a model to predict price, which is close to unlearnable.

A price chart is a noisy signal, and cleaning up noisy signals is a solved problem in other fields. The human behavior that creates the noise (panic, hesitation, chasing a move) leaves structure behind, and structure is learnable even when the underlying event isn't predictable.

---

## The pipeline

```
raw price ──▶ reconstruct ──▶ derive ──▶ compare ──▶ filter ──▶ decide
              (zero-lag)     (indicator   (custom     (engineering  (RL: reject
                              series)      KNN)        + trading     or pass)
                                                        filters)
```

Five stages, each narrowing the candidate set. Stages 2 through 4 define a candidate zone by overlap; stage 5 is the only one that gets a vote on whether a signal actually fires.

---

## Why the distance metric matters

Standard distance metrics impose a fixed geometry on the comparison. Euclidean distance treats every direction the same, which is fine for a static space but wrong for one where volatility itself is shifting underneath you.

In general form, a weighted distance between two points $x, y \in \mathbb{R}^n$ is

$$
d(x, y) = \sqrt{\sum_{i=1}^{n} w_i(t) \, (x_i - y_i)^2}
$$

where the weights $w_i(t)$ are fixed in a standard KNN and time-varying here, adapting to the current volatility regime rather than to a static training-time snapshot. The actual weighting function is where the real work is, and that part isn't public.

```python
# illustrative only, not the real weighting function
def adaptive_distance(x, y, regime_weights):
    return sum(w * (xi - yi) ** 2 for xi, yi, w in zip(x, y, regime_weights)) ** 0.5
```

---

## Filter stack

Every stage gets a filter tuned to what it's actually looking at. Some of these come from trading (multi-EMA and similar), and some are borrowed from signal-processing disciplines that deal with much higher-stakes noise, aerospace telemetry and rocketry guidance being two of them. None of that is exotic on its own; the value is in how the stages are layered and handed off to each other.

:::note type=info title="Why borrow filters from aerospace"
A rocket's guidance system can't afford to smooth a signal at the cost of delay, since delay is the one thing you can't get back mid-flight. That constraint (clean the signal without lagging behind it) turns out to map onto trading almost exactly, which is why some of the filter math is closer to a telemetry stack than to anything in a typical trading toolkit.
:::

---

## Testing

Two-phase validation: a historical backtest, then continuous live forward-testing over an extended period on selected pairs, with no post-hoc adjustment to signals once they've fired.

| Metric      | Backtest  | Live forward test     |
| ----------- | --------- | --------------------- |
| Win rate    | >90%      | 87.98%                |
| Sample size | 4000+     | 1000+                 |
| Duration    | 84 months | 36 months, continuous |

:::note type=yellow title=""
Figures shown are internal, representative test results for illustrative purposes only. They reflect specific instruments, time periods and configurations, and are not a forecast or guarantee of future results. Past performance does not indicate future performance. Nothing on this page is financial advice, an offer, or a solicitation to trade. Trading carries risk of loss.
:::
