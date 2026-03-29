# ArcoPay 跨境支付商家管理平台

面向跨境支付平台运营团队的商家全链路管理系统，支持 MOR 大商户与 SOR 小商户双模式，覆盖主数据、合同、进件、支付配置、路由、交易流水、资金结算全流程。数据持久化至真实数据库（Supabase），非原型演示。

个人下班时间自学项目，通过领域建模 + Vibe Coding（Bolt + Supabase + LangGraph）从 0 到 1 独立完成。

## 在线访问

| 环境 | 链接 |
|------|------|
| 生产环境 | https://arcopay-merchant-platform.vercel.app |
| GitHub | https://github.com/selena-diao/arcopay-merchant-platform |

## 技术栈

- **前端**：React + TypeScript + Tailwind CSS
- **数据库**：Supabase（PostgreSQL）
- **AI Agent**：LangGraph + Kimi API，FastAPI 包装，部署于 Railway
- **构建**：Vite
- **部署**：Vercel + Railway
- **开发工具**：Bolt + Windsurf

## 系统模块

| 模块 | 功能 |
|------|------|
| 首页 Dashboard | 运营概览，按合同→进件→交易→结算业务链路分层展示，支持快速跳转 |
| 主数据管理 | 平台主体、商家、渠道管理，含 KYB 记录（by 渠道独立表） |
| 合同管理 | 渠道合同 + 商户合同，完整状态机，费率倒挂双层预警 |
| 进件管理 | 全流程状态追踪，支持重新提交 |
| 商户号管理 | 进件通过后自动生成，api_key / secret_key 脱敏展示 |
| 支付配置 | 支付方式管理 + 应用支付配置，费率从合同层读取 |
| 路由管理 | 路由规则（权重校验）+ 路由策略（MANUAL / SMART） |
| 交易流水 | 全量交易明细，支持按渠道 / 商家 / 状态 / 时间筛选 |
| 资金管理 | 费率差报表 + 渠道结算 + 商家结算，含完整对账流程和结算详情 |
| 平台管理 | 国家（ISO 3166-1）/ 币种维护 |

## 数据模型

八层领域模型，共 26 张表：

```
⓪ 平台层   Country  Currency
① 主体层   PlatformEntity  Merchant  MerchantEntity  KYBRecord×2
② 合同层   ChannelContract  MerchantContract  ContractPaymentMethod
③ 接入层   Onboarding  Application  MerchantAccount
④ 产品层   PaymentMethod  AppPaymentConfig  SettlementAccount
⑤ 路由层   ChannelPaymentMethod  RoutingRule  RoutingStrategy  关联表×3
⑥ 技术层   ChannelConfig  ChannelStatus
⑦ 资金层   Transaction  ChannelSettlementRecord  MerchantSettlementRecord
```

**核心建模决策**

- 费率数据主人在 `ContractPaymentMethod`，不在 `AppPaymentConfig`
- 进件重提新建记录，`parent_onboarding_id` 记录重提链路
- 合同作废触发级联冻结（进件→商户号），原子性执行
- 交易费率做快照，对账不依赖合同当前值
- KYB by 渠道独立两表，消灭多态 FK

## 结算差异诊断 Agent

### 为什么需要 Agent

在建模结算模块的过程中，发现渠道结算差异的排查是一个典型的**信息不对称 + 多表联查 + 经验推断**问题：

- 渠道不提供机读对账单，差异原因需要人工逐一核查
- 根因有规律可循（退款扣减、失败交易手续费、MOR/SOR 合并结算、汇率换算时间点不一致），但每次都要跨多张表比对
- 产品层能规避部分问题（如合同切换时的费率漏洞、时区边界），但渠道侧信息不透明的部分无法从源头消除

这是 Agent 的真实落点：**不是替代人工判断，而是把可枚举的推断过程自动化，让运营从"逐表查数据"变成"看结论做决策"**。

### 技术选型

选择 **LangGraph** 而非 Dify / 固定 workflow，原因是对账诊断需要循环推断——LLM 需要根据每一步的查询结果动态决定下一步查什么，直到定位根因或穷举所有假设。固定 DAG 不支持这种循环决策结构。

### 推断流程

```
输入 record_id
    ↓
获取结算记录基本信息
    ↓
LLM 动态决策：优先查哪个假设？
    ↓
循环调用 Tool 查数据 → 每个 Tool 返回结论（含数字校验）
    ↓
所有假设排除 → 渠道手动调账，需人工核实
已定位根因   → 输出诊断报告 + 建议处理方式
```

### 5 个诊断工具（Tool）

| Tool | 诊断假设 | 校验逻辑 |
|------|---------|---------|
| `tool_get_settlement_record` | 获取基本信息 | — |
| `tool_check_refund_impact` | 退款扣减 | 差异 ≈ 退款总额 × (1 − 费率) |
| `tool_check_failed_fee_impact` | 失败交易处理费 | 差异 ≈ FAILED 笔数 × 固定手续费（非比例） |
| `tool_check_mor_sor_mix` | MOR/SOR 合并结算 | 差异与合同费率差估算值误差 < 20% |
| `tool_check_currency_rate` | 汇率换算时间点不一致 | 存在非 USD 交易且差异比例 < 1% |

计算逻辑由 Python Tool 完成，LLM 只负责解读结论和表达，不参与数字运算。

### 5 个演示场景

| 记录 ID | 场景 | 差异特征 |
|---------|------|---------|
| csr-s2 | 退款扣减 | 差异 ≈ 退款总额 × (1 − 费率) |
| csr-s4 | MOR/SOR 合并结算 | 同渠道多合同，费率差导致差异 |
| csr-s5 | 失败交易处理费 | 差异极小，≈ FAILED 笔数 × $0.08 |
| csr-s6 | 汇率换算时间点不一致 | EUR 交易，差异 < 1% 总额 |
| csr-s7 | 渠道手动调账（兜底） | 穷举所有假设均不吻合，需人工核实 |

### 前台集成

诊断入口嵌在结算详情页差异区块，状态为 `IN_RECONCILIATION` 且存在差异时显示「AI 诊断」按钮。诊断结果持久化到 `dispute_history jsonb`，切换 Tab 不丢失。

运营需对诊断结果表态后才能执行后续流转：
- **接受诊断** → 直接解锁流转按钮
- **否定诊断** → 必须填写人工判断 → 解锁（否定记录可作为未来 Agent 训练数据）

AI 诊断是 `IN_RECONCILIATION` 状态下的辅助动作，不改变结算状态机，不是状态机节点。

## 渠道供应商

| 渠道 | 模式 | 主要覆盖 |
|------|------|---------|
| Adyen | MOR 大商户 | 全球 |
| Stripe | MOR 大商户 | 全球 |
| Checkout.com | MOR 大商户 | 全球 |
| Xendit | SOR 小商户 | PH / ID / MY / TH / SG |
| 2C2P | SOR 小商户 | SG / HK / TH / MY |
| Airwallex | SOR 小商户 | CN / HK / SG |

## 建模产出物

| 文件 | 说明 |
|------|------|
| `docs/支付系统领域v3.html` | 八层领域模型图 |
| `docs/分层er图_v3.html` | 分层 ER 图 |
| `docs/状态机图_v4.svg` | 进件 / 合同 / 商户号 / 结算记录状态机（含 AI 诊断辅助动作备注） |