/**
 * YouTube 자막 추출 API
 * Vercel Serverless Function
 */
import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId, lang = 'ko' } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    try {
        // youtube-transcript 패키지를 사용하여 자막 가져오기
        // 자동 생성 자막도 지원됨
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: lang,
        });

        if (!transcriptItems || transcriptItems.length === 0) {
            // 한국어 자막이 없으면 영어 시도
            const englishTranscript = await YoutubeTranscript.fetchTranscript(videoId, {
                lang: 'en',
            }).catch(() => null);

            if (englishTranscript && englishTranscript.length > 0) {
                return formatAndSend(res, videoId, 'en', englishTranscript);
            }

            // 영어도 없으면 언어 지정 없이 시도 (자동 생성 자막 포함)
            const anyTranscript = await YoutubeTranscript.fetchTranscript(videoId).catch(() => null);

            if (anyTranscript && anyTranscript.length > 0) {
                return formatAndSend(res, videoId, 'auto', anyTranscript);
            }

            return res.status(404).json({
                error: '이 영상에는 자막이 없습니다.',
                videoId,
            });
        }

        return formatAndSend(res, videoId, lang, transcriptItems);
    } catch (error) {
        console.error('Transcript fetch error:', error);

        // 에러 발생 시 언어 지정 없이 재시도
        try {
            const fallbackTranscript = await YoutubeTranscript.fetchTranscript(videoId);
            if (fallbackTranscript && fallbackTranscript.length > 0) {
                return formatAndSend(res, videoId, 'auto', fallbackTranscript);
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
        }

        return res.status(500).json({
            error: error.message || '자막을 가져올 수 없습니다.',
            videoId,
        });
    }
}

function formatAndSend(res, videoId, language, transcriptItems) {
    const segments = transcriptItems.map((item) => ({
        start: item.offset / 1000, // ms to seconds
        duration: item.duration / 1000,
        text: item.text,
    }));

    const fullText = segments.map((s) => s.text).join(' ');

    return res.status(200).json({
        videoId,
        language,
        segments,
        fullText,
        segmentCount: segments.length,
    });
}
