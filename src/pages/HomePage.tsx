/**
 * HomePage 컴포넌트
 * YouTube 영상 URL을 입력받는 랜딩 페이지입니다.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { extractVideoId, getVideoInfo } from '../services/youtube';
import { getHistory } from '../services/storage';
import './HomePage.css';

/**
 * 홈페이지 컴포넌트
 */
export function HomePage() {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const history = getHistory().slice(0, 6);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const videoId = extractVideoId(url);
        if (!videoId) {
            setError('올바른 YouTube URL을 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const videoInfo = await getVideoInfo(videoId);
            navigate(`/study/${videoId}`, { state: { videoInfo } });
        } catch {
            setError('영상 정보를 가져올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="home-page">
            {/* 히어로 섹션 */}
            <section className="home-hero">
                <h1 className="home-title">
                    당신만을 위한
                    <br />
                    <span className="home-title-accent">AI Study Teacher</span>
                </h1>
                <p className="home-subtitle">
                    YouTube 영상으로 효과적인 학습을 시작하세요.
                    <br />
                    AI가 핵심 정리, 퀴즈, 심화 내용을 생성해드려요.
                </p>

                {/* URL 입력 폼 */}
                <form className="home-form" onSubmit={handleSubmit}>
                    <div className="home-form-input">
                        <Input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="YouTube 영상 URL을 입력하세요"
                            error={error}
                            fullWidth
                        />
                    </div>
                    <Button type="submit" loading={loading} fullWidth>
                        학습 시작하기
                    </Button>
                </form>
            </section>

            {/* 최근 학습 기록 */}
            {history.length > 0 && (
                <section className="home-history">
                    <h2 className="home-history-title">최근 학습</h2>
                    <div className="home-history-list">
                        {history.map((item) => (
                            <button
                                key={item.videoId}
                                className="home-history-item"
                                onClick={() => navigate(`/study/${item.videoId}`)}
                            >
                                <img
                                    src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
                                    alt={item.title || ''}
                                    className="home-history-thumbnail"
                                />
                                <span className="home-history-item-title">{item.title || '제목 없음'}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
