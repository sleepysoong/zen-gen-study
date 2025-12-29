/**
 * MarkdownRenderer 컴포넌트
 * - 마크다운 렌더링
 * - LaTeX 수식 지원
 */
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './MarkdownRenderer.css';

export function MarkdownRenderer({ content, className = '' }) {
    if (!content) return null;

    return (
        <div className={`markdown-content ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    // 코드 블록 커스텀
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');

                        if (!inline && match) {
                            return (
                                <pre className={`code-block language-${match[1]}`}>
                                    <code {...props}>
                                        {String(children).replace(/\n$/, '')}
                                    </code>
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
                    a({ node, children, href, ...props }) {
                        return (
                            <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                                {children}
                            </a>
                        );
                    },
                    // 하이라이트된 텍스트 (==text== 형식 지원 안됨, 대신 **text** 사용)
                    strong({ node, children, ...props }) {
                        return <strong {...props}>{children}</strong>;
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
