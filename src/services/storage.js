/**
 * LocalStorage 기반 저장소 서비스
 * - 학습 히스토리 관리
 * - 설정 값 저장
 * - 채팅 기록 저장
 */

const STORAGE_KEYS = {
    SETTINGS: 'zen-gen-study-settings',
    HISTORY: 'zen-gen-study-history',
    CHATS: 'zen-gen-study-chats'
};

/**
 * 기본 설정 값
 */
const DEFAULT_SETTINGS = {
    apiKey: '',
    model: 'google/gemini-2.0-flash-001',
    maxTokens: 4096,
    temperature: 0.7
};

/* ========================================
   설정 관련 함수
   ======================================== */

/**
 * 설정 가져오기
 * @returns {Object} - 설정 객체
 */
export function getSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('설정 불러오기 실패:', error);
    }
    return DEFAULT_SETTINGS;
}

/**
 * 설정 저장하기
 * @param {Object} settings - 저장할 설정
 */
export function saveSettings(settings) {
    try {
        const current = getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        return updated;
    } catch (error) {
        console.error('설정 저장 실패:', error);
        throw error;
    }
}

/**
 * 설정 초기화
 */
export function resetSettings() {
    try {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error('설정 초기화 실패:', error);
        throw error;
    }
}

/* ========================================
   학습 히스토리 관련 함수
   ======================================== */

/**
 * 학습 히스토리 가져오기
 * @returns {Array} - 히스토리 배열
 */
export function getHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('히스토리 불러오기 실패:', error);
    }
    return [];
}

/**
 * 학습 항목 저장하기
 * @param {Object} item - 학습 항목
 */
export function saveHistoryItem(item) {
    try {
        const history = getHistory();

        // 같은 비디오가 있으면 업데이트
        const existingIndex = history.findIndex(h => h.videoId === item.videoId);

        const newItem = {
            ...item,
            id: item.id || generateId(),
            updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            history[existingIndex] = { ...history[existingIndex], ...newItem };
        } else {
            newItem.createdAt = new Date().toISOString();
            history.unshift(newItem);
        }

        // 최대 50개까지만 저장
        const trimmed = history.slice(0, 50);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));

        return newItem;
    } catch (error) {
        console.error('히스토리 저장 실패:', error);
        throw error;
    }
}

/**
 * 특정 학습 항목 가져오기
 * @param {string} videoId - YouTube 비디오 ID
 * @returns {Object|null} - 학습 항목 또는 null
 */
export function getHistoryItem(videoId) {
    const history = getHistory();
    return history.find(item => item.videoId === videoId) || null;
}

/**
 * 학습 항목 삭제하기
 * @param {string} id - 항목 ID
 */
export function deleteHistoryItem(id) {
    try {
        const history = getHistory();
        const filtered = history.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
    } catch (error) {
        console.error('히스토리 삭제 실패:', error);
        throw error;
    }
}

/**
 * 전체 히스토리 삭제
 */
export function clearHistory() {
    try {
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (error) {
        console.error('히스토리 초기화 실패:', error);
        throw error;
    }
}

/* ========================================
   채팅 관련 함수
   ======================================== */

/**
 * 특정 비디오의 채팅 세션들 가져오기
 * @param {string} videoId - YouTube 비디오 ID
 * @returns {Array} - 채팅 세션 배열
 */
export function getChatSessions(videoId) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CHATS);
        if (stored) {
            const allChats = JSON.parse(stored);
            return allChats[videoId] || [];
        }
    } catch (error) {
        console.error('채팅 세션 불러오기 실패:', error);
    }
    return [];
}

/**
 * 채팅 세션 저장하기
 * @param {string} videoId - YouTube 비디오 ID
 * @param {Object} session - 채팅 세션
 */
export function saveChatSession(videoId, session) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CHATS);
        const allChats = stored ? JSON.parse(stored) : {};

        if (!allChats[videoId]) {
            allChats[videoId] = [];
        }

        const existingIndex = allChats[videoId].findIndex(s => s.id === session.id);

        const newSession = {
            ...session,
            id: session.id || generateId(),
            updatedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            allChats[videoId][existingIndex] = newSession;
        } else {
            newSession.createdAt = new Date().toISOString();
            allChats[videoId].unshift(newSession);
        }

        // 비디오당 최대 10개 세션
        allChats[videoId] = allChats[videoId].slice(0, 10);

        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));

        return newSession;
    } catch (error) {
        console.error('채팅 세션 저장 실패:', error);
        throw error;
    }
}

/**
 * 채팅 세션 삭제하기
 * @param {string} videoId - YouTube 비디오 ID
 * @param {string} sessionId - 세션 ID
 */
export function deleteChatSession(videoId, sessionId) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CHATS);
        if (!stored) return;

        const allChats = JSON.parse(stored);
        if (allChats[videoId]) {
            allChats[videoId] = allChats[videoId].filter(s => s.id !== sessionId);
            localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
        }
    } catch (error) {
        console.error('채팅 세션 삭제 실패:', error);
        throw error;
    }
}

/**
 * 특정 비디오의 모든 채팅 삭제
 * @param {string} videoId - YouTube 비디오 ID
 */
export function clearVideoChats(videoId) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CHATS);
        if (!stored) return;

        const allChats = JSON.parse(stored);
        delete allChats[videoId];
        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(allChats));
    } catch (error) {
        console.error('채팅 초기화 실패:', error);
        throw error;
    }
}

/**
 * 전체 채팅 데이터 삭제
 */
export function clearAllChats() {
    try {
        localStorage.removeItem(STORAGE_KEYS.CHATS);
    } catch (error) {
        console.error('전체 채팅 초기화 실패:', error);
        throw error;
    }
}

/* ========================================
   유틸리티 함수
   ======================================== */

/**
 * 랜덤 ID 생성
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 전체 데이터 내보내기
 * @returns {Object} - 전체 저장 데이터
 */
export function exportAllData() {
    return {
        settings: getSettings(),
        history: getHistory(),
        chats: JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '{}'),
        exportedAt: new Date().toISOString()
    };
}

/**
 * 데이터 가져오기
 * @param {Object} data - 가져올 데이터
 */
export function importData(data) {
    try {
        if (data.settings) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        }
        if (data.history) {
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
        }
        if (data.chats) {
            localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(data.chats));
        }
    } catch (error) {
        console.error('데이터 가져오기 실패:', error);
        throw error;
    }
}

/**
 * 전체 데이터 삭제
 */
export function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
        localStorage.removeItem(STORAGE_KEYS.CHATS);
    } catch (error) {
        console.error('전체 데이터 삭제 실패:', error);
        throw error;
    }
}
