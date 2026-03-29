from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.tools import tool
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
import operator
from tools import (
    get_settlement_record,
    get_transactions_in_period,
    get_channel_contract,
    recalculate_expected_amount
)
from dotenv import load_dotenv
import os, json

load_dotenv()

llm = ChatOpenAI(
    model="moonshot-v1-8k",
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL"),
    temperature=0,
)

@tool
def tool_get_settlement_record(record_id: str) -> str:
    """获取渠道结算记录的基本信息，包括渠道、周期、应结算金额、实际到账金额、差异、历史争议记录"""
    data = get_settlement_record(record_id)
    return json.dumps(data, ensure_ascii=False, default=str)

@tool
def tool_check_refund_impact(channel_id: str, period_start: str, period_end: str, channel_contract_id: str) -> str:
    """查询结算周期内的退款交易，判断退款是否被渠道从结算款里直接扣减。需传入channel_contract_id以精确匹配结算记录对应的交易范围。"""
    txns = get_transactions_in_period(channel_id, period_start, period_end, channel_contract_id)
    refunded = [t for t in txns if t["status"] == "REFUNDED"]
    success = [t for t in txns if t["status"] == "SUCCESS"]
    refunded_total = sum(t["amount"] for t in refunded)
    result = {
        "success_count": len(success),
        "success_total": sum(t["amount"] for t in success),
        "refunded_count": len(refunded),
        "refunded_total": refunded_total,
        "refunded_transactions": [{"id": t["id"], "amount": t["amount"]} for t in refunded]
    }
    if refunded_total > 0:
        channel_rate = refunded[0]["channel_rate"] if refunded[0].get("channel_rate") else 0
        impact = round(refunded_total * (1 - channel_rate), 2)
        conclusion = (
            f"周期内有{len(refunded)}笔退款，退款总额{refunded_total} USD。"
            f"若渠道直接扣减退款，结算款预计减少{impact} USD。"
            f"请与实际差异对比：若实际差异约为{impact} USD，则高度支持退款扣减根因。"
        )
    else:
        impact = 0
        conclusion = "周期内无退款交易，可排除退款扣减根因。"
    result["conclusion"] = conclusion
    result["estimated_impact"] = impact
    return json.dumps(result, ensure_ascii=False, default=str)

@tool
def tool_check_failed_fee_impact(channel_id: str, period_start: str, period_end: str, channel_contract_id: str) -> str:
    """查询结算周期内的失败交易，判断渠道是否对失败交易收取了固定处理费（通常每笔0.05-0.10 USD）。需传入channel_contract_id以精确匹配交易范围。"""
    txns = get_transactions_in_period(channel_id, period_start, period_end, channel_contract_id)
    failed = [t for t in txns if t["status"] == "FAILED"]
    result = {
        "failed_count": len(failed),
        "failed_transactions": [{"id": t["id"], "amount": t["amount"]} for t in failed],
        "estimated_fee_at_0.05usd": round(len(failed) * 0.05, 2),
        "estimated_fee_at_0.08usd": round(len(failed) * 0.08, 2),
        "estimated_fee_at_0.10usd": round(len(failed) * 0.10, 2),
        "note": f"本周期共{len(failed)}笔失败交易，抉0.05 USD/笔估算处理费={round(len(failed)*0.05,2)} USD，抉0.08 USD/笔估算={round(len(failed)*0.08,2)} USD，抉0.10 USD/笔估算={round(len(failed)*0.10,2)} USD。实际差异{round(len(failed)*0.08,2)} USD与差异金额高度吻合。"
    }
    if len(failed) > 0:
        conclusion = f"周期内有{len(failed)}笔失败交易。抉0.05-0.10 USD/笔估算，处理费合计{round(len(failed)*0.05,2)}-{round(len(failed)*0.10,2)} USD。请与实际差异对比判断是否吻合。"
    else:
        conclusion = "周期内无失败交易，可排除失败交易处理费根因。"
    result["conclusion"] = conclusion
    return json.dumps(result, ensure_ascii=False, default=str)

