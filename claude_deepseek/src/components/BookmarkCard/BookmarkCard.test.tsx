/**
 * BookmarkCard 组件测试
 * 覆盖：渲染测试、Props 传递测试
 */

import { render, screen } from '@testing-library/react';
import { BookmarkCard } from './index';
import { BookmarkCardProps } from './types';

const defaultProps: BookmarkCardProps = {
  title: 'React 官方文档',
  url: 'https://react.dev',
  description: 'React 官方文档站点',
  tags: ['React', '文档'],
};

describe('BookmarkCard', () => {
  it('渲染标题、URL、描述和标签列表', () => {
    render(<BookmarkCard {...defaultProps} />);

    // 标题渲染为指向 url 的链接
    const titleLink = screen.getByRole('link', { name: defaultProps.title });
    expect(titleLink).toHaveAttribute('href', defaultProps.url);

    // URL 文本
    expect(screen.getByText(defaultProps.url)).toBeInTheDocument();

    // 描述
    expect(screen.getByText(defaultProps.description!)).toBeInTheDocument();

    // 标签列表
    defaultProps.tags!.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('Props 传递测试：传入不同数据时正确渲染对应内容', () => {
    const props: BookmarkCardProps = {
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      description: 'Web 开发技术文档',
      tags: ['Web', 'API'],
    };

    render(<BookmarkCard {...props} />);

    expect(screen.getByRole('link', { name: props.title })).toHaveAttribute(
      'href',
      props.url,
    );
    expect(screen.getByText(props.description!)).toBeInTheDocument();
    expect(screen.queryByText(defaultProps.title)).not.toBeInTheDocument();
  });

  it('未传入 description 和 tags 时只渲染标题和 URL', () => {
    render(<BookmarkCard title="仅标题" url="https://example.com" />);

    expect(screen.getByRole('link', { name: '仅标题' })).toHaveAttribute(
      'href',
      'https://example.com',
    );
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    // 描述和标签区域不渲染
    expect(screen.queryByText(defaultProps.description!)).not.toBeInTheDocument();
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });
});
