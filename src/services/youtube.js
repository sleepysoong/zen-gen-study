/**
 * YouTube 관련 서비스
 * - URL 파싱 및 비디오 ID 추출
 * - 자막/스크립트 데이터 가져오기
 */

/**
 * YouTube URL에서 비디오 ID 추출
 * @param {string} url - YouTube URL
 * @returns {string|null} - 비디오 ID 또는 null
 */
export function extractVideoId(url) {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * YouTube oEmbed API를 사용해 영상 정보 가져오기
 * @param {string} videoId - YouTube 비디오 ID
 * @returns {Promise<Object>} - 영상 정보
 */
export async function getVideoInfo(videoId) {
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
      thumbnailUrlFallback: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  } catch (error) {
    console.error('영상 정보 가져오기 실패:', error);
    return {
      id: videoId,
      title: '제목을 불러올 수 없습니다',
      author: '',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  }
}

/**
 * 자막 데이터를 가져오기
 * @param {string} videoId - YouTube 비디오 ID
 * @param {string} lang - 언어 코드 (기본: 'ko')
 * @returns {Promise<Object>} - 자막 데이터
 */
export async function getTranscript(videoId, lang = 'ko') {
  try {
    // 1. Vercel API 사용 시도 (배포 환경)
    const apiResponse = await fetch(`/api/transcript?videoId=${videoId}&lang=${lang}`);

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      if (data.fullText) {
        return data;
      }
    }
  } catch (e) {
    console.log('API route not available, trying alternative methods...');
  }

  try {
    // 2. 무료 외부 API 서비스 사용
    const transcript = await fetchFromExternalAPI(videoId, lang);
    if (transcript.fullText) {
      return transcript;
    }
  } catch (e) {
    console.log('External API failed:', e.message);
  }

  // 3. 모든 방법 실패 시 빈 데이터 반환 (사용자가 직접 입력)
  return {
    videoId,
    language: lang,
    segments: [],
    fullText: '',
    error: '자막을 자동으로 가져올 수 없습니다. 영상 내용을 직접 입력해주세요.'
  };
}

/**
 * 외부 무료 API를 통한 자막 가져오기
 */
async function fetchFromExternalAPI(videoId, lang) {
  // Youtubetranscript.com API (무료, CORS 지원)
  const apiUrl = `https://youtubetranscript.com/?server_vid2=${videoId}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('API 요청 실패');
    }

    const text = await response.text();

    // XML 파싱
    const segments = [];
    const textRegex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
    let match;

    while ((match = textRegex.exec(text)) !== null) {
      const start = parseFloat(match[1]);
      const duration = parseFloat(match[2]);
      const content = match[3]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();

      if (content) {
        segments.push({ start, duration, text: content });
      }
    }

    const fullText = segments.map(s => s.text).join(' ');

    if (!fullText) {
      throw new Error('자막 내용이 비어있습니다');
    }

    return {
      videoId,
      language: lang,
      segments,
      fullText,
    };
  } catch (error) {
    throw new Error(`외부 API 실패: ${error.message}`);
  }
}

/**
 * 자막 세그먼트를 전체 텍스트로 변환
 * @param {Array} segments - 자막 세그먼트 배열
 * @returns {string} - 전체 텍스트
 */
export function segmentsToText(segments) {
  if (!segments || segments.length === 0) return '';
  return segments.map(seg => seg.text).join(' ');
}

/**
 * 시간(초)을 MM:SS 형식으로 변환
 * @param {number} seconds - 초
 * @returns {string} - MM:SS 형식 문자열
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * YouTube 임베드 URL 생성
 * @param {string} videoId - YouTube 비디오 ID
 * @param {number} startTime - 시작 시간 (초)
 * @returns {string} - 임베드 URL
 */
export function getEmbedUrl(videoId, startTime = 0) {
  return `https://www.youtube.com/embed/${videoId}?start=${startTime}&enablejsapi=1`;
}
