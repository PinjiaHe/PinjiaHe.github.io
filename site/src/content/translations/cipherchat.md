---
id: cipherchat
visibility: public
text:
  title: CipherChat
  summary: 评估语言模型在密文对话中能否保持安全，揭示自然语言之外的安全对齐缺口。
  problem: 语言模型能够理解编码文本，但安全训练往往集中于普通语言。
  contribution: 构建评估框架，研究安全对齐能否泛化到密文对话，并开展中英文实验。
  coverAlt: 对比示意图：模型在自然语言对话中拒绝回答，却在密文对话中给出不安全回复。
  coverCaption: 通过编码文本与 GPT 对话，再解码其回复。
---

<h2 id="safety-beyond-ordinary-language">普通语言之外的安全性</h2>

安全训练往往聚焦于自然语言交互。CipherChat 研究这些安全措施能否同样适用于语言模型仍然能够理解的编码对话。

<h2 id="evaluating-the-gap">评估安全缺口</h2>

该研究在中英文环境下，围绕 11 个安全领域评估了 GPT-3.5 Turbo 和 GPT-4。结果发现，被测模型理解密文的能力并不总能伴随安全的回复，因此有必要评估普通语言之外的安全性。这些结论适用于 ICLR 2024 论文中评估的模型版本与实验设置。

<h2 id="explore-the-work">了解这项研究</h2>

[论文](https://proceedings.iclr.cc/paper_files/paper/2024/hash/ed4c38fe7899d3653acf39b2102af8ba-Abstract-Conference.html)介绍了评估与分析，[官方仓库](https://github.com/RobustNLP/CipherChat)提供了研究代码与数据。
