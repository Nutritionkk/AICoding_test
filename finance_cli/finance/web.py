"""Streamlit Web 界面：个人记账助手。

运行方式（在项目根目录 finance_cli 下）：
    python -m streamlit run finance/web.py
"""

import sys
from datetime import date
from pathlib import Path

import pandas as pd
import streamlit as st

# 把项目根目录加入 sys.path：
# `streamlit run` 只把脚本所在目录（finance/）加入路径，
# 手动补上根目录，`from finance.xxx import ...` 才能正常导入
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from finance.database import (  # noqa: E402
    add_record,
    delete_record,
    get_months,
    get_stats,
    init_db,
    list_records,
)
from finance.models import DEFAULT_CATEGORIES  # noqa: E402

# 分类固定颜色（颜色绑定分类实体，不随排序/筛选变化；见 CLAUDE.md 项目约定）
CATEGORY_COLORS = {
    "餐饮": "#2a78d6",
    "交通": "#eb6834",
    "购物": "#1baf7a",
    "娱乐": "#eda100",
    "居住": "#e87ba4",
    "其他": "#008300",
}

st.set_page_config(page_title="个人记账助手", page_icon="💰", layout="wide")


@st.cache_resource
def _ensure_db() -> None:
    """初始化数据库：每个会话只执行一次（init_db 本身幂等）。"""
    init_db()


def _records_to_df(records) -> pd.DataFrame:
    """把 Record 列表转成带中文表头的表格数据。"""
    return pd.DataFrame(
        [
            {
                "ID": r.id,
                "日期": r.record_date,
                "分类": r.category_name,
                "金额": r.amount,
                "备注": r.note,
            }
            for r in records
        ]
    )


def _render_add_page() -> None:
    st.subheader("添加记录")

    with st.form("add_form"):
        amount = st.number_input("金额（元）", min_value=0.01, step=0.01, format="%.2f")
        category = st.selectbox("分类", DEFAULT_CATEGORIES)
        record_date = st.date_input("日期", value=date.today(), format="YYYY-MM-DD")
        note = st.text_input("备注（可选）", max_chars=100)
        submitted = st.form_submit_button("提交")

    if submitted:
        try:
            record_id = add_record(
                amount, category, record_date.strftime("%Y-%m-%d"), note.strip()
            )
            st.success(
                f"已添加：{category} ¥{amount:,.2f}（记录 ID：{record_id}）"
            )
        except ValueError as e:
            st.error(str(e))


def _render_list_page() -> None:
    st.subheader("账目列表")

    month_label = st.selectbox("月份", ["全部"] + get_months(), key="list_month")
    category = st.selectbox(
        "分类", ["全部"] + DEFAULT_CATEGORIES, key="list_category"
    )
    records = list_records(
        month=None if month_label == "全部" else month_label,
        category_name=None if category == "全部" else category,
    )

    if not records:
        st.info("暂无符合条件的记录，先去「添加记录」页记一笔吧")
    else:
        st.dataframe(
            _records_to_df(records),
            hide_index=True,
            column_config={"金额": st.column_config.NumberColumn(format="¥%.2f")},
        )
        c1, c2 = st.columns(2)
        c1.metric("合计金额", f"¥{sum(r.amount for r in records):,.2f}")
        c2.metric("记录笔数", len(records))

    _render_delete_expander()


def _render_delete_expander() -> None:
    """删除记录（输入 ID），放在列表页底部折叠区。"""
    with st.expander("删除记录（输入 ID）"):
        record_id = st.number_input("记录 ID", min_value=1, step=1, key="delete_id")
        if st.button("删除"):
            if delete_record(int(record_id)):
                st.success(f"已删除记录 {record_id}")
                st.rerun()  # 刷新列表
            else:
                st.warning(f"记录 {record_id} 不存在")


def _render_stats_page() -> None:
    st.subheader("分类统计")

    month_label = st.selectbox("月份", ["全部"] + get_months(), key="stats_month")
    month = None if month_label == "全部" else month_label
    stats = get_stats(month)
    grand_total = sum(s["total"] for s in stats)

    df = pd.DataFrame(stats)
    df.columns = ["分类", "合计", "笔数"]
    df["占比"] = (df["合计"] / grand_total * 100) if grand_total > 0 else 0.0

    st.dataframe(
        df,
        hide_index=True,
        column_config={
            "合计": st.column_config.NumberColumn(format="¥%.2f"),
            "占比": st.column_config.NumberColumn(format="%.1f%%"),
        },
    )

    # 柱状图：按金额降序（get_stats 已排序），只画有数据的分类
    chart_df = df[df["合计"] > 0].copy()
    if chart_df.empty:
        st.info("所选月份暂无支出数据")
    else:
        chart_df["颜色"] = [
            CATEGORY_COLORS.get(c, "#898781") for c in chart_df["分类"]
        ]
        st.bar_chart(chart_df, x="分类", y="合计", color="颜色", height=400)


_ensure_db()

st.title("个人记账助手")

page = st.sidebar.radio("导航", ["添加记录", "账目列表", "分类统计"])

if page == "添加记录":
    _render_add_page()
elif page == "账目列表":
    _render_list_page()
else:
    _render_stats_page()
