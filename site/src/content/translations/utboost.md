---
id: utboost
visibility: public
text:
  title: UTBoost
  summary: 增强用于评估编程智能体的测试，让通过基准测试更能反映修复是否正确。
  problem: 生成的补丁可能通过某个问题的现有测试，却没有解决其根本原因。
  contribution: 为 SWE-Bench 提供自动化测试增强与改进的评估解析器。
  evidence:
    - label: 识别出的错误补丁
      scope: ACL 2025 论文在 SWE-Bench Lite 与 Verified 上的评估中，此前被判定为通过的补丁
  coverAlt: UTBoost 架构图：在原有与增强测试用例上对比生成补丁和参考补丁，区分正确、错误与可疑结果。
  coverCaption: UTBoost 的测试增强与补丁评估流程。
---

<h2 id="what-does-a-passing-test-establish">通过测试能说明什么？</h2>

SWE-Bench 使用真实软件问题中的测试来评估补丁。这些测试可能遗漏相关情况，使错误的修复也被判定为通过。

<h2 id="testing-the-evaluation">检验评估本身</h2>

UTBoost 基于 UTGenerator 构建，后者通过分析 Python 项目及其依赖生成额外测试。UTBoost 对比生成补丁与参考补丁的行为，并改进了读取测试结果的解析器。

<h2 id="what-the-paper-reports">论文报告的结果</h2>

ACL 2025 论文报告的评估在 SWE-Bench Lite 与 Verified 中识别出 345 个此前被判定为通过的错误补丁。

[论文](https://aclanthology.org/2025.acl-long.189/)介绍了评估设计与局限。[已发布的工具包](https://github.com/CUHK-Shenzhen-SE/UTBoost)包含测试生成代码、增强后的测试及重新评估的说明。