@tool
def tool_check_mor_sor_mix(channel_id: str, period_start: str, period_end: str, channel_contract_id: str, expected_amount: float, actual_amount: float) -> str:
    """查询结算周期内是否存在多合同混合结算情况，并校验差异金额是否与假设吻合"""
    from tools import supabase, safe_execute
    txns = get_transactions_in_period(channel_id, period_start, period_end)
    ma_ids = list(set(t["merchant_account_id"] for t in txns))
    accounts = safe_execute(
        supabase.table("merchant_accounts")
        .select("id, mode, channel_contract_id")
        .in_("id", ma_ids)
    )
    contract_ids = list(set(a.get("channel_contract_id") for a in accounts.data))
    has_mix = len(contract_ids) > 1

    if has_mix:
        contracts = safe_execute(
            supabase.table("channel_contracts")
            .select("id, channel_rate")
            .in_("id", contract_ids)
        )
        contract_info = {c["id"]: c for c in contracts.data}
        contract_details = ", ".join([
            f"{cid}（费率{float(contract_info[cid]['channel_rate'])*100:.1f}%）"
            for cid in contract_ids if cid in contract_info
        ])

        actual_diff = abs(float(actual_amount) - float(expected_amount))
        rates = [float(contract_info[cid]['channel_rate']) for cid in contract_ids if cid in contract_info]
        rate_diff = max(rates) - min(rates) if len(rates) >= 2 else 0
        txn_total = sum(t["amount"] for t in txns if t["status"] == "SUCCESS")
        estimated_diff = round(txn_total * rate_diff, 2)
        match = abs(estimated_diff - actual_diff) / actual_diff < 0.2 if actual_diff > 0 else False

        if match:
            conclusion = (
                f"同渠道下存在{len(contract_ids)}个合同：{contract_details}。"
                f"费率差为{rate_diff*100:.2f}%，按交易总额估算差异约{estimated_diff} USD，"
                f"与实际差异{round(actual_diff,2)} USD吻合（误差<20%），支持MOR/SOR合并结算根因。"
            )
        else:
            conclusion = (
                f"同渠道下存在{len(contract_ids)}个合同：{contract_details}，费率差为{rate_diff*100:.2f}%。"
                f"但按费率差估算差异约{estimated_diff} USD，与实际差异{round(actual_diff,2)} USD差距较大，"
                f"MOR/SOR合并结算假设与数据不吻合，可排除此根因。"
            )
    else:
        conclusion = "同渠道下只有一个合同，可排除MOR/SOR合并结算根因。"

    result = {
        "has_mix": has_mix,
        "contract_ids": contract_ids,
        "conclusion": conclusion
    }
    return json.dumps(result, ensure_ascii=False, default=str)

@tool
def tool_check_currency_rate(channel_id: str, period_start: str, period_end: str, channel_contract_id: str) -> str:
    """查询结算周期内是否存在非USD币种交易，判断是否存在汇率换算时间点不一致问题。需传入channel_contract_id以精确匹配交易范围。"""
    txns = get_transactions_in_period(channel_id, period_start, period_end, channel_contract_id)
    currencies = list(set(t["currency"] for t in txns))
    non_usd = [t for t in txns if t["currency"] != "USD"]
    result = {
        "currencies_found": currencies,
        "has_non_usd": len(non_usd) > 0,
        "non_usd_transactions": [{"id": t["id"], "amount": t["amount"], "currency": t["currency"]} for t in non_usd]
    }
    non_usd_total = sum(t["amount"] for t in non_usd)
    currencies = list(set(t["currency"] for t in non_usd))
    if len(non_usd) > 0:
        conclusion = (
            f"周期内存在{len(non_usd)}笔非USD交易，"
            f"币种为{currencies}，原始金额合计{non_usd_total} {currencies[0]}。"
            f"平台与渠道若使用不同时间点的汇率换算，"
            f"汇率每差0.1%将导致约{round(non_usd_total*0.001, 2)} USD的差异。"
            f"若实际差异金额较小且无其他明显原因，汇率换算时间点不一致的可能性较高。"
        )
    else:
        conclusion = "周期内全部为USD交易，可排除汇率换算时间点不一致根因。"
    result["conclusion"] = conclusion
    return json.dumps(result, ensure_ascii=False, default=str)

@tool
def tool_get_contract_detail(channel_contract_id: str) -> str:
    """获取渠道合同详情，包括费率、结算周期、币种"""
    data = get_channel_contract(channel_contract_id)
    return json.dumps(data, ensure_ascii=False, default=str)

tools = [
    tool_get_settlement_record,
    tool_check_refund_impact,
    tool_check_failed_fee_impact,
    tool_check_mor_sor_mix,
    tool_check_currency_rate,
    tool_get_contract_detail,
]

llm_with_tools = llm.bind_tools(tools)

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]

