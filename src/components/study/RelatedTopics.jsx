/**
 * RelatedTopics - 연관 내용 컴포넌트
 */
import { Button } from '../common/Button';
import './RelatedTopics.css';

export function RelatedTopics({ keywords, loading, onGenerate }) {
    if (!keywords || keywords.length === 0) {
        return (
            <div className="related-topics">
                <div className="related-empty">
                    <h3 className="related-empty-title">연관 개념 추천</h3>
                    <p className="related-empty-description">
                        학습한 내용과 관련된 개념들을 추천해드려요.
                    </p>
                    <Button
                        variant="primary"
                        loading={loading}
                        onClick={onGenerate}
                    >
                        연관 개념 생성
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="related-topics">
            <div className="related-header">
                <h2 className="related-title">연관 개념</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    loading={loading}
                    onClick={onGenerate}
                >
                    다시 생성
                </Button>
            </div>

            <div className="related-grid">
                {keywords.map((keyword, index) => (
                    <div key={index} className="related-card">
                        <h3 className="related-card-term">{keyword.term}</h3>
                        <p className="related-card-description">{keyword.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
