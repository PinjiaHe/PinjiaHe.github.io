---
id: logpai
visibility: public
text:
  title: LogPAI
  summary: 提供用于人工智能驱动的日志分析的开放数据集与工具，涵盖从原始日志解析到系统异常检测的各个环节。
  problem: 理解系统行为，需要将大量非结构化日志转化为有用的证据。
  contribution: 为研究者与从业者提供可复用的日志数据集、解析工具和异常检测基准。
  coverAlt: IBM 日志异常仪表盘，显示单个网络设备中某一日志模板的事件数量与异常分数。
  coverCaption: IBM 对 Drain 进行了适配，将其用于网络故障监测。
  coverLinkText: 网络故障监测
---

<h2 id="from-logs-to-system-insights">从日志理解系统</h2>

LogPAI 汇集了用于自动化日志分析的开放数据集与软件。其工具覆盖从原始日志消息结构化，到识别异常系统行为的各个步骤。

<h2 id="network-outage-monitoring-at-ibm">IBM 的网络故障监测</h2>

IBM 选择 Drain 进行日志模板挖掘，并将其扩展为 Drain3，用于生产环境中的处理流程。[IBM 案例](https://developer.ibm.com/blogs/how-mining-log-templates-can-help-ai-ops-in-cloud-scale-data-centers/)介绍了如何利用 IBM Cloud 网络设备的日志，检测消息频率变化并识别潜在的网络故障。上图展示了对单个网络设备中某一日志模板进行异常检测的结果。

<h2 id="datasets-parsing-and-anomaly-detection">数据集、解析与异常检测</h2>

[Loghub](https://github.com/logpai/loghub) 提供用于研究的系统日志数据集。[Logparser](https://github.com/logpai/logparser) 将非结构化消息转换为结构化事件。[Loglizer](https://github.com/logpai/loglizer) 实现了基于日志进行异常检测的机器学习方法，并提供基准测试示例。

Loglizer 是下方所列 ISSRE 2016 论文 *Experience Report: System Log Analysis for Anomaly Detection* 的配套工具。[LogPAI 网站](https://logpai.com/)收录了更完整的论文记录，[GitHub 组织](https://github.com/logpai)提供各项目的访问入口。
