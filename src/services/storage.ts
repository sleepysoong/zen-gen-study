/**
 * 로컬 스토리지 서비스
 * 사용자 설정, 학습 히스토리, 채팅 세션을 관리합니다.
 */

import type {
    UserSettings,
    HistoryItem,
    ChatSession,
    Quiz,
    RelatedKeyword,
} from '../types';

// ============================================
// 스토리지 키
// ============================================

const STORAGE_KEYS = {
    SETTINGS: 'zen-gen-study-settings',
    HISTORY: 'zen-gen-study-history',
    CHAT_SESSIONS: 'zen-gen-study-chat-sessions',
} as const;

// ============================================
// 기본값
// ============================================

const DEFAULT_SETTINGS: UserSettings = {
    apiKey: '',
    model: 'google/gemini-2.0-flash-001',
    maxTokens: 4096,
    temperature: 0.7,
};

const MAX_HISTORY_ITEMS = 50;
const MAX_CHAT_SESSIONS_PER_VIDEO = 10;

// ============================================
// 설정 관련 함수
// ============================================

/**
 * 사용자 설정을 가져옵니다.
 */
export function getSettings(): UserSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('설정 로드 실패:', error);
    }
    return { ...DEFAULT_SETTINGS };
}

/**
 * 사용자 설정을 저장합니다.
 */
export function saveSettings(settings: Partial<UserSettings>): void {
    try {
        const current = getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (error) {
        console.error('설정 저장 실패:', error);
    }
}

// ============================================
// 히스토리 관련 함수
// ============================================

/**
 * 모든 학습 히스토리를 가져옵니다.
 */
export function getHistory(): HistoryItem[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('히스토리 로드 실패:', error);
    }
    return [];
}

/**
 * 특정 비디오의 히스토리 항목을 가져옵니다.
 */
export function getHistoryItem(videoId: string): HistoryItem | null {
    const history = getHistory();
    return history.find((item) => item.videoId === videoId) || null;
}

/**
 * 학습 히스토리 항목을 저장합니다.
 */
export function saveHistoryItem(item: HistoryItem): void {
    try {
        const history = getHistory();
        const existingIndex = history.findIndex((h) => h.videoId === item.videoId);

        const newItem: HistoryItem = {
            ...item,
            updatedAt: Date.now(),
            createdAt: item.createdAt || Date.now(),
        };

        if (existingIndex >= 0) {
            history[existingIndex] = newItem;
        } else {
            history.unshift(newItem);
        }

        // 최대 개수 제한
        const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('히스토리 저장 실패:', error);
    }
}

/**
 * 특정 히스토리 항목을 삭제합니다.
 */
export function deleteHistoryItem(videoId: string): void {
    try {
        const history = getHistory();
        const filtered = history.filter((h) => h.videoId !== videoId);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
    } catch (error) {
        console.error('히스토리 삭제 실패:', error);
    }
}

// ============================================
// 채팅 세션 관련 함수
// ============================================

/**
 * 특정 비디오의 채팅 세션 목록을 가져옵니다.
 */
export function getChatSessions(videoId: string): ChatSession[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
        if (stored) {
            const all: Record<string, ChatSession[]> = JSON.parse(stored);
            return all[videoId] || [];
        }
    } catch (error) {
        console.error('채팅 세션 로드 실패:', error);
    }
    return [];
}

/**
 * 채팅 세션을 저장합니다.
 */
export function saveChatSession(videoId: string, session: ChatSession): void {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
        const all: Record<string, ChatSession[]> = stored ? JSON.parse(stored) : {};

        const sessions = all[videoId] || [];
        const existingIndex = sessions.findIndex((s) => s.id === session.id);

        const newSession: ChatSession = {
            ...session,
            createdAt: session.createdAt || Date.now(),
        };

        if (existingIndex >= 0) {
            sessions[existingIndex] = newSession;
        } else {
            sessions.unshift(newSession);
        }

        // 최대 개수 제한
        all[videoId] = sessions.slice(0, MAX_CHAT_SESSIONS_PER_VIDEO);
        localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(all));
    } catch (error) {
        console.error('채팅 세션 저장 실패:', error);
    }
}

// ============================================
// 데이터 관리 함수
// ============================================

/**
 * 모든 데이터를 삭제합니다.
 */
export function clearAllData(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
        localStorage.removeItem(STORAGE_KEYS.CHAT_SESSIONS);
    } catch (error) {
        console.error('데이터 삭제 실패:', error);
    }
}

/** 내보내기 데이터 타입 */
interface ExportData {
    settings: UserSettings;
    history: HistoryItem[];
    chatSessions: Record<string, ChatSession[]>;
    exportedAt: string;
}

/**
 * 모든 데이터를 내보냅니다.
 */
export function exportAllData(): ExportData {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    return {
        settings: getSettings(),
        history: getHistory(),
        chatSessions: stored ? JSON.parse(stored) : {},
        exportedAt: new Date().toISOString(),
    };
}

/**
 * 데이터를 가져옵니다.
 */
export function importData(data: ExportData): void {
    try {
        if (data.settings) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        }
        if (data.history) {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
        }
        if (data.chatSessions) {
            localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(data.chatSessions));
        }
    } catch (error) {
        console.error('데이터 가져오기 실패:', error);
    }
}
