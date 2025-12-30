/**
 * TranscriptViewer 컴포넌트
 * 타임스탬프별 자막을 표시하고, 클릭시 영상 이동 기능을 제공합니다.
 */

import { useState, useRef, useEffect } from 'react';
import type { TranscriptSegment } from '../../types';
import './TranscriptViewer.css';

interface TranscriptViewerProps {
    /** 자막 세그먼트 배열 */
    segments: TranscriptSegment[];
    /** 현재 재생 시간 (초) */
    currentTime?: number;
    /** 타임스탬프 클릭 시 콜백 */
    onSeek: (time: number) => void;
}

/**
 * 시간을 MM:SS 형식으로 변환합니다.
 */
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 타임스탬프가 있는 자막 뷰어 컴포넌트
 */
export function TranscriptViewer({ segments, currentTime = 0, onSeek }: TranscriptViewerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const activeRef = useRef<HTMLDivElement>(null);

    // 현재 재생 중인 세그먼트 하이라이트
    const activeIndex = segments.findIndex(
        (seg, i) =>
            currentTime >= seg.start &&
            (i === segments.length - 1 || currentTime < segments[i + 1]?.start)
    );

    // 활성 세그먼트로 스크롤
    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeIndex]);

    // 검색 필터링
    const filteredSegments = searchQuery
        ? segments.filter((seg) =>
            seg.text.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : segments;

    if (!segments || segments.length === 0) {
        return (
            <div className="transcript-viewer">
                <div className="transcript-empty">
                    <p>타임스탬프가 있는 자막이 없습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="transcript-viewer">
            {/* 검색 */}
            <div className="transcript-search">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="자막 내용 검색..."
                />
                {searchQuery && (
                    <span className="transcript-search-count">
                        {filteredSegments.length}개 결과
                    </span>
                )}
            </div>

            {/* 자막 목록 */}
            <div className="transcript-list">
                {filteredSegments.map((segment, index) => {
                    const originalIndex = segments.indexOf(segment);
                    const isActive = originalIndex === activeIndex;

                    return (
                        <div
                            key={index}
                            ref={isActive ? activeRef : null}
                            className={`transcript-item ${isActive ? 'transcript-item--active' : ''}`}
                            onClick={() => onSeek(segment.start)}
                        >
                            <span className="transcript-time">{formatTime(segment.start)}</span>
                            <span className="transcript-text">{segment.text}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
