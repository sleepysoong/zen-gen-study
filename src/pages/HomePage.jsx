/**
 * HomePage - 랜딩 및 YouTube 링크 입력 페이지
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { extractVideoId, getVideoInfo } from '../services/youtube';
import { getHistory, deleteHistoryItem } from '../services/storage';
import './HomePage.css';

export function HomePage() {
    const navigate = useNavigate();
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [history] = useState(() => getHistory());

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const videoId = extractVideoId(url);
        if (!videoId) {
            setError('올바른 YouTube 링크를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const videoInfo = await getVideoInfo(videoId);
            navigate(`/study/${videoId}`, { state: { videoInfo } });
        } catch (err) {
            setError('영상 정보를 가져올 수 없습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const handleHistoryClick = (item) => {
        navigate(`/study/${item.videoId}`, {
            state: { videoInfo: { id: item.videoId, title: item.title, thumbnailUrl: item.thumbnailUrl } }
        });
    };

    const handleDeleteHistory = (e, id) => {
        e.stopPropagation();
        deleteHistoryItem(id);
        window.location.reload();
    };

    return (
        <div className="home-page">
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        당신만을 위한<br />
                        <span className="hero-title-accent">AI Study Teacher</span>
                    </h1>
                    <p className="hero-description">
                        YouTube 영상 링크를 입력하면 AI가 핵심 내용을 정리하고,<br />
                        퀴즈를 만들어 학습을 도와줘요.
                    </p>

                    <form className="url-form" onSubmit={handleSubmit}>
                        <div className="url-input-wrapper">
                            <Input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="YouTube 링크를 입력하세요"
                                error={error}
                            />
                        </div>
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={loading}
                            disabled={!url.trim()}
                        >
                            학습 시작하기
                        </Button>
                    </form>
                </div>
            </section>

            {history.length > 0 && (
                <section className="history-section">
                    <div className="history-container">
                        <h2 className="history-title">이전 학습 기록</h2>
                        <div className="history-grid">
                            {history.slice(0, 6).map((item) => (
                                <div
                                    key={item.id}
                                    className="history-card"
                                    onClick={() => handleHistoryClick(item)}
                                >
                                    <div className="history-card-thumbnail">
                                        <img
                                            src={item.thumbnailUrl || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
                                            alt={item.title}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="history-card-content">
                                        <h3 className="history-card-title">{item.title || '제목 없음'}</h3>
                                        <span className="history-card-date">
                                            {new Date(item.updatedAt || item.createdAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                    <button
                                        className="history-card-delete"
                                        onClick={(e) => handleDeleteHistory(e, item.id)}
                                        aria-label="삭제"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
