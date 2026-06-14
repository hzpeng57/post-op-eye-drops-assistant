# 术后滴眼液助手

Post-Op Eye Drops Assistant 是一个本地优先的 Next.js Web App，用来帮助近视手术患者在恢复期完成复杂滴眼液流程。当前版本不需要后端，所有计划、完成记录和进行中的流程都保存在浏览器 LocalStorage。

## 功能

- 首次启动设置恢复计划开始日期
- 自动计算术后第 N 天
- 自动执行默认用药方案：
  - 左氧氟沙星：每天 4 次，仅术后前 5 天
  - 氟米龙：第 1-3 天 8 次，每 3 天减少 1 次，最低 0 次
  - 小牛血去蛋白提取物眼用凝胶：每天 4 次
  - 玻璃酸钠滴眼液：每天 4 次
- 固定滴药顺序：左氧氟沙星 → 氟米龙 → 小牛血 → 玻璃酸钠
- 药物间默认等待 5 分钟，可在 3-15 分钟间调整
- 首页只回答“现在该做什么”
- 引导式单步滴药流程和等待倒计时
- 今日时间轴、药物状态、历史统计和设置页
- PWA manifest 与 service worker，可添加到桌面
- 预留 NotificationJob 和 NotificationService，用于未来接 Browser Notification、Web Push、iOS PWA Push、Android Push

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui 风格组件
- Vitest
- LocalStorage

## 开发

```bash
npm install
npm run dev
```

打开 http://localhost:3000。

## 验证

```bash
npm test
npm run typecheck
npm run build
```

## 架构

```text
src/lib/default-plan.ts      默认药物和治疗计划
src/lib/schedule-engine.ts   术后天数、频次、减药、合并排班
src/lib/progress.ts          完成率和漏滴统计
src/lib/storage.ts           schema-versioned LocalStorage 适配器
src/lib/notifications.ts     NotificationJob 生成与通知服务接口
src/lib/example-data.ts      演示用治疗计划、日计划和完成记录
src/hooks/use-treatment-state.ts
                             客户端状态和流程动作
src/components               产品界面和 shadcn/ui 风格组件
```

排班引擎是纯 TypeScript，未来接 Supabase 时可以把 `storage.ts` 替换为远端仓库；未来接推送时实现 `NotificationService` 并消费 `buildNotificationJobs()` 输出即可。

## 数据模型

核心类型在 `src/types.ts`：

- `Medication`
- `TreatmentPlan`
- `ScheduleItem`
- `ScheduleStep`
- `DoseRecord`
- `DailyPlan`
- `NotificationJob`
- `ProgressSummary`

日期使用本地日期字符串标识日计划，具体用药时间使用带时区偏移的 ISO 字符串。
