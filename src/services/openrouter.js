/**
 * OpenRouter AI 서비스
 * - AI 모델 호출
 * - 스트리밍 응답 지원
 * - 학습 콘텐츠 생성
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * OpenRouter API 호출
 * @param {Object} options - API 호출 옵션
 * @returns {Promise<Object>} - AI 응답
 */
export async function callOpenRouter({
    apiKey,
    model = 'google/gemini-2.0-flash-001',
    messages,
    maxTokens = 4096,
    temperature = 0.7,
    stream = false,
    onStream = null
}) {
    if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. 설정에서 OpenRouter API 키를 입력해주세요.');
    }

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Zen Gen Study'
    };

    const body = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream
    };

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API 오류: ${response.status}`);
        }

        if (stream && onStream) {
            return handleStreamResponse(response, onStream);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    } catch (error) {
        console.error('OpenRouter API 호출 실패:', error);
        throw error;
    }
}

/**
 * 스트리밍 응답 처리
 */
async function handleStreamResponse(response, onStream) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) {
                            fullContent += content;
                            onStream(content, fullContent);
                        }
                    } catch (e) {
                        // JSON 파싱 실패 무시
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    return fullContent;
}

/**
 * 학습 콘텐츠 생성을 위한 시스템 프롬프트
 */
const SYSTEM_PROMPTS = {
    summary: `당신은 교육 전문가입니다. 주어진 영상 내용을 학습자가 이해하기 쉽게 핵심 내용을 정리해주세요.

규칙:
1. 핵심 개념을 명확하게 정리해주세요.
2. 특히 중요한 내용은 **굵게** 표시해주세요.
3. 단계별로 구조화해서 설명해주세요.
4. 어려운 용어는 쉽게 풀어서 설명해주세요.
5. 수학 공식이나 수식이 필요하면 LaTeX 문법을 사용하세요. (인라인: $수식$, 블록: $$수식$$)
6. 응답은 한국어로 작성해주세요.`,

    quiz: `당신은 교육 평가 전문가입니다. 주어진 영상 내용을 기반으로 학습자의 이해도를 확인할 수 있는 퀴즈를 생성해주세요.

규칙:
1. O/X 문제 3개와 단답형 문제 2개를 생성해주세요.
2. 각 문제에 대한 정답과 해설을 제공해주세요.
3. 난이도는 중간 수준으로 맞춰주세요.
4. 수학 관련 내용이면 LaTeX 문법을 사용하세요.
5. 응답은 반드시 아래 JSON 형식으로만 작성해주세요:

{
  "quizzes": [
    {
      "type": "ox",
      "question": "질문 내용",
      "answer": true,
      "explanation": "해설 내용"
    },
    {
      "type": "short",
      "question": "질문 내용",
      "answer": "정답",
      "explanation": "해설 내용"
    }
  ]
}`,

    thinkMore: `당신은 교육 전문가입니다. 주어진 영상 내용을 기반으로 학습자가 더 깊이 생각해볼 수 있는 질문이나 주제를 제안해주세요.

규칙:
1. 3-5개의 심화 질문 또는 토론 주제를 제시해주세요.
2. 비판적 사고를 유도하는 질문을 포함해주세요.
3. 실생활과 연결된 적용 사례를 제시해주세요.
4. 응답은 한국어로 작성해주세요.`,

    related: `당신은 교육 전문가입니다. 주어진 영상 내용과 관련된 개념, 주제, 키워드를 추천해주세요.

규칙:
1. 관련 개념 5-7개를 추천해주세요.
2. 각 개념에 대해 간단한 설명(1-2문장)을 덧붙여주세요.
3. 수학: 관련 공식, 정리
4. 영어: 유사한 문법, 표현
5. 과학: 관련 법칙, 원리
6. 역사: 관련 사건, 인물
7. 응답은 반드시 아래 JSON 형식으로만 작성해주세요:

{
  "keywords": [
    {
      "term": "키워드",
      "description": "간단한 설명"
    }
  ]
}`,

    chat: `당신은 친절한 AI 학습 도우미입니다. 학습자가 영상 내용에 대해 질문하면 RAG 형식으로 답변해주세요.

규칙:
1. 주어진 영상 내용을 기반으로 정확하게 답변해주세요.
2. 영상 내용에 없는 정보는 "영상에서 다루지 않은 내용입니다"라고 안내해주세요.
3. 수학 공식은 LaTeX 문법을 사용하세요. (인라인: $수식$, 블록: $$수식$$)
4. 마크다운 문법을 활용해서 가독성 좋게 답변해주세요.
5. 필요시 예시를 들어 설명해주세요.
6. 존댓말(~해요 체)로 답변해주세요.
7. 환각(hallucination)을 최소화하고, 확실하지 않은 내용은 그렇다고 말해주세요.

[영상 내용]
{context}`
};

/**
 * 핵심 내용 요약 생성
 */
export async function generateSummary(apiKey, model, transcript, maxTokens = 2048) {
    return callOpenRouter({
        apiKey,
        model,
        maxTokens,
        messages: [
            { role: 'system', content: SYSTEM_PROMPTS.summary },
            { role: 'user', content: `다음 영상 내용을 핵심 내용으로 정리해주세요:\n\n${transcript}` }
        ]
    });
}

/**
 * 퀴즈 생성
 */
export async function generateQuiz(apiKey, model, transcript, maxTokens = 2048) {
    const response = await callOpenRouter({
        apiKey,
        model,
        maxTokens,
        temperature: 0.5,
        messages: [
            { role: 'system', content: SYSTEM_PROMPTS.quiz },
            { role: 'user', content: `다음 영상 내용을 기반으로 퀴즈를 생성해주세요:\n\n${transcript}` }
        ]
    });

    try {
        // JSON 블록 추출
        const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
            response.match(/\{[\s\S]*"quizzes"[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('퀴즈 파싱 실패:', error);
        return { quizzes: [] };
    }
}

/**
 * 더 생각해볼 내용 생성
 */
export async function generateThinkMore(apiKey, model, transcript, maxTokens = 1024) {
    return callOpenRouter({
        apiKey,
        model,
        maxTokens,
        messages: [
            { role: 'system', content: SYSTEM_PROMPTS.thinkMore },
            { role: 'user', content: `다음 영상 내용을 기반으로 더 생각해볼 주제를 제안해주세요:\n\n${transcript}` }
        ]
    });
}

/**
 * 연관 내용 생성
 */
export async function generateRelated(apiKey, model, transcript, maxTokens = 1024) {
    const response = await callOpenRouter({
        apiKey,
        model,
        maxTokens,
        temperature: 0.5,
        messages: [
            { role: 'system', content: SYSTEM_PROMPTS.related },
            { role: 'user', content: `다음 영상 내용과 연관된 개념을 추천해주세요:\n\n${transcript}` }
        ]
    });

    try {
        const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
            response.match(/\{[\s\S]*"keywords"[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('연관 내용 파싱 실패:', error);
        return { keywords: [] };
    }
}

/**
 * 챗봇 응답 생성 (스트리밍)
 */
export async function chatWithContext({
    apiKey,
    model,
    context,
    messages,
    maxTokens = 2048,
    onStream
}) {
    const systemPrompt = SYSTEM_PROMPTS.chat.replace('{context}', context);

    return callOpenRouter({
        apiKey,
        model,
        maxTokens,
        stream: !!onStream,
        onStream,
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ]
    });
}
