---
id: cipherchat
slug: cipherchat
visibility: public
title: CipherChat
summary: Evaluating whether language models remain safe when conversations use ciphers, revealing gaps in safety alignment beyond natural language.
problem: Language models can understand encoded text even when their safety training is concentrated on ordinary language.
contribution: A framework for evaluating how safety alignment generalizes to cipher-based conversations, with experiments in English and Chinese.
themes:
  - software-engineering-for-ai
publicationIds:
  - cipherchat-2024
evidence: []
githubStars:
  count: 630
  sourceUrl: https://github.com/RobustNLP/CipherChat
  retrievedAt: "2026-09-28"
cover: /images/projects/cipherchat.jpg
coverAlt: Diagram contrasting a model's refusal in a natural-language conversation with an unsafe response in a cipher-based conversation.
coverCaption: Communicating with GPT through ciphered text, then decoding its replies.
links:
  website: https://llmcipherchat.github.io/
  paper: https://proceedings.iclr.cc/paper_files/paper/2024/hash/ed4c38fe7899d3653acf39b2102af8ba-Abstract-Conference.html
  code: https://github.com/RobustNLP/CipherChat
sources:
  - https://llmcipherchat.github.io/
  - https://proceedings.iclr.cc/paper_files/paper/2024/hash/ed4c38fe7899d3653acf39b2102af8ba-Abstract-Conference.html
  - https://arxiv.org/html/2308.06463v2
  - https://github.com/RobustNLP/CipherChat
sourceSnapshotDate: "2026-09-27"
---

## Safety beyond ordinary language

Safety training often focuses on natural-language interactions. CipherChat asks whether those safeguards extend to encoded conversations that a language model can still understand.

## Evaluating the gap

The study evaluated GPT-3.5 Turbo and GPT-4 across 11 safety domains in English and Chinese. It found that the tested models' ability to understand ciphers did not consistently come with safe responses, motivating safety evaluation beyond ordinary language. These findings describe the model versions and settings evaluated in the ICLR 2024 paper.

## Explore the work

The [paper](https://proceedings.iclr.cc/paper_files/paper/2024/hash/ed4c38fe7899d3653acf39b2102af8ba-Abstract-Conference.html) presents the evaluation and analysis. The [official repository](https://github.com/RobustNLP/CipherChat) provides the research code and data.
