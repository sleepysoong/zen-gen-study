/**
 * YouTube 자막 추출 테스트 - srv3 형식 파싱
 */

const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const VIDEO_ID = 'JK-3_sWW1lA';

async function main() {
    console.log('=== YouTube Transcript Test (srv3 format) ===');
    console.log('Video ID:', VIDEO_ID);

    try {
        // Innertube API 호출
        console.log('\n[Step 1] Calling Innertube API...');
        const response = await fetch(INNERTUBE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                context: {
                    client: {
                        clientName: 'ANDROID',
                        clientVersion: '19.09.37',
                        androidSdkVersion: 30,
                        hl: 'ko',
                        gl: 'KR',
                    }
                },
                videoId: VIDEO_ID,
            }),
        });

        const data = await response.json();
        console.log('Playability:', data.playabilityStatus?.status);

        const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        console.log('Tracks:', tracks.length);

        if (tracks.length === 0) return;

        // fmt=srv3 제거하고 JSON 형식 요청
        let url = tracks[0].baseUrl;
        url = url.replace('&fmt=srv3', '&fmt=json3');  // JSON 형식으로 요청

        console.log('\n[Step 2] Fetching transcript (JSON format)...');
        const transcriptResponse = await fetch(url);
        const transcriptText = await transcriptResponse.text();
        console.log('Response length:', transcriptText.length);

        // JSON 파싱 시도
        try {
            const json = JSON.parse(transcriptText);
            console.log('JSON parsed successfully');
            console.log('Events count:', json.events?.length || 0);

            if (json.events && json.events.length > 0) {
                const segments = [];

                for (const event of json.events) {
                    if (event.segs) {
                        const text = event.segs.map(s => s.utf8 || '').join('');
                        if (text.trim()) {
                            segments.push({
                                start: (event.tStartMs || 0) / 1000,
                                duration: (event.dDurationMs || 0) / 1000,
                                text: text.trim(),
                            });
                        }
                    }
                }

                console.log('\nParsed segments:', segments.length);
                console.log('First 5 segments:');
                segments.slice(0, 5).forEach((s, i) => {
                    const mins = Math.floor(s.start / 60);
                    const secs = Math.floor(s.start % 60);
                    console.log(`  [${mins}:${secs.toString().padStart(2, '0')}] ${s.text}`);
                });

                const fullText = segments.map(s => s.text).join(' ');
                console.log('\nTotal text length:', fullText.length);
                console.log('Sample text:', fullText.substring(0, 300) + '...');

                console.log('\n=== SUCCESS ===');
            }
        } catch (e) {
            console.log('Not JSON, trying XML parse...');
            console.log('First 500 chars:', transcriptText.substring(0, 500));

            // srv3 XML 파싱 (<p> 및 <s> 태그)
            const segments = parseSrv3Xml(transcriptText);
            console.log('\nParsed segments:', segments.length);

            if (segments.length > 0) {
                console.log('First 5:');
                segments.slice(0, 5).forEach((s, i) => {
                    console.log(`  [${s.start.toFixed(1)}s] ${s.text}`);
                });
                console.log('\n=== SUCCESS ===');
            }
        }

    } catch (error) {
        console.error('\n=== ERROR ===');
        console.error(error.message);
    }
}

function parseSrv3Xml(xmlText) {
    const segments = [];

    // <p t="시작ms" d="지속ms">...</p> 형식 파싱
    const pTagRegex = /<p\s+t="(\d+)"(?:\s+d="(\d+)")?[^>]*>([\s\S]*?)<\/p>/g;
    let match;

    while ((match = pTagRegex.exec(xmlText)) !== null) {
        const startMs = parseInt(match[1]);
        const durationMs = parseInt(match[2] || '0');
        const content = match[3];

        // <s> 태그 안의 텍스트 추출
        let text = '';
        const sTagRegex = /<s[^>]*>([^<]*)<\/s>/g;
        let sMatch;
        while ((sMatch = sTagRegex.exec(content)) !== null) {
            text += sMatch[1];
        }

        // <s> 태그가 없으면 전체 내용 사용
        if (!text) {
            text = content.replace(/<[^>]*>/g, '');
        }

        text = text.trim();
        if (text) {
            segments.push({
                start: startMs / 1000,
                duration: durationMs / 1000,
                text,
            });
        }
    }

    return segments;
}

main();
