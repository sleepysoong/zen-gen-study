/**
 * YouTube 관련 서비스
 * URL 파싱, 영상 정보 조회, 자막 추출 기능을 제공합니다.
 *
 * 자막 추출: 클라이언트에서 직접 Innertube API 호출 (Vercel IP 차단 우회)
 */

import type { VideoInfo, TranscriptData, TranscriptSegment } from '../types';

// ============================================
// 상수
// ============================================

const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player';
const DEFAULT_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

// ANDROID 클라이언트 사용
const INNERTUBE_CONTEXT = {
    client: {
        clientName: 'ANDROID',
        clientVersion: '19.09.37',
        androidSdkVersion: 30,
        hl: 'ko',
        gl: 'KR',
    },
};

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
// 자막 추출 (클라이언트 사이드)
// ============================================

/**
 * 자막 데이터를 가져옵니다.
 * 1차: 서버 API 시도
 * 2차: 클라이언트에서 직접 Innertube API 호출
 */
export async function getTranscript(videoId: string, lang = 'ko'): Promise<TranscriptData> {
    // 방법 1: 서버 API 시도
    try {
        const apiResponse = await fetch(`/api/transcript?videoId=${videoId}&lang=${lang}`);

        if (apiResponse.ok) {
            const data: TranscriptData = await apiResponse.json();

            if (data.fullText && data.fullText.trim()) {
                console.log('서버 API로 자막 가져오기 성공');
                return data;
            }
        }

        const errorData = await apiResponse.json().catch(() => ({}));
        console.warn('서버 API 실패:', errorData.error);
    } catch (e) {
        console.warn('서버 API 호출 실패:', e);
    }

    // 방법 2: 클라이언트에서 직접 Innertube API 호출
    try {
        console.log('클라이언트에서 직접 자막 추출 시도...');
        return await fetchTranscriptDirect(videoId, lang);
    } catch (e) {
        console.warn('클라이언트 직접 추출 실패:', e);
    }

    // 실패 시 빈 데이터 반환
    return {
        videoId,
        language: lang,
        segments: [],
        fullText: '',
        error: '자막을 자동으로 가져올 수 없습니다. 영상 내용을 직접 입력해주세요.',
    };
}

/**
 * 클라이언트에서 직접 Innertube API를 호출하여 자막을 가져옵니다.
 */
async function fetchTranscriptDirect(videoId: string, preferredLang: string): Promise<TranscriptData> {
    // Innertube API 호출
    const apiUrl = `${INNERTUBE_API_URL}?key=${DEFAULT_API_KEY}`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            context: INNERTUBE_CONTEXT,
            videoId: videoId,
        }),
    });

    if (!response.ok) {
        throw new Error('YouTube API 요청 실패');
    }

    const data = await response.json();

    // Playability 확인
    const status = data.playabilityStatus?.status;
    const reason = data.playabilityStatus?.reason;

    if (status === 'LOGIN_REQUIRED') {
        throw new Error(reason || '로그인이 필요합니다.');
    }

    if (status !== 'OK') {
        throw new Error(reason || '영상을 재생할 수 없습니다.');
    }

    // 자막 트랙 확인
    const captionsRenderer = data.captions?.playerCaptionsTracklistRenderer;
    if (!captionsRenderer) {
        throw new Error('이 영상에는 자막이 비활성화되어 있습니다.');
    }

    const captionTracks = captionsRenderer.captionTracks || [];
    if (captionTracks.length === 0) {
        throw new Error('이 영상에는 사용 가능한 자막이 없습니다.');
    }

    // 자막 트랙 선택
    const targetTrack = selectTrack(captionTracks, preferredLang);

    // 자막 데이터 가져오기 (JSON3 형식)
    let transcriptUrl = targetTrack.baseUrl;
    transcriptUrl = transcriptUrl.replace('&fmt=srv3', '&fmt=json3');
    if (!transcriptUrl.includes('fmt=')) {
        transcriptUrl += '&fmt=json3';
    }

    const transcriptResponse = await fetch(transcriptUrl);

    if (!transcriptResponse.ok) {
        throw new Error('자막 데이터를 가져올 수 없습니다.');
    }

    const transcriptText = await transcriptResponse.text();

    // 파싱
    let segments: TranscriptSegment[];
    try {
        const json = JSON.parse(transcriptText);
        segments = parseJson3(json);
    } catch {
        segments = parseSrv3Xml(transcriptText);
    }

    if (segments.length === 0) {
        throw new Error('자막 내용을 파싱할 수 없습니다.');
    }

    const fullText = segments.map((s) => s.text).join(' ');

    // 언어 이름 추출
    let languageName = targetTrack.languageCode;
    if (targetTrack.name?.runs?.[0]) {
        languageName = targetTrack.name.runs[0].text;
    } else if (targetTrack.name?.simpleText) {
        languageName = targetTrack.name.simpleText;
    }

    return {
        videoId,
        language: targetTrack.languageCode || preferredLang,
        languageName,
        segments,
        fullText,
        segmentCount: segments.length,
        isAutoGenerated: targetTrack.kind === 'asr',
    };
}

