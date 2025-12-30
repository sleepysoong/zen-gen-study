/**
 * ThinkMore 컴포넌트
 * 더 깊이 생각해볼 주제를 표시합니다.
 */

import { Button } from '../common/Button';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import './ThinkMore.css';

interface ThinkMoreProps {
    /** 심화 내용 */
    content: string;
    /** 로딩 상태 */
    loading: boolean;
    /** 생성 콜백 */
    onGenerate: () => void;
}

/**
 * 더 생각해볼 내용 컴포넌트
 */
export function ThinkMore({ content, loading, onGenerate }: ThinkMoreProps) {
    if (!content) {
        return (
            <div className="think-more">
                <div className="think-empty">
                    <h3 className="think-empty-title">더 생각해볼 내용</h3>
                    <p className="think-empty-description">
                        학습 내용을 바탕으로 심화 질문과 토론 주제를 제안해드려요.
                    </p>
                    <Button variant="primary" loading={loading} onClick={onGenerate}>
                        심화 내용 생성
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="think-more">
            <h3 className="think-title">더 생각해볼 내용</h3>
            <div className="think-content">
                <MarkdownRenderer content={content} />
            </div>
            <div className="think-actions">
                <Button variant="secondary" size="sm" loading={loading} onClick={onGenerate}>
                    다시 생성
                </Button>
            </div>
        </div>
    );
}
