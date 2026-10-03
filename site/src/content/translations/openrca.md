---
id: openrca
visibility: public
text:
  title: OpenRCA
  summary: 评估语言模型如何基于系统遥测数据进行推理，定位软件故障的根因。
  problem: 诊断故障需要关联日志、指标、追踪数据和系统依赖关系中的证据。
  contribution: 提供根因分析基准，以及使用 Python 检索和分析遥测数据的智能体基线。
  evidence:
    - label: 已被 Anthropic 和 Microsoft 使用
      text: Anthropic 使用作者提供的评测框架和基准官方评分方法，在 OpenRCA 上评估了 Claude Opus 4.6。
  coverAlt: Anthropic 的 OpenRCA 评估图表，对比 Claude Opus 4.6、Opus 4.5 和 Sonnet 4.5。
  coverCaption: OpenRCA 用于 Anthropic 2026 年 2 月的 Claude Opus 4.6 评估。
  coverLinkText: Claude Opus 4.6
---

<h2 id="a-question-about-software-operations">软件运维中的一个问题</h2>

语言模型能否将软件故障的表现与其根因联系起来？OpenRCA 将这个问题置于软件运维场景中：模型需要利用遥测数据回答自然语言请求，而不能仅依赖提示词。

<h2 id="reasoning-across-evidence">综合多种证据进行推理</h2>

该基准整合了 KPI 时间序列、依赖关系追踪数据与日志。其 RCA-agent 基线使用 Python 检索与分析数据，让模型能够处理大量遥测数据，而无需将每条记录都放入上下文。

<h2 id="explore-the-work">了解这项研究</h2>

[官方仓库](https://github.com/microsoft/OpenRCA)提供了基准、基线与复现说明。相关论文发表于 ICLR 2025。
