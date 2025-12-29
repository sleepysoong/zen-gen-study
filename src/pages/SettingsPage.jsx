/**
 * SettingsPage - 설정 페이지
 */
import { useState } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { getSettings, saveSettings, clearAllData, exportAllData } from '../services/storage';
import './SettingsPage.css';

// 추천 모델 목록
const RECOMMENDED_MODELS = [
    'google/gemini-2.0-flash-001',
    'google/gemini-2.0-flash-thinking-exp:free',
    'anthropic/claude-3.5-sonnet',
    'anthropic/claude-3-haiku',
    'openai/gpt-4o-mini',
    'openai/gpt-4o',
    'meta-llama/llama-3.1-70b-instruct',
];

export function SettingsPage() {
    const [settings, setSettings] = useState(getSettings());
    const [saved, setSaved] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    const handleChange = (key, value) => {
        setSettings({ ...settings, [key]: value });
        setSaved(false);
    };

    const handleSave = () => {
        saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleExport = () => {
        const data = exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zen-gen-study-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        clearAllData();
        setSettings(getSettings());
        setShowResetModal(false);
        window.location.reload();
    };

    return (
        <div className="settings-page">
            <div className="settings-container">
                <h1 className="settings-title">설정</h1>

                {/* AI 설정 */}
                <section className="settings-section">
                    <h2 className="settings-section-title">AI 설정</h2>

                    <div className="settings-field">
                        <label className="settings-label">
                            OpenRouter API 키
                            <a
                                href="https://openrouter.ai/keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="settings-link"
                            >
                                키 발급받기
                            </a>
                        </label>
                        <Input
                            type="password"
                            value={settings.apiKey}
                            onChange={(e) => handleChange('apiKey', e.target.value)}
                            placeholder="sk-or-..."
                        />
                        <span className="settings-hint">
                            OpenRouter에서 발급받은 API 키를 입력하세요. 키는 브라우저에만 저장되며 외부로 전송되지 않아요.
                        </span>
                    </div>

                    <div className="settings-field">
                        <label className="settings-label">
                            AI 모델
                            <a
                                href="https://openrouter.ai/models"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="settings-link"
                            >
                                모델 목록 보기
                            </a>
                        </label>
                        <Input
                            type="text"
                            value={settings.model}
                            onChange={(e) => handleChange('model', e.target.value)}
                            placeholder="google/gemini-2.0-flash-001"
                        />
                        <div className="model-suggestions">
                            <span className="model-suggestions-label">추천 모델:</span>
                            <div className="model-chips">
                                {RECOMMENDED_MODELS.map((model) => (
                                    <button
                                        key={model}
                                        type="button"
                                        className={`model-chip ${settings.model === model ? 'model-chip--active' : ''}`}
                                        onClick={() => handleChange('model', model)}
                                    >
                                        {model.split('/')[1]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <span className="settings-hint">
                            OpenRouter에서 지원하는 모델 이름을 입력하세요. 예: google/gemini-2.0-flash-001
                        </span>
                    </div>

                    <div className="settings-field">
                        <label className="settings-label">최대 토큰 수</label>
                        <Input
                            type="number"
                            value={settings.maxTokens}
                            onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 2048)}
                            min={256}
                            max={16384}
                        />
                        <span className="settings-hint">
                            AI 응답의 최대 길이를 설정해요. 높을수록 긴 응답을 받을 수 있지만 비용이 증가해요.
                        </span>
                    </div>

                    <div className="settings-field">
                        <label className="settings-label">Temperature: {settings.temperature}</label>
                        <input
                            type="range"
                            className="settings-range"
                            value={settings.temperature}
                            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                            min={0}
                            max={1}
                            step={0.1}
                        />
                        <span className="settings-hint">
                            낮을수록 일관된 응답, 높을수록 창의적인 응답을 생성해요.
                        </span>
                    </div>
                </section>

                {/* 데이터 관리 */}
                <section className="settings-section">
                    <h2 className="settings-section-title">데이터 관리</h2>

                    <div className="settings-actions">
                        <Button variant="secondary" onClick={handleExport}>
                            데이터 내보내기
                        </Button>
                        <Button variant="danger" onClick={() => setShowResetModal(true)}>
                            모든 데이터 삭제
                        </Button>
                    </div>
                </section>

                {/* 저장 버튼 */}
                <div className="settings-save">
                    <Button variant="primary" size="lg" onClick={handleSave}>
                        {saved ? '저장되었습니다!' : '설정 저장'}
                    </Button>
                </div>
            </div>

            {/* 삭제 확인 모달 */}
            <Modal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                title="데이터 삭제"
                size="sm"
            >
                <div className="reset-modal-content">
                    <p>모든 학습 기록, 채팅 내역, 설정이 삭제돼요. 이 작업은 되돌릴 수 없어요.</p>
                    <div className="reset-modal-actions">
                        <Button variant="ghost" onClick={() => setShowResetModal(false)}>
                            취소
                        </Button>
                        <Button variant="danger" onClick={handleReset}>
                            삭제하기
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
