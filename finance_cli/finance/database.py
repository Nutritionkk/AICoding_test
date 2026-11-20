"""数据库操作层。

- 数据库文件：~/.finance-cli/data.db（用户主目录下）
- 每次操作独立打开/关闭连接：Streamlit 每次交互会重跑整个脚本，
  因此不使用全局连接
- 查询结果通过 JOIN 关联分类名，直接映射为 models 中的 Record
"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path

from finance.models import DEFAULT_CATEGORIES, Record

DB_DIR = Path.home() / ".finance-cli"
DB_PATH = DB_DIR / "data.db"


@contextmanager
def _db():
    """打开数据库连接：操作成功自动提交，最后自动关闭。"""
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # 查询结果可按列名访问
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    """创建 categories 表和 records 表，并写入 6 个默认分类（可重复调用）。"""
    with _db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount REAL NOT NULL CHECK (amount > 0),
                category_id INTEGER NOT NULL REFERENCES categories(id),
                record_date TEXT NOT NULL,          -- 'YYYY-MM-DD'
                note TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            )
            """
        )
        # 只插入不存在的分类：
        # 不用 INSERT OR IGNORE，它即使忽略也会空占 AUTOINCREMENT 计数器
        existing = {
            row["name"]
            for row in conn.execute("SELECT name FROM categories").fetchall()
        }
        for name in DEFAULT_CATEGORIES:
            if name not in existing:
                conn.execute("INSERT INTO categories (name) VALUES (?)", (name,))


def add_record(amount: float, category_name: str, date: str, note: str = "") -> int:
    """插入一笔账目，返回新记录的 id。金额 <= 0 或分类不存在时抛 ValueError。"""
    if amount <= 0:
        raise ValueError("金额必须大于 0")
    with _db() as conn:
        row = conn.execute(
            "SELECT id FROM categories WHERE name = ?", (category_name,)
        ).fetchone()
        if row is None:
            raise ValueError(
                f"分类不存在：{category_name}（可选：{'、'.join(DEFAULT_CATEGORIES)}）"
            )
        cur = conn.execute(
            "INSERT INTO records (amount, category_id, record_date, note) "
            "VALUES (?, ?, ?, ?)",
            (amount, row["id"], date, note),
        )
        return cur.lastrowid


def list_records(
    month: str | None = None, category_name: str | None = None
) -> list[Record]:
    """查询账目，可按月份（'YYYY-MM'）和分类名筛选，按日期倒序返回。"""
    sql = """
        SELECT r.id, r.amount, r.category_id, r.record_date, r.note, r.created_at,
               COALESCE(c.name, '') AS category_name
        FROM records r
        LEFT JOIN categories c ON r.category_id = c.id
    """
    conditions = []
    params: list[str] = []
    if month:
        conditions.append("substr(r.record_date, 1, 7) = ?")
        params.append(month)
    if category_name:
        conditions.append("c.name = ?")
        params.append(category_name)
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    sql += " ORDER BY r.record_date DESC, r.id DESC"

    with _db() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [Record(**dict(row)) for row in rows]


def get_months() -> list[str]:
    """返回所有有记录的月份（'YYYY-MM'），按时间倒序，供筛选下拉框使用。"""
    with _db() as conn:
        rows = conn.execute(
            "SELECT DISTINCT substr(record_date, 1, 7) AS month "
            "FROM records ORDER BY month DESC"
        ).fetchall()
    return [row["month"] for row in rows]


def delete_record(record_id: int) -> bool:
    """删除一笔账目，返回是否真的删除（id 不存在时返回 False）。"""
    with _db() as conn:
        cur = conn.execute("DELETE FROM records WHERE id = ?", (record_id,))
        return cur.rowcount > 0


def get_stats(month: str | None = None) -> list[dict]:
    """按分类统计支出（总金额、笔数），按总金额降序返回。

    月份条件放在 JOIN 的 ON 里，保证没有数据的分类也返回（金额 0、笔数 0），
    柱状图能稳定显示全部 6 个分类。
    """
    sql = """
        SELECT c.name AS category,
               COALESCE(SUM(r.amount), 0) AS total,
               COUNT(r.id) AS count
        FROM categories c
        LEFT JOIN records r
               ON r.category_id = c.id
              AND (? IS NULL OR substr(r.record_date, 1, 7) = ?)
        GROUP BY c.id
        ORDER BY total DESC, c.id ASC
    """
    with _db() as conn:
        rows = conn.execute(sql, (month, month)).fetchall()
    return [
        {"category": row["category"], "total": float(row["total"]), "count": row["count"]}
        for row in rows
    ]
