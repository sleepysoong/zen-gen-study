/**
 * SettingsPage 컴포넌트
 * 사용자 설정을 관리하는 페이지입니다.
 */

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { getSettings, saveSettings, clearAllData, exportAllData } from '../services/storage';
import type { UserSettings } from '../types';
import './SettingsPage.css';

// ============================================
// 상수
// ============================================

/** 추천 AI 모델 목록 */
const RECOMMENDED_MODELS = [
    'google/gemini-2.0-flash-001',
    'google/gemini-2.5-flash-preview',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o-mini',
];

// ============================================
// 컴포넌트
// ============================================

/**
 * 설정 페이지 컴포넌트
 */
export function SettingsPage() {
    const [settings, setSettings] = useState<UserSettings>(() => getSettings());
    const [saved, setSaved] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // 설정 변경 핸들러
    const handleChange = (key: keyof UserSettings, value: string | number) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    // 설정 저장
    const handleSave = (e: FormEvent) => {
        e.preventDefault();
        saveSettings(settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // 데이터 내보내기
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

    // 데이터 초기화
    const handleReset = () => {
        clearAllData();
        setSettings(getSettings());
        setShowResetModal(false);
    };

    return (
        <div className="settings-page">
            <h1 className="settings-title">설정</h1>

            <form className="settings-form" onSubmit={handleSave}>
                {/* API 설정 */}
                <section className="settings-section">
                    <h2 className="settings-section-title">API 설정</h2>

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
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('apiKey', e.target.value)}
                            placeholder="sk-or-v1-..."
                        />
                        <span className="settings-hint">API 키는 브라우저에만 저장되며 외부로 전송되지 않습니다.</span>
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
                            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('model', e.target.value)}
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
                        <span className="settings-hint">OpenRouter에서 지원하는 모델 이름을 입력하세요.</span>
                    </div>
                </section>

                {/* 생성 설정 */}
                <section className="settings-section">
                    <h2 className="settings-section-title">생성 설정</h2>

                    <div className="settings-field">
                        <label className="settings-label">
                            최대 토큰 수 <span className="settings-value">{settings.maxTokens}</span>
                        </label>
                        <input
                            type="range"
                            min="512"
                            max="8192"
                            step="512"
                            value={settings.maxTokens}
                            onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                            className="settings-range"
                        />
                        <span className="settings-hint">응답의 최대 길이를 설정합니다. 높을수록 더 긴 응답을 받을 수 있습니다.</span>
                    </div>

                    <div className="settings-field">
                        <label className="settings-label">
                            Temperature <span className="settings-value">{settings.temperature}</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.temperature}
                            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                            className="settings-range"
                        />
                        <span className="settings-hint">낮을수록 일관된 응답, 높을수록 창의적인 응답을 생성합니다.</span>
                    </div>
                </section>

                {/* 저장 버튼 */}
                <div className="settings-actions">
                    <Button type="submit" variant="primary">
                        {saved ? '저장됨!' : '설정 저장'}
                    </Button>
                </div>
            </form>

            {/* 데이터 관리 */}
            <section className="settings-section">
                <h2 className="settings-section-title">데이터 관리</h2>
                <div className="settings-data-actions">
                    <Button variant="secondary" onClick={handleExport}>
                        데이터 내보내기
                    </Button>
                    <Button variant="danger" onClick={() => setShowResetModal(true)}>
                        모든 데이터 삭제
                    </Button>
                </div>
            </section>

            {/* 초기화 확인 모달 */}
            <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="데이터 삭제">
                <div className="settings-reset-modal">
                    <p>모든 설정과 학습 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
                    <div className="settings-reset-actions">
                        <Button variant="ghost" onClick={() => setShowResetModal(false)}>
                            취소
                        </Button>
                        <Button variant="danger" onClick={handleReset}>
                            삭제
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
