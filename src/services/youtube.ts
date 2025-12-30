/**
 * YouTube 관련 서비스
 * URL 파싱, 영상 정보 조회, 자막 추출 기능을 제공합니다.
 */

import type { VideoInfo, TranscriptData } from '../types';

// ============================================
// URL 파싱
// ============================================

/**
 * YouTube URL에서 비디오 ID를 추출합니다.
 */
export function extractVideoId(url: string): string | null {
    if (!url) return null;

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

// ============================================
// 영상 정보 조회
// ============================================

/**
 * YouTube oEmbed API를 사용해 영상 정보를 가져옵니다.
 */
export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
    try {
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );

        if (!response.ok) {
            throw new Error('영상 정보를 가져올 수 없습니다.');
        }

        const data = await response.json();

        return {
            id: videoId,
            title: data.title,
            author: data.author_name,
            authorUrl: data.author_url,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            thumbnailUrlFallback: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };
    } catch (error) {
        console.error('영상 정보 가져오기 실패:', error);
        return {
            id: videoId,
            title: '제목을 불러올 수 없습니다',
            author: '',
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };
    }
}

// ============================================
// 자막 추출
// ============================================

/**
 * 자막 데이터를 가져옵니다.
 * Vercel API를 통해 자막을 추출합니다.
 */
export async function getTranscript(videoId: string, lang = 'ko'): Promise<TranscriptData> {
    try {
        const apiResponse = await fetch(`/api/transcript?videoId=${videoId}&lang=${lang}`);

        if (apiResponse.ok) {
            const data: TranscriptData = await apiResponse.json();

            if (data.fullText && data.fullText.trim()) {
                return data;
            }

            if (data.error) {
                console.warn('자막 API 오류:', data.error);
            }
        } else {
            const errorData = await apiResponse.json().catch(() => ({}));
            console.warn('자막 API 응답 실패:', apiResponse.status, errorData.error);
        }
    } catch (e) {
        console.warn('자막 API 호출 실패:', e instanceof Error ? e.message : e);
    }

    // API 실패 시 빈 데이터 반환
    return {
        videoId,
        language: lang,
        segments: [],
        fullText: '',
        error: '자막을 자동으로 가져올 수 없습니다. 영상 내용을 직접 입력해주세요.',
    };
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 자막 세그먼트를 전체 텍스트로 변환합니다.
 */
export function segmentsToText(segments: { text: string }[]): string {
    if (!segments || segments.length === 0) return '';
    return segments.map((seg) => seg.text).join(' ');
}

/**
 * 시간(초)을 MM:SS 형식으로 변환합니다.
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * YouTube 임베드 URL을 생성합니다.
 */
export function getEmbedUrl(videoId: string, startTime = 0): string {
    return `https://www.youtube.com/embed/${videoId}?start=${startTime}&enablejsapi=1`;
}
