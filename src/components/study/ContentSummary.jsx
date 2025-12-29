/**
 * ContentSummary - 핵심 내용 정리 컴포넌트
 */
import { useState } from 'react';
import { Button } from '../common/Button';
import { Textarea } from '../common/Input';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import './ContentSummary.css';

export function ContentSummary({
    summary,
    loading,
    onGenerate,
    onGenerateAll,
    transcript,
    onTranscriptChange
}) {
    const [showTranscript, setShowTranscript] = useState(false);
    const [editingTranscript, setEditingTranscript] = useState(false);
    const [tempTranscript, setTempTranscript] = useState(transcript);

    const handleSaveTranscript = () => {
        onTranscriptChange(tempTranscript);
        setEditingTranscript(false);
    };

    return (
        <div className="content-summary">
            {/* 자막/원본 섹션 */}
            <div className="transcript-section">
                <div className="transcript-header">
                    <button
                        className="transcript-toggle"
                        onClick={() => setShowTranscript(!showTranscript)}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ transform: showTranscript ? 'rotate(90deg)' : 'rotate(0)' }}
                        >
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                        영상 내용 (자막)
                    </button>
                    {!transcript && (
                        <span className="transcript-notice">자막을 직접 입력해주세요</span>
                    )}
                </div>

                {showTranscript && (
                    <div className="transcript-content">
                        {editingTranscript ? (
                            <>
                                <Textarea
                                    value={tempTranscript}
                                    onChange={(e) => setTempTranscript(e.target.value)}
                                    placeholder="영상 내용을 입력해주세요..."
                                    rows={8}
                                />
                                <div className="transcript-actions">
                                    <Button variant="ghost" size="sm" onClick={() => setEditingTranscript(false)}>
                                        취소
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={handleSaveTranscript}>
                                        저장
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="transcript-text">
                                    {transcript || '자막이 없습니다. 편집 버튼을 눌러 직접 입력해주세요.'}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setTempTranscript(transcript);
                                        setEditingTranscript(true);
                                    }}
                                >
                                    편집
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* 생성 버튼 */}
            {!summary && (
                <div className="generate-section">
                    <div className="generate-card">
                        <h3 className="generate-title">AI가 핵심 내용을 정리해드려요</h3>
                        <p className="generate-description">
                            영상 내용을 분석하고 중요한 개념을 정리해요. 수학 공식은 LaTeX로 표현해요.
                        </p>
                        <div className="generate-buttons">
                            <Button
                                variant="primary"
                                loading={loading}
                                onClick={onGenerate}
                                disabled={!transcript}
                            >
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
            )}

            {/* 요약 내용 */}
            {summary && (
                <div className="summary-content">
                    <div className="summary-header">
                        <h2 className="summary-title">핵심 정리</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            loading={loading}
                            onClick={onGenerate}
                        >
                            다시 생성
                        </Button>
                    </div>
                    <div className="summary-body">
                        <MarkdownRenderer content={summary} />
                    </div>
                </div>
            )}
        </div>
    );
}
