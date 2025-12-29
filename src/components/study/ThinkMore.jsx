/**
 * ThinkMore - 더 생각해볼 내용 컴포넌트
 */
import { Button } from '../common/Button';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import './ThinkMore.css';

export function ThinkMore({ content, loading, onGenerate }) {
    if (!content) {
        return (
            <div className="think-more">
                <div className="think-more-empty">
                    <h3 className="think-more-empty-title">더 생각해볼 내용</h3>
                    <p className="think-more-empty-description">
                        학습한 내용을 바탕으로 더 깊이 생각해볼 주제를 제안해요.
                    </p>
                    <Button
                        variant="primary"
                        loading={loading}
                        onClick={onGenerate}
                    >
                        생성하기
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="think-more">
            <div className="think-more-content">
                <div className="think-more-header">
                    <h2 className="think-more-title">더 생각해볼 내용</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        loading={loading}
                        onClick={onGenerate}
                    >
                        다시 생성
                    </Button>
                </div>
                <div className="think-more-body">
                    <MarkdownRenderer content={content} />
                </div>
            </div>
        </div>
    );
}
