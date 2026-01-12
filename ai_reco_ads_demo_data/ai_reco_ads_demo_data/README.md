# AI 搜广推 Demo 数据（档位2 / 非生产）

本目录包含 3 个“可讲故事”的实验快照数据，用于前端 Dashboard：
- Pipeline Map（瓶颈高亮）
- 漏斗 + 损耗
- 画风分布（类目/标签）
- TopN 模拟信息流
- 拍卖监控（bid/price/win_rate）
- OCPX 曲线（multiplier/CPA/spend）
- 原因树诊断（分层/原因码）

## 文件说明
- index.json：数据集索引与字典（类目、标签、召回源、人群、reason code）
- schema.json：experiment_report 的 schema 提示
- experiments/exp_001.json：新增召回 → 画风修复
- experiments/exp_002.json：目标重定义 → 弱网完播提升
- experiments/exp_003.json：floor+pacing → fill 下滑，拍卖卡点定位

## 使用方式（建议）
前端：
- 直接将 index.json 与 experiments/*.json 作为 mock API 返回
- 或者本地静态加载（Next.js public/）

LLM 自动复盘：
- 将某个 experiments/exp_00x.json 作为上下文输入
- 让模型输出：目标体系、结论、偏差原因、下一步建议