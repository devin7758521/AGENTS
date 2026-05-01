# README一致性与风险审查（2026-05-01）

## 结论
- 主体功能基本按 README 实现：Dashboard、Trace、Debug、Replay、Analyzer、Matrix、Risk、Publish API 均可在代码中找到。
- 存在若干关键风险：去重逻辑当前几乎失效、半自动模式配置未真正生效、冷却单位与配置语义可能不一致、X 发布为占位实现。

## 主要偏差与风险点
1. **去重规则无法命中（高风险）**
   - 风控去重依赖 `history[].contentHash`，但写入 history 时未保存 `contentHash`，导致重复内容检测几乎始终 miss。
2. **semi-auto 配置未从设置读取（中高风险）**
   - `trace.mode` 被硬编码为 `semi-auto`，未使用 KV settings 的 mode；配置与运行行为可能不一致。
3. **cooldown 单位语义可能错误（中风险）**
   - matrix 字段名为 `cooldown`，默认值看起来像“分钟”，但代码按秒乘以 1000 处理，可能比预期快 60 倍。
4. **X 发布并非真实接口（中风险）**
   - `publishToX` 仅返回模拟结果，`tokenUsed` 仅基于 token 字段是否存在，不代表真实调用成功。
5. **熔断策略偏粗（中风险）**
   - 仅统计最近 N 条失败，不区分时间窗口与错误类型，容易误触发或漏触发。
6. **API 输入校验较弱（中风险）**
   - `/api/matrix` PUT 直接写入 KV，缺少 schema 校验与范围检查。

## 与 README 对齐情况速览
- Dashboard：已实现 `/public/index.html`
- Trace：有 traceId 与步骤记录，含 `/api/trace?id=`
- Debug：已实现 `/api/debug`
- Replay：已实现 `/api/replay`，支持 `dryRun`
- Analyzer：已实现 `/api/analyze` 并输出统计/瓶颈/建议
- Matrix：有多账号字段与选择逻辑
- 风控：有限流/去重/熔断/高频检测框架
- 发布：X 为占位；小红书/抖音为 draft