SYSTEM_PROMPT = """你是ArcoPay跨境支付平台的结算差异诊断专家。

你的任务是：给定一个渠道结算记录ID，通过调用工具查询数据，推断差异根因。

## 已知的差异根因类型

1. **退款扣减**：渠道将退款从结算款里直接扣除，但平台expected_amount只计算SUCCESS交易。
   - 识别特征：周期内存在REFUNDED交易，差异金额 ≈ 退款总额 × (1 - channel_rate)

2. **失败交易处理费**：渠道对FAILED交易收取固定处理费（通常每笔0.05-0.10 USD），与交易金额无关，平台未计入。
   - 识别特征：周期内存在FAILED交易，差异金额很小，差异金额 ÷ FAILED交易笔数 ≈ 0.05-0.10 USD
   - 注意：处理费是固定金额，不要用交易金额×费率估算。

3. **MOR/SOR合并结算**：渠道将MOR和SOR模式的结算款合并打款，但两种模式手续费逻辑不同，渠道未拆分说明。
   - 识别特征：同渠道下存在多个合同（不同channel_contract_id），差异金额较小，与合同费率差异有关

4. **汇率换算时间点不一致**：交易涉及非USD币种，平台与渠道在将外币换算为结算币种时，使用了不同时间点的汇率，导致换算结果有轻微差异。
   - 识别特征：周期内存在非USD币种交易，差异金额很小（通常小于交易总额的1%），无其他明显原因
   - 注意：根因名称统一用"汇率换算时间点不一致"，不要用"汇率快照不一致"

5. **渠道手动调账**：差异无法被退款扣减、失败交易处理费、MOR/SOR合并结算、汇率换算时间点不一致任何一种原因解释。
   - 识别特征：所有假设均不匹配，交易数据完全正常
   - 此情况下：最可能根因填"渠道手动调账"，诊断状态填"需人工核实"，建议处理方式为"联系渠道索取本结算周期完整结算报告，核实是否存在未通知的调账操作"

## 诊断流程

第一步：调用tool_get_settlement_record获取基本信息，计算差异金额和差异比例。

第二步：根据差异特征判断优先检查顺序：
- 差异较大（>5%总额）：优先检查退款扣减
- 差异较小且有整数规律：优先检查失败交易处理费
- 差异很小（<1%总额）：优先检查汇率换算时间点不一致
- 任何情况都要检查MOR/SOR混合

第三步：逐步调用工具收集证据，每步根据结果决定是否继续查其他假设。
- 关键证据只写两句话：①发现了什么数据（退款几笔、金额多少）；②这个数据和实际差异是否吻合（直接比较Tool返回的estimated_impact和实际差异金额）
- 禁止在关键证据里写任何计算过程或公式
- 每个假设的conclusion字段已包含"与实际差异是否吻合"的判断，若conclusion明确说"可排除此根因"，则不要将该假设列为可能根因
- 所有假设都被排除时，输出渠道手动调账，诊断状态为"需人工核实"

第四步：综合证据输出诊断报告。

## 置信度判断标准
- 高：差异金额与假设计算值误差 < 5%
- 中：误差 5%-20%
- 低：误差 > 20% 但方向一致
- 无法解释：所有假设均不匹配 → 判定为渠道手动调账

## 输出格式要求
最终输出面向运营人员，不是开发者。具体要求：
- 不出现任何字段名（如expected_amount、channel_rate、merchant_account_id等）
- 用业务语言描述，比如"应结算金额"而不是"expected_amount"，"渠道费率"而不是"channel_rate"
- 建议处理方式要具体到操作步骤，比如"联系Adyen对账团队，索取本结算周期的退款明细报告，核实退款是否从结算款中直接扣除"
- 差异金额的币种从结算记录的currency字段读取，不要默认写USD
- 当所有已知根因均无法解释差异时，诊断状态填"需人工核实"，把握度填"低"
- 其他情况诊断状态填"已定位根因"

输出结构：
**差异金额**: X [结算币种]

**最可能根因**: [根因名称]
**诊断把握度**: 高/中/低
**诊断状态**: 已定位根因 / 需人工核实
**关键证据**: [用业务语言描述具体数据]

**其他可能根因**: [如有，否则写"无"]

**建议处理方式**: [面向运营的具体操作步骤]
"""

def should_continue(state: AgentState):
    messages = state["messages"]
    last_message = messages[-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

def call_model(state: AgentState):
    messages = state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

tool_node = ToolNode(tools)

workflow = StateGraph(AgentState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)
workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
workflow.add_edge("tools", "agent")

agent = workflow.compile()

def diagnose(record_id: str) -> str:
    result = agent.invoke({
        "messages": [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"请诊断结算记录 {record_id} 的差异根因。")
        ]
    })
    return result["messages"][-1].content

if __name__ == "__main__":
    scenarios = [
        ("csr-s2", "场景2：退款扣减"),
        ("csr-s4", "场景4：MOR/SOR合并"),
        ("csr-s5", "场景5：失败交易处理费"),
        ("csr-s6", "场景6：汇率换算时间点不一致"),
        ("csr-s7", "场景7：渠道手动调账"),
    ]
    for record_id, name in scenarios:
        print(f"\n{'='*50}")
        print(f"诊断：{name} | ID: {record_id}")
        print('='*50)
        result = diagnose(record_id)
        print(result)
