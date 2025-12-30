/**
 * FlashcardSection 컴포넌트
 * AI가 생성한 플래시카드로 학습할 수 있습니다.
 */

import { useState } from 'react';
import { Button } from '../common/Button';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import type { Flashcard } from '../../types';
import './FlashcardSection.css';

interface FlashcardSectionProps {
    /** 플래시카드 배열 */
    flashcards: Flashcard[];
    /** 로딩 상태 */
    loading: boolean;
    /** 생성 콜백 */
    onGenerate: () => void;
    /** 카드 상태 업데이트 콜백 */
    onUpdateCard?: (id: string, known: boolean) => void;
}

/**
 * 플래시카드 학습 섹션 컴포넌트
 */
export function FlashcardSection({
    flashcards,
    loading,
    onGenerate,
    onUpdateCard,
}: FlashcardSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [showOnlyUnknown, setShowOnlyUnknown] = useState(false);

    // 필터링된 카드
    const filteredCards = showOnlyUnknown
        ? flashcards.filter((card) => !card.known)
        : flashcards;

    // 통계
    const knownCount = flashcards.filter((card) => card.known).length;
    const unknownCount = flashcards.length - knownCount;

    if (!flashcards || flashcards.length === 0) {
        return (
            <div className="flashcard-section">
                <div className="flashcard-empty">
                    <h3 className="flashcard-empty-title">플래시카드</h3>
                    <p className="flashcard-empty-description">
                        AI가 영상 내용을 바탕으로 암기용 플래시카드를 생성해요.
                        <br />
                        앞면에는 질문/개념, 뒷면에는 답변/설명이 표시됩니다.
                    </p>
                    <Button variant="primary" loading={loading} onClick={onGenerate}>
                        플래시카드 생성
                    </Button>
                </div>
            </div>
        );
    }

    const currentCard = filteredCards[currentIndex];

    if (!currentCard) {
        return (
            <div className="flashcard-section">
                <div className="flashcard-complete">
                    <h3>모든 카드를 학습했어요!</h3>
                    <p>알고 있는 카드: {knownCount}개 / 전체: {flashcards.length}개</p>
                    <div className="flashcard-complete-actions">
                        <Button variant="secondary" onClick={() => setShowOnlyUnknown(false)}>
                            모든 카드 보기
                        </Button>
                        <Button variant="primary" loading={loading} onClick={onGenerate}>
                            새로운 카드 생성
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // 카드 넘기기
    const handleFlip = () => setIsFlipped(!isFlipped);

    // 다음/이전
    const handleNext = () => {
        if (currentIndex < filteredCards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setIsFlipped(false);
        }
    };

    // 알아요/몰라요
    const handleKnown = (known: boolean) => {
        if (onUpdateCard && currentCard) {
            onUpdateCard(currentCard.id, known);
        }
        handleNext();
    };

    return (
        <div className="flashcard-section">
            {/* 헤더 */}
            <div className="flashcard-header">
                <div className="flashcard-progress">
                    <span className="flashcard-progress-current">{currentIndex + 1}</span>
                    <span className="flashcard-progress-divider">/</span>
                    <span className="flashcard-progress-total">{filteredCards.length}</span>
                </div>
                <div className="flashcard-stats">
                    <span className="flashcard-stat flashcard-stat--known">알아요 {knownCount}</span>
                    <span className="flashcard-stat flashcard-stat--unknown">몰라요 {unknownCount}</span>
                </div>
            </div>

            {/* 필터 */}
            <div className="flashcard-filter">
                <button
                    className={`flashcard-filter-btn ${!showOnlyUnknown ? 'flashcard-filter-btn--active' : ''}`}
                    onClick={() => { setShowOnlyUnknown(false); setCurrentIndex(0); }}
                >
                    전체
                </button>
                <button
                    className={`flashcard-filter-btn ${showOnlyUnknown ? 'flashcard-filter-btn--active' : ''}`}
                    onClick={() => { setShowOnlyUnknown(true); setCurrentIndex(0); }}
                >
                    모르는 것만
                </button>
            </div>

            {/* 카드 */}
            <div
                className={`flashcard-card ${isFlipped ? 'flashcard-card--flipped' : ''}`}
                onClick={handleFlip}
            >
                <div className="flashcard-card-inner">
                    <div className="flashcard-card-front">
                        <span className="flashcard-card-label">Q</span>
                        <div className="flashcard-card-content">
                            <MarkdownRenderer content={currentCard.front} />
                        </div>
                        <span className="flashcard-card-hint">탭해서 뒤집기</span>
                    </div>
                    <div className="flashcard-card-back">
                        <span className="flashcard-card-label">A</span>
                        <div className="flashcard-card-content">
                            <MarkdownRenderer content={currentCard.back} />
                        </div>
                    </div>
                </div>
            </div>

            {/* 알아요/몰라요 버튼 */}
            {isFlipped && (
                <div className="flashcard-actions">
                    <button
                        className="flashcard-action-btn flashcard-action-btn--unknown"
                        onClick={() => handleKnown(false)}
                    >
                        몰라요
                    </button>
                    <button
                        className="flashcard-action-btn flashcard-action-btn--known"
                        onClick={() => handleKnown(true)}
                    >
                        알아요
                    </button>
                </div>
            )}

            {/* 네비게이션 */}
            <div className="flashcard-nav">
                <Button variant="ghost" disabled={currentIndex === 0} onClick={handlePrev}>
                    이전
                </Button>
                <Button
                    variant="ghost"
                    disabled={currentIndex === filteredCards.length - 1}
                    onClick={handleNext}
                >
                    다음
                </Button>
            </div>

            {/* 다시 생성 */}
            <div className="flashcard-regenerate">
                <Button variant="secondary" size="sm" loading={loading} onClick={onGenerate}>
                    새로운 카드 생성
                </Button>
            </div>
        </div>
    );
}
