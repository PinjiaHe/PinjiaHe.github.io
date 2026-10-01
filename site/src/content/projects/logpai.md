---
id: logpai
slug: logpai
visibility: public
title: LogPAI
summary: Open datasets and tools for AI-powered log analysis, from parsing raw logs to detecting system anomalies.
problem: Understanding system behavior requires turning large volumes of unstructured logs into useful evidence.
contribution: Reusable log datasets, parsing tools, and anomaly-detection benchmarks for researchers and practitioners.
themes:
  - ai-for-software-engineering
  - software-reliability
publicationIds:
  - drain-2017
  - log-anomaly-2016
  - loghub-2023
  - log-tools-2019
evidence: []
cover: /images/projects/logpai-ibm-drain.png
coverAlt: IBM's log anomaly dashboard showing event counts and anomaly scores for a log template from one network device.
coverCaption: IBM adapted Drain for network outage monitoring.
coverSourceUrl: https://developer.ibm.com/blogs/how-mining-log-templates-can-help-ai-ops-in-cloud-scale-data-centers/
coverLinkText: network outage monitoring
links:
  website: https://github.com/logpai
  datasets: https://github.com/logpai/loghub
sources:
  - https://github.com/logpai
  - https://logpai.com/
  - https://github.com/logpai/loglizer
  - https://developer.ibm.com/blogs/how-mining-log-templates-can-help-ai-ops-in-cloud-scale-data-centers/
sourceSnapshotDate: "2026-09-28"
---

## From logs to system insights

LogPAI brings together open datasets and software for automated log analysis. Its tools support the steps from structuring raw log messages to identifying unusual system behavior.

## Network outage monitoring at IBM

IBM selected Drain for log-template mining and extended it into Drain3 for its production pipeline. The [IBM case study](https://developer.ibm.com/blogs/how-mining-log-templates-can-help-ai-ops-in-cloud-scale-data-centers/) describes using logs from IBM Cloud network devices to detect changes in message frequency and identify potential network incidents. The image above shows anomaly detection for one log template from a single network device.

## Datasets, parsing, and anomaly detection

[Loghub](https://github.com/logpai/loghub) provides system log datasets for research. [Logparser](https://github.com/logpai/logparser) turns unstructured messages into structured events. [Loglizer](https://github.com/logpai/loglizer) implements machine-learning methods for log-based anomaly detection and provides benchmarking examples.

Loglizer accompanies the ISSRE 2016 paper *Experience Report: System Log Analysis for Anomaly Detection*, listed below. The [LogPAI website](https://logpai.com/) includes the broader publication history, and the [GitHub organization](https://github.com/logpai) provides access to the projects.
