/**
 * RelatedTopics 컴포넌트
 * 연관된 개념과 키워드를 표시합니다.
 */

import { Button } from '../common/Button';
import type { RelatedKeyword } from '../../types';
import './RelatedTopics.css';

interface RelatedTopicsProps {
    /** 연관 키워드 배열 */
    keywords: RelatedKeyword[];
    /** 로딩 상태 */
    loading: boolean;
    /** 생성 콜백 */
    onGenerate: () => void;
}

/**
 * 연관 내용 컴포넌트
 */
export function RelatedTopics({ keywords, loading, onGenerate }: RelatedTopicsProps) {
    if (!keywords || keywords.length === 0) {
        return (
            <div className="related-topics">
                <div className="related-empty">
                    <h3 className="related-empty-title">연관 내용</h3>
                    <p className="related-empty-description">
                        학습 내용과 관련된 개념과 키워드를 추천해드려요.
                    </p>
                    <Button variant="primary" loading={loading} onClick={onGenerate}>
                        연관 내용 생성
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="related-topics">
            <h3 className="related-title">연관 내용</h3>
            <div className="related-list">
                {keywords.map((keyword, index) => (
                    <div key={index} className="related-item">
                        <span className="related-term">{keyword.term}</span>
                        <p className="related-description">{keyword.description}</p>
                    </div>
                ))}
            </div>
            <div className="related-actions">
                <Button variant="secondary" size="sm" loading={loading} onClick={onGenerate}>
                    다시 생성
                </Button>
            </div>
        </div>
    );
}
