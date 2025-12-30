/**
 * ContentSummary 컴포넌트
 * AI가 생성한 핵심 내용 요약을 표시합니다.
 */

import { useState } from 'react';
import { Button } from '../common/Button';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { Textarea } from '../common/Input';
import './ContentSummary.css';

interface ContentSummaryProps {
    /** 요약 내용 */
    summary: string;
    /** 로딩 상태 */
    loading: boolean;
    /** 요약 생성 콜백 */
    onGenerate: () => void;
    /** 전체 생성 콜백 */
    onGenerateAll: () => void;
    /** 자막 텍스트 */
    transcript: string;
    /** 자막 변경 콜백 */
    onTranscriptChange: (value: string) => void;
}

/**
 * 핵심 내용 요약 컴포넌트
 */
export function ContentSummary({
    summary,
    loading,
    onGenerate,
    onGenerateAll,
    transcript,
    onTranscriptChange,
}: ContentSummaryProps) {
    const [showTranscript, setShowTranscript] = useState(false);

    if (!summary && !transcript) {
        return (
            <div className="content-summary">
                <div className="summary-empty">
                    <h3 className="summary-empty-title">핵심 정리</h3>
                    <p className="summary-empty-description">
                        영상 내용을 AI가 분석하여 핵심 내용을 정리해드려요.
                    </p>
                    <div className="summary-empty-actions">
                        <Button variant="ghost" onClick={() => setShowTranscript(!showTranscript)}>
                            {showTranscript ? '자막 숨기기' : '자막 직접 입력'}
                        </Button>
                    </div>
                    {showTranscript && (
                        <div className="summary-transcript-input">
                            <Textarea
                                value={transcript}
                                onChange={(e) => onTranscriptChange(e.target.value)}
                                placeholder="영상의 자막이나 스크립트를 입력해주세요..."
                                rows={6}
                                fullWidth
                            />
                        </div>
                    )}
                    <div className="summary-empty-actions">
                        <Button variant="primary" loading={loading} onClick={onGenerate} disabled={!transcript}>
                            핵심 정리 생성
                        </Button>
                        <Button
                            variant="secondary"
                            loading={loading}
                            onClick={onGenerateAll}
                            disabled={!transcript}
                        >
                            전체 콘텐츠 생성
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="content-summary">
            {/* 자막 토글 */}
            <div className="summary-transcript-toggle">
                <Button variant="ghost" size="sm" onClick={() => setShowTranscript(!showTranscript)}>
                    {showTranscript ? '자막 숨기기' : '자막 보기/수정'}
                </Button>
            </div>

            {showTranscript && (
                <div className="summary-transcript">
                    <Textarea
                        value={transcript}
                        onChange={(e) => onTranscriptChange(e.target.value)}
                        placeholder="자막 내용..."
                        rows={4}
                        fullWidth
                    />
                </div>
            )}

            {/* 요약 내용 */}
            {summary ? (
                <div className="summary-content">
                    <MarkdownRenderer content={summary} />
                </div>
            ) : (
                <div className="summary-empty">
                    <Button variant="primary" loading={loading} onClick={onGenerate}>
                        핵심 정리 생성
                    </Button>
                </div>
            )}

            {/* 재생성 버튼 */}
            {summary && (
                <div className="summary-actions">
                    <Button variant="secondary" size="sm" loading={loading} onClick={onGenerate}>
                        다시 생성
                    </Button>
                </div>
            )}
        </div>
    );
}
