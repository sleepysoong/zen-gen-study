/**
 * VideoPlayer - 영상 시청 컴포넌트
 */
import { useState } from 'react';
import YouTube from 'react-youtube';
import './VideoPlayer.css';

export function VideoPlayer({ videoId, transcript }) {
    const [player, setPlayer] = useState(null);

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
        },
    };

    const onReady = (event) => {
        setPlayer(event.target);
    };

    return (
        <div className="video-player">
            <div className="video-container">
                <div className="video-wrapper">
                    <YouTube
                        videoId={videoId}
                        opts={opts}
                        onReady={onReady}
                        className="youtube-player"
                    />
                </div>
            </div>

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
