# 记账工具（Python + Streamlit + SQLite）

## 项目简介

本地 Web 记账工具「个人记账助手」：网页表单添加账目，按月份/分类筛选查看列表，输入 ID 删除账目，查看分类统计（统计表 + 柱状图）。只记录支出，不记收入。

## 技术栈

- Python 3.13（要求 >=3.10）+ Streamlit（Web 界面）
- sqlite3（Python 标准库）+ pandas（表格与图表数据）

## 运行方式

```bash
# 安装依赖（清华镜像源，国内更快）
pip install streamlit -i https://pypi.tuna.tsinghua.edu.cn/simple

# 在项目根目录 finance_cli 下启动（浏览器自动打开 http://localhost:8501）
python -m streamlit run finance/web.py
```

数据保存在 `~/.finance-cli/data.db`（用户主目录下，首次运行自动创建）。
注意：必须用 `python -m streamlit run`（而非 `streamlit run`）启动，这样项目根目录才会进入 Python 路径，`from finance.xxx import ...` 才能正常导入（web.py 里也做了 sys.path 兜底）。

## 文件结构与职责

| 文件 | 职责 |
|------|------|
| `finance/models.py` | 数据模型：`DEFAULT_CATEGORIES`、`Category` 与 `Record` dataclass |
| `finance/database.py` | 数据层：sqlite3 建表、增/查/删、按月统计、月份列表 |
| `finance/web.py` | 界面层：Streamlit 页面（导航、表单、表格、柱状图） |
| `pyproject.toml` | 项目声明：名称 finance-cli、Python >=3.10、依赖 streamlit |
| `~/.finance-cli/data.db` | 数据文件（用户主目录下，运行时自动生成，不在项目内） |

## 数据库表结构

```sql
categories(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)
records(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL CHECK (amount > 0),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  record_date TEXT NOT NULL,          -- 'YYYY-MM-DD'
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
)
```

## 功能清单（侧边栏导航 3 页）

1. **添加记录**：金额（>0）、分类下拉、日期（默认今天）、备注，提交后提示记录 ID
2. **账目列表**：月份/分类筛选，表格按日期倒序（ID、日期、分类、金额、备注），底部合计金额与笔数；折叠区「删除记录」输入 ID 删除
3. **分类统计**：月份筛选 + 统计表（分类、合计、笔数、占比）+ 柱状图

## 项目约定

- 分类固定 6 个（`finance/models.py` 的 `DEFAULT_CATEGORIES`）：餐饮、交通、购物、娱乐、居住、其他
- 分类颜色固定映射（`finance/web.py` 的 `CATEGORY_COLORS`，颜色绑定分类实体、不随排序/筛选变化）：餐饮 `#2a78d6`、交通 `#eb6834`、购物 `#1baf7a`、娱乐 `#eda100`、居住 `#e87ba4`、其他 `#008300`
- 金额统一显示 `¥` 千分位两位小数；柱状图按金额降序，只画有数据的分类（精确数值以统计表为准）
- 数据库每次操作独立 connect/close（Streamlit 每次交互重跑脚本，不使用全局连接）；`init_db()` 幂等，可重复调用
- `Record.category_name` 是 JOIN 查询时填充的展示字段，不是数据库列；`get_stats` 用 LEFT JOIN 且月份条件放在 ON 里，保证没有数据的分类也返回（金额 0、笔数 0）
- 数据库为空时页面显示友好提示，不报错
