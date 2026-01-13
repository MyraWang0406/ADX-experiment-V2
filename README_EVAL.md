# AI 自动复盘评测集

## 目录结构

```
cases/          # 输入测试用例（5个）
expected/       # 期望输出（5个）
actual/         # 实际输出（运行评测前需要生成）
scripts/eval.js # 评测脚本
```

## 使用方法

### 1. 生成实际输出

首先需要运行 AI 复盘功能，将输出保存到 `actual/` 目录：

```bash
# 示例：为每个 case 生成实际输出
# 实际使用时，需要调用 AI 复盘函数处理 cases/*.json，生成 actual/*.json
```

### 2. 运行评测

```bash
npm run eval
```

## 评测标准

### Schema 验证

- `conclusion`: 必须是字符串，至少50字符
- `evidence_paths`: 必须是字符串数组，每个路径必须可访问
- `recommended_actions`: 必须是对象数组，每个对象必须包含：
  - `action`: 字符串
  - `owner`: 字符串（算法/工程/运营/商业化）
  - `validation`: 字符串（至少10字符）

### 字段比较

1. **conclusion**: 检查长度和关键信息
2. **evidence_paths**: 
   - 检查是否包含所有期望路径
   - 验证路径在输入数据中可访问
3. **recommended_actions**:
   - 检查数量（至少与期望一致）
   - 检查 action、owner、validation 字段匹配度

## Case 说明

- **case_001**: 新用户年轻内容召回 - 成功案例
- **case_002**: 弱网场景目标重定义 - 成功案例
- **case_003**: 提高底价导致填充下降 - 部分成功，有风险
- **case_004**: OCPX 倍率波动 - 控制稳定性问题
- **case_005**: 质量过滤过严 - 失败案例

## 输出格式

评测脚本会输出：
- ✅ 通过的 case
- ❌ 失败的 case（包含具体差异）
- ⏭️ 跳过的 case（缺少文件）
- 📊 统计信息（通过率）

失败时会显示：
- Schema 错误
- 字段差异（路径、期望值、实际值、说明）







