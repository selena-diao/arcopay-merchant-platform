# ArcoPay 跨境支付商家管理平台

面向跨境支付平台运营团队的商家全链路管理系统，支持 MOR 大商户与 SOR 小商户双模式，覆盖主数据、合同、进件、支付配置、路由、资金结算全流程。数据持久化至真实数据库（Supabase），非原型演示。

个人下班时间自学项目，通过领域建模 + Vibe Coding（Bolt + Supabase）从0到1独立完成。

## 在线访问

| 环境 | 链接 |
|------|------|
| 生产环境 | https://arcopay-merchant-platform.vercel.app |
| GitHub | https://github.com/selena-diao/arcopay-merchant-platform |

## 技术栈

- **前端**：React + TypeScript + Tailwind CSS
- **数据库**：Supabase（PostgreSQL）
- **构建**：Vite　**部署**：Vercel　**开发工具**：Bolt

## 系统模块

| 模块 | 功能 |
|------|------|
| 主数据管理 | 平台主体、商家、渠道管理，含 KYB 记录（by 渠道独立表） |
| 合同管理 | 渠道合同 + 商户合同，完整状态机（DRAFT/ACTIVE/TERMINATED/VOIDED） |
| 进件管理 | 全流程状态追踪（DRAFT→SUBMITTED→REVIEWING→APPROVED/REJECTED），支持重新提交 |
| 商户号管理 | 进件通过后自动生成，api_key/secret_key 脱敏展示 |
| 支付配置 | 支付方式管理 + 应用支付配置，费率从合同层读取 |
| 路由管理 | 路由规则（权重校验）+ 路由策略（MANUAL/SMART） |
| 资金管理 | 费率差报表（倒挂预警，支持平台主体筛选）+ 渠道结算 + 商家结算，含对账状态机 |
| 平台管理 | 国家/币种维护，FK 规范化，消灭 string[] |

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
- 平台层 country/currency 全部规范化为关联表，消灭 string[]
- KYB by 渠道独立两表，消灭多态 FK
- 支付方式类型：CARD / DIGITAL_WALLET / BANK_TRANSFER / BNPL / CRYPTO

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
| `docs/支付系统领域v2.html` | 八层领域模型图 |
| `docs/标准er图_v3.html` | 完整 ER 图 |
| `docs/分层er图_v3.html` | 分层 ER 图 |
| `docs/状态机图_v2.svg` | 进件 / 合同 / 结算记录状态机 |