// ============================================
// 헬퍼 함수
// ============================================

interface CaptionTrack {
    baseUrl: string;
    languageCode: string;
    kind?: string;
    name?: {
        runs?: Array<{ text: string }>;
        simpleText?: string;
    };
}

/**
 * 우선순위에 따라 자막 트랙 선택
 */
function selectTrack(tracks: CaptionTrack[], preferredLang: string): CaptionTrack {
    const manualTracks = tracks.filter((t) => t.kind !== 'asr');
    const generatedTracks = tracks.filter((t) => t.kind === 'asr');

    const findTrack = (list: CaptionTrack[], lang: string) => list.find((t) => t.languageCode === lang);

    let target = findTrack(manualTracks, preferredLang);
    if (!target) target = findTrack(generatedTracks, preferredLang);
    if (!target) target = findTrack(manualTracks, 'ko');
    if (!target) target = findTrack(generatedTracks, 'ko');
    if (!target) target = findTrack(manualTracks, 'en');
    if (!target) target = findTrack(generatedTracks, 'en');
    if (!target) target = tracks[0];

    if (!target || !target.baseUrl) {
        throw new Error('자막 URL을 찾을 수 없습니다.');
    }

    return target;
}

interface Json3Event {
    tStartMs?: number;
    dDurationMs?: number;
    segs?: Array<{ utf8?: string }>;
}

/**
 * JSON3 형식 파싱
 */
function parseJson3(json: { events?: Json3Event[] }): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    if (!json.events) return segments;

    for (const event of json.events) {
        if (event.segs) {
            const text = event.segs
                .map((s) => s.utf8 || '')
                .join('')
                .trim();
            if (text) {
                segments.push({
                    start: (event.tStartMs || 0) / 1000,
                    duration: (event.dDurationMs || 0) / 1000,
                    text,
                });
            }
        }
    }

    return segments;
}

/**
 * srv3 XML 형식 파싱
 */
function parseSrv3Xml(xmlText: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    // <p t="시작ms" d="지속ms">...</p> 형식
    const pTagRegex = /<p\s+t="(\d+)"(?:\s+d="(\d+)")?[^>]*>([\s\S]*?)<\/p>/g;
    let match;

    while ((match = pTagRegex.exec(xmlText)) !== null) {
        const startMs = parseInt(match[1]);
        const durationMs = parseInt(match[2] || '0');
        const content = match[3];

        let text = '';
        const sTagRegex = /<s[^>]*>([^<]*)<\/s>/g;
        let sMatch;
        while ((sMatch = sTagRegex.exec(content)) !== null) {
            text += sMatch[1];
        }

        if (!text) {
            text = content.replace(/<[^>]*>/g, '');
        }

        text = decodeHtmlEntities(text.trim());
        if (text) {
            segments.push({
                start: startMs / 1000,
                duration: durationMs / 1000,
                text,
            });
        }
    }

    // 레거시 <text> 형식
    if (segments.length === 0) {
        const textRegex = /<text\s+start="([^"]+)"(?:\s+dur="([^"]+)")?[^>]*>([\s\S]*?)<\/text>/g;
        while ((match = textRegex.exec(xmlText)) !== null) {
            const start = parseFloat(match[1]);
            const duration = parseFloat(match[2] || '0');
            let text = match[3].replace(/<[^>]*>/g, '');
            text = decodeHtmlEntities(text.trim());
            if (text) {
                segments.push({ start, duration, text });
            }
        }
    }

    return segments;
}

function decodeHtmlEntities(text: string): string {
    if (!text) return '';

    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/\n/g, ' ');
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
