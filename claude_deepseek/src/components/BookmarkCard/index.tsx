/**
 * BookmarkCard 组件
 * 展示单个书签的卡片，显示标题、URL、描述和标签列表
 */

import { BookmarkCardProps } from './types';

export function BookmarkCard({ title, url, description, tags = [] }: BookmarkCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* 标题（点击跳转到书签链接） */}
      <h3 className="mb-1 truncate text-base font-semibold text-gray-900">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 hover:underline"
        >
          {title}
        </a>
      </h3>

      {/* URL */}
      <p className="mb-2 truncate text-sm text-blue-500">{url}</p>

      {/* 描述 */}
      {description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-600">{description}</p>
      )}

      {/* 标签列表 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
