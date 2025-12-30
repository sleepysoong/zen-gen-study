/**
 * VideoPlayer 컴포넌트
 * YouTube 영상을 임베드하고 자막을 표시합니다.
 */

import { formatTime } from '../../services/youtube';
import './VideoPlayer.css';

interface VideoPlayerProps {
    /** YouTube 비디오 ID */
    videoId: string;
    /** 자막 텍스트 */
    transcript: string;
}

/**
 * 비디오 플레이어 컴포넌트
 */
export function VideoPlayer({ videoId, transcript }: VideoPlayerProps) {
    return (
        <div className="video-player">
            {/* 비디오 */}
            <div className="video-wrapper">
                <iframe
                    src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>

            {/* 자막 */}
            {transcript && (
                <div className="video-transcript">
                    <h3 className="video-transcript-title">자막</h3>
                    <div className="video-transcript-content">
                        <p>{transcript}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
