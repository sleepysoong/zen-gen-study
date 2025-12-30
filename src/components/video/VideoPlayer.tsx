/**
 * VideoPlayer 컴포넌트
 * YouTube 영상과 타임스탬프 자막을 표시합니다.
 */

import { useState, useRef, useCallback } from 'react';
import { TranscriptViewer } from './TranscriptViewer';
import type { TranscriptSegment } from '../../types';
import './VideoPlayer.css';

interface VideoPlayerProps {
    /** YouTube 비디오 ID */
    videoId: string;
    /** 자막 세그먼트 배열 */
    segments: TranscriptSegment[];
    /** 전체 자막 텍스트 */
    transcript: string;
}

/**
 * 비디오 플레이어 컴포넌트
 */
export function VideoPlayer({ videoId, segments, transcript }: VideoPlayerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [currentTime, setCurrentTime] = useState(0);

    // 영상 시간 이동
    const handleSeek = useCallback((time: number) => {
        if (iframeRef.current?.contentWindow) {
            // YouTube IFrame API를 통해 시간 이동
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({
                    event: 'command',
                    func: 'seekTo',
                    args: [time, true],
                }),
                '*'
            );
        }
    }, []);

    return (
        <div className="video-player">
            <div className="video-player-layout">
                {/* 비디오 */}
                <div className="video-wrapper">
                    <iframe
                        ref={iframeRef}
                        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* 자막 뷰어 */}
                <div className="video-transcript-panel">
                    {segments && segments.length > 0 ? (
                        <TranscriptViewer
                            segments={segments}
                            currentTime={currentTime}
                            onSeek={handleSeek}
                        />
                    ) : (
                        <div className="video-transcript-fallback">
                            <h3>자막</h3>
                            <div className="video-transcript-text">
                                <p>{transcript || '자막을 불러올 수 없습니다.'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
