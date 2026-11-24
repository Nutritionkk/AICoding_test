/**
 * BookmarkCard 组件的 Props 类型定义
 */
export interface BookmarkCardProps {
  /** 书签标题 */
  title: string;
  /** 书签链接地址 */
  url: string;
  /** 书签描述（可选） */
  description?: string;
  /** 书签标签列表（可选） */
  tags?: string[];
}
