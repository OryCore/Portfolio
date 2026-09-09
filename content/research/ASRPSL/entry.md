---
title: "Annotated Surrogate Retrieval for Polish Statutory Law"
date: "Sep 2026"
role: "Author"
description: "Three retrieval designs for Polish statutory law built on document surrogates, evaluated against fourteen baselines and four controls on 300 Polish bar exam questions over 82,508 articles."
tags: ["Research", "Information Retrieval", "NLP", "Legal Tech"]
githuburl: "https://github.com/OryCore/Research/tree/master/Annotated%20Surrogate%20Retrieval%20for%20Polish%20Statutory%20Law"
paperurl: https://arxiv.org/abs/2608.30929
researchgateurl: https://www.researchgate.net/publication/413832839
doi: 10.48550/arXiv.2608.30929
---

Given a legal question in Polish, the task is to find the one statutory article that governs it, out of 82,508 candidates. Not a set of plausible articles, the article, since the downstream generator is graded on what it puts at rank one.

The core idea is document surrogates: instead of only matching a question against the raw statutory text, I attach language-model-generated annotations to each article at index time, a summary, a theme, a concept set, and a handful of hypothetical questions the article would answer, and retrieve against those alongside the text itself.

---

## Three designs, one frontier

I built three systems that sit at different points on the cost-quality tradeoff:

- **ASCR** matches against surrogate fields in two cascaded stages (act-level, then article-level), then reranks the top candidates with one listwise model call.
- **ASCR-H** adds a dense retrieval branch fused into that cascade before reranking, which runs concurrently with the other calls so it costs no extra latency.
- **DTF** drops both language-model stages entirely. Three retrievers (dense, lexical over the text, lexical over the surrogate questions) get fused with weighted reciprocal rank fusion, then re-scored with a deterministic prior that exploits the act named in the question. No model call before generation.

Rank fusion across the three retrievers in DTF uses weighted reciprocal rank fusion:

$$
s_{\text{RRF}}(a) = \sum_i \frac{w_i}{k_0 + \text{rank}_{R_i}(a)}, \qquad k_0 = 20
$$

and lexical matching throughout the paper is BM25:

$$
\text{BM25}(q, x) = \sum_{t \in q} \text{idf}(t)\,\frac{f_{t,x}(k_1+1)}{f_{t,x} + k_1\left(1 - b + b\frac{|x|}{\overline{|x|}}\right)}
$$

with the standard defaults, $k_1 = 1.2$, $b = 0.75$.

---

## What actually happened

Evaluated against fourteen baselines and four controls (oracle, closed-book, random, and a "correct act but random article" control) on 300 questions drawn from the 2024 and 2025 Polish bar exam, over paired McNemar tests:

| Configuration              | Hit@1  | Hit@20 | Citation acc. | Median latency |
| -------------------------- | ------ | ------ | ------------- | -------------- |
| ASCR-H                     | 72.3%  | 84.5%  | 67.3%         | 7.8 s          |
| DTF                        | 51.9%  | 86.0%  | 70.3%         | 0.82 s         |
| BM25 (raw)                 | 61.7%  | 79.2%  | 66.0%         | 0.73 s         |
| Dense retrieval            | 52.3%  | 72.7%  | 61.7%         | 0.73 s         |
| Oracle (ceiling)           | 100.0% | 100.0% | 70.3%         | —              |
| Closed-book (no retrieval) | 0.0%   | 0.0%   | 47.0%         | 0.67 s         |

ASCR-H wins at rank one by a wide margin, significant against every non-oracle configuration except one of its own ablations. That lead disappears by a cutoff of ten, and DTF overtakes on point estimate from twenty onward while running at about a ninth of the latency and less than half the cost.

:::note type=info title="Reranking is the whole story at rank one"
Removing the reranking stage alone drops Hit@1 from 72.3% to 44.7%, a 27.6-point swing, nearly three times the next largest effect from any other component I tested. Everything else (query analysis, dense fusion, the concept-matching term) matters, but reranking is what actually orders the head of the list.
:::

:::note type=warning title="Rank-one gains don't reach the generated answer"
This was the most surprising result. ASCR-H leads every ranking metric, but its citation accuracy (67.3%) is statistically indistinguishable from plain BM25 (66.0%) and from DTF (70.3%, which actually scores higher and matches the oracle ceiling). What predicts whether the generator cites the right article correctly isn't where it sits in the list, it's whether it's in the context window at all.
:::

:::note type=purple title="Near-miss context is worse than no context"
A control that supplies the correct act but a random article within it scores 0.4% Hit@1 and 37.7% citation accuracy, nine points below a control that gets no context at all. A plausible but wrong provision actively displaces correct answers the model already had from its own training. Retrieval that's close but wrong isn't a lesser version of helpful, it's actively harmful.
:::

## Three things that didn't work

Lemmatisation, pseudo-relevance feedback, and query rewriting all failed to improve retrieval on this task, each for a different reason: exam questions already quote statutory language closely, so there's little surface-form mismatch to fix; feedback expansion widens the candidate pool but disorders the head, which is the only part that's scored; and rewriting adds a full model call and roughly a second of latency for no measurable gain.

---

## Reading it

The benchmark, per-question outputs, and paired significance tests are public on GitHub. The paper itself is on arXiv.

- **Paper (arXiv):** [arxiv.org/abs/2608.30929](https://arxiv.org/abs/2608.30929)
- **ResearchGate:** [researchgate.net/publication/413832839](https://www.researchgate.net/publication/413832839_Annotated_Surrogate_Retrieval_for_Polish_Statutory_Law)
- **Code, benchmark & results:** [github.com/OryCore/Research](https://github.com/OryCore/Research/tree/master/Annotated%20Surrogate%20Retrieval%20for%20Polish%20Statutory%20Law)
- **DOI:** [10.48550/arXiv.2608.30929](https://doi.org/10.48550/arXiv.2608.30929)
