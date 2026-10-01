---
id: utboost
slug: utboost
visibility: public
title: UTBoost
summary: Strengthening the tests used to evaluate coding agents, so that passing a benchmark better reflects a correct repair.
problem: A generated patch can pass an issue's existing tests while leaving the underlying problem unresolved.
contribution: Automated test augmentation and a refined evaluation parser for SWE-Bench.
themes:
  - software-engineering-for-ai
  - software-reliability
publicationIds:
  - utboost-2025
evidence:
  - label: Erroneous patches identified
    value: "345"
    scope: Patches previously labeled as passing in the ACL 2025 paper's SWE-Bench Lite and Verified evaluation
    sourceUrl: https://aclanthology.org/2025.acl-long.189/
cover: /images/projects/utboost-figure-2.png
coverAlt: UTBoost architecture comparing generated and ground-truth patches on original and augmented test cases, with correct, incorrect, and suspicious outcomes.
coverCaption: "UTBoost's test augmentation and patch evaluation workflow."
links:
  paper: https://aclanthology.org/2025.acl-long.189/
  code: https://github.com/CUHK-Shenzhen-SE/UTBoost
sources:
  - https://aclanthology.org/2025.acl-long.189/
  - https://aclanthology.org/2025.acl-long.189.pdf
  - https://github.com/CUHK-Shenzhen-SE/UTBoost
sourceSnapshotDate: "2026-09-28"
---

## What does a passing test establish?

SWE-Bench evaluates patches against tests drawn from real software issues. Those tests can miss relevant cases, allowing an incorrect repair to receive a passing result.

## Testing the evaluation

UTBoost builds on UTGenerator, which analyzes a Python project and its dependencies to create additional tests. It compares the behavior of a generated patch with the reference patch and improves the parser that reads test results.

## What the paper reports

The evaluation reported in the ACL 2025 paper identified 345 erroneous patches previously marked as passing across SWE-Bench Lite and Verified.

Read the [paper](https://aclanthology.org/2025.acl-long.189/) for the evaluation design and limitations. The [released toolkit](https://github.com/CUHK-Shenzhen-SE/UTBoost) includes test-generation code, augmented tests, and instructions for re-evaluation.
