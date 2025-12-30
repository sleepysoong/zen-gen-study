/**
 * MarkdownRenderer 컴포넌트
 * 마크다운과 LaTeX 수식을 렌더링합니다.
 * GFM(GitHub Flavored Markdown)을 지원합니다.
 */

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
    /** 마크다운 콘텐츠 */
    content: string;
    /** 추가 CSS 클래스 */
    className?: string;
}

/**
 * 마크다운 렌더링 컴포넌트
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    if (!content) return null;

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // 코드 블록 커스텀
                    code({ inline, className: codeClassName, children, ...props }) {
                        const match = /language-(\w+)/.exec(codeClassName || '');

                        if (!inline && match) {
                            return (
                                <pre className={`code-block language-${match[1]}`}>
                                    <code {...props}>{String(children).replace(/\n$/, '')}</code>
                                </pre>
                            );
                        }

                        return (
                            <code className="inline-code" {...props}>
                                {children}
                            </code>
                        );
                    },
                    // 링크는 새 탭에서 열기
                    a({ children, href, ...props }) {
                        return (
                            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                                {children}
                            </a>
                        );
                    },
                    // 표 래퍼
                    table({ children, ...props }) {
                        return (
                            <div className="table-wrapper">
                                <table {...props}>{children}</table>
                            </div>
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
