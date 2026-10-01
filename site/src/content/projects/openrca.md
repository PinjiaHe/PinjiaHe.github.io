---
id: openrca
slug: openrca
visibility: public
title: OpenRCA
summary: Evaluating how language models reason over system telemetry to locate the causes of software failures.
problem: Diagnosing a failure requires connecting evidence across logs, metrics, traces, and system dependencies.
contribution: A root cause analysis benchmark and an agent baseline that uses Python to retrieve and analyze telemetry.
themes:
  - ai-for-software-engineering
  - software-reliability
publicationIds:
  - openrca-2025
evidence:
  - kind: industry-use
    label: Used by Anthropic and Microsoft
    text: Anthropic evaluated Claude Opus 4.6 on OpenRCA using the authors' harness and the benchmark's official scoring method.
    sourceUrl: https://www.anthropic.com/news/claude-opus-4-6
    asOf: "2026-02-05"
    organizations:
      - name: Anthropic
        logo: anthropic
        sourceUrl: https://www.anthropic.com/news/claude-opus-4-6
      - name: Microsoft
        logo: microsoft
        sourceUrl: https://microsoft.github.io/OpenRCA/
cover: /images/projects/openrca.png
coverAlt: Anthropic's OpenRCA evaluation chart comparing Claude Opus 4.6, Opus 4.5, and Sonnet 4.5.
coverCaption: OpenRCA in Anthropic's Claude Opus 4.6 evaluation, February 2026.
coverSourceUrl: https://www.anthropic.com/news/claude-opus-4-6
coverLinkText: Claude Opus 4.6
links:
  website: https://microsoft.github.io/OpenRCA/
  code: https://github.com/microsoft/OpenRCA
  paper: https://openreview.net/forum?id=M4qNIzQYpd
sources:
  - https://microsoft.github.io/OpenRCA/
  - https://www.anthropic.com/news/claude-opus-4-6
  - https://github.com/microsoft/OpenRCA
  - https://pinjiahe.github.io/publications/
sourceSnapshotDate: "2026-09-28"
---

## A question about software operations

Can a language model connect the symptoms of a software failure to its underlying cause? OpenRCA places this question in a software operations setting, where a natural-language request must be answered using telemetry rather than the prompt alone.

## Reasoning across evidence

The benchmark brings together KPI time series, dependency traces, and logs. Its RCA-agent baseline uses Python for data retrieval and analysis, allowing the model to work with substantial telemetry without putting every record into its context.

## Explore the work

The [official repository](https://github.com/microsoft/OpenRCA) provides the benchmark, baseline, and reproduction instructions. The associated paper appeared at ICLR 2025.
