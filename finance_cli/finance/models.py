"""数据模型定义。

Category 和 Record 对应数据库中的 categories 与 records 表。
category_name 是查询时 JOIN 分类表得到的展示字段，不属于数据库列。
"""

from dataclasses import dataclass

# 预设分类（按显示顺序）
DEFAULT_CATEGORIES = ["餐饮", "交通", "购物", "娱乐", "居住", "其他"]


@dataclass
class Category:
    """账目分类。"""

    id: int
    name: str


@dataclass
class Record:
    """一条支出账目。"""

    id: int
    amount: float
    category_id: int
    record_date: str  # 'YYYY-MM-DD'
    note: str = ""
    created_at: str = ""  # 插入时由数据库生成
    category_name: str = ""  # 运行时 JOIN 填充，非数据库字段
