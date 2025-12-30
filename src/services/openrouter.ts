/**
 * OpenRouter AI 서비스
 * AI 모델 호출, 스트리밍 응답, 학습 콘텐츠 생성 기능을 제공합니다.
 */

import type { ChatMessage, QuizResult, RelatedResult, StreamCallback } from '../types';

// ============================================
// 상수
// ============================================

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ============================================
// 타입 정의
// ============================================

interface OpenRouterCallOptions {
    apiKey: string;
    model?: string;
    messages: ChatMessage[];
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    onStream?: StreamCallback;
}

// ============================================
// API 호출
// ============================================

/**
 * OpenRouter API를 호출합니다.
 * @param options API 호출 옵션
 * @returns AI 응답 텍스트
 */
export async function callOpenRouter({
    apiKey,
    model = 'google/gemini-2.0-flash-001',
    messages,
    maxTokens = 4096,
    temperature = 0.7,
    stream = false,
    onStream,
}: OpenRouterCallOptions): Promise<string> {
    if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. 설정에서 OpenRouter API 키를 입력해주세요.');
    }

    const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Zen Gen Study',
    };

    const body = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream,
    };

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
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
 * 스트리밍 응답을 처리합니다.
 */
async function handleStreamResponse(
    response: Response,
    onStream: StreamCallback
): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('스트림을 읽을 수 없습니다.');

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
                    } catch {
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

// ============================================
// 시스템 프롬프트
// ============================================

const SYSTEM_PROMPTS = {
    summary: `당신은 교육 전문가입니다. 주어진 영상 내용의 핵심을 정리해주세요.

규칙:
1. 핵심 개념을 명확하게 정리하세요.
2. 중요한 내용은 **굵게** 표시하세요.
3. 단계별로 구조화해서 설명하세요.
4. 어려운 용어는 쉽게 풀어서 설명하세요.
5. 수학 공식이나 수식은 LaTeX 문법을 사용하세요. (인라인: $수식$, 블록: $$수식$$)
6. 이모지 사용을 자제하고, 간결하고 명료하게 작성하세요.
7. 한국어로 작성하세요.`,

    quiz: `당신은 교육 평가 전문가입니다. 영상 내용을 기반으로 퀴즈를 생성해주세요.

규칙:
1. O/X 문제 2개, 선택형 문제 2개, 단답형 문제 1개를 생성하세요.
2. 각 문제에 정답과 해설을 제공하세요.
3. 난이도는 중간 수준으로 맞추세요.
4. 수학 관련 내용이면 LaTeX 문법($수식$)을 사용하세요.
5. 이모지 사용을 자제하고 간결하게 작성하세요.
6. 반드시 아래 JSON 형식으로만 응답하세요:

{
  "quizzes": [
    {
      "type": "ox",
      "question": "질문 내용",
      "answer": true,
      "explanation": "해설"
    },
    {
      "type": "choice",
      "question": "질문 내용",
      "options": ["보기1", "보기2", "보기3", "보기4"],
      "answer": 0,
      "explanation": "해설 (answer는 정답 보기의 인덱스, 0부터 시작)"
    },
    {
      "type": "short",
      "question": "질문 내용",
      "answer": "정답",
      "explanation": "해설"
    }
  ]
}`,

    thinkMore: `당신은 교육 전문가입니다. 영상 내용을 기반으로 더 깊이 생각해볼 주제를 제안해주세요.

규칙:
1. 3-5개의 심화 질문 또는 토론 주제를 제시하세요.
2. 비판적 사고를 유도하는 질문을 포함하세요.
3. 실생활 적용 사례를 제시하세요.
4. 이모지 사용을 자제하고 간결하게 작성하세요.
5. 한국어로 작성하세요.`,

    related: `당신은 교육 전문가입니다. 영상 내용과 관련된 개념을 추천해주세요.

규칙:
1. 관련 개념 5-7개를 추천하세요.
2. 각 개념에 1-2문장의 설명을 덧붙이세요.
3. 이모지 사용을 자제하세요.
4. 반드시 아래 JSON 형식으로만 응답하세요:

{
  "keywords": [
    {
      "term": "키워드",
      "description": "간단한 설명"
    }
  ]
}`,

    chat: `당신은 AI 학습 도우미입니다. 영상 내용에 대해 질문에 답변해주세요.

규칙:
1. 주어진 영상 내용을 기반으로 정확하게 답변하세요.
2. 영상에 없는 내용은 "영상에서 다루지 않은 내용입니다"라고 안내하세요.
3. 수학 공식은 LaTeX 문법을 사용하세요. (인라인: $수식$, 블록: $$수식$$)
4. 마크다운 문법을 활용해서 가독성 좋게 답변하세요.
5. 이모지 사용을 자제하고 간결하게 답변하세요.
6. 존댓말(~해요)로 답변하세요.
7. 확실하지 않은 내용은 그렇다고 말해주세요.

[영상 내용]
{context}`,
} as const;

// ============================================
// 콘텐츠 생성 함수
// ============================================

/**
 * 핵심 내용 요약을 생성합니다.
 */
export async function generateSummary(
    apiKey: string,
    model: string,
    transcript: string,
    maxTokens = 2048
): Promise<string> {
    return callOpenRouter({
        apiKey,
        model,
        maxTokens,
        messages: [
            { role: 'system', content: SYSTEM_PROMPTS.summary },
            { role: 'user', content: `다음 영상 내용을 핵심 내용으로 정리해주세요:\n\n${transcript}` },
        ],
    });
}

/**
 * 퀴즈를 생성합니다.
 */
export async function generateQuiz(
    apiKey: string,
    model: string,
    transcript: string,
    maxTokens = 2048
): Promise<QuizResult> {
    const response = await callOpenRouter({
        apiKey,
        model,
        maxTokens,
        temperature: 0.5,
        messages: [
            { role: 'system', content: SYSTEM_PROMPTS.quiz },
            { role: 'user', content: `다음 영상 내용을 기반으로 퀴즈를 생성해주세요:\n\n${transcript}` },
        ],
    });

    try {
        const jsonMatch =
            response.match(/```json\n?([\s\S]*?)\n?```/) ||
            response.match(/\{[\s\S]*"quizzes"[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('퀴즈 파싱 실패:', error);
        return { quizzes: [] };
    }
}

/**
 * 더 생각해볼 내용을 생성합니다.
 */
export async function generateThinkMore(
    apiKey: string,
    model: string,
    transcript: string,
    maxTokens = 1024
): Promise<string> {
    return callOpenRouter({
        apiKey,
        model,
        maxTokens,
        messages: [
            { role: 'system', content: SYSTEM_PROMPTS.thinkMore },
            {
                role: 'user',
                content: `다음 영상 내용을 기반으로 더 생각해볼 주제를 제안해주세요:\n\n${transcript}`,
            },
        ],
    });
}

/**
 * 연관 내용을 생성합니다.
 */
export async function generateRelated(
    apiKey: string,
    model: string,
    transcript: string,
    maxTokens = 1024
): Promise<RelatedResult> {
    const response = await callOpenRouter({
        apiKey,
        model,
        maxTokens,
        temperature: 0.5,
        messages: [
            { role: 'system', content: SYSTEM_PROMPTS.related },
            {
                role: 'user',
                content: `다음 영상 내용과 연관된 개념을 추천해주세요:\n\n${transcript}`,
            },
        ],
    });

    try {
        const jsonMatch =
            response.match(/```json\n?([\s\S]*?)\n?```/) ||
            response.match(/\{[\s\S]*"keywords"[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('연관 내용 파싱 실패:', error);
        return { keywords: [] };
    }
}

// ============================================
// 채팅 함수
// ============================================

interface ChatWithContextOptions {
    apiKey: string;
    model: string;
    context: string;
    messages: ChatMessage[];
    maxTokens?: number;
    onStream?: StreamCallback;
}

/**
 * 컨텍스트 기반 채팅 응답을 생성합니다.
 */
export async function chatWithContext({
    apiKey,
    model,
    context,
    messages,
    maxTokens = 2048,
    onStream,
}: ChatWithContextOptions): Promise<string> {
    const systemPrompt = SYSTEM_PROMPTS.chat.replace('{context}', context);

    return callOpenRouter({
        apiKey,
        model,
        maxTokens,
        stream: !!onStream,
        onStream,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });
}

// ============================================
// 플래시카드 함수
// ============================================

const FLASHCARD_PROMPT = `당신은 학습 카드 생성 전문가입니다. 영상 내용을 기반으로 플래시카드를 생성해주세요.

규칙:
1. 8-12개의 플래시카드를 생성하세요.
2. 앞면(front)에는 핵심 개념이나 질문을, 뒷면(back)에는 답변이나 설명을 작성하세요.
3. 암기하기 좋은 형태로 간결하게 작성하세요.
4. 수학 공식은 LaTeX 문법($수식$)을 사용하세요.
5. 이모지 사용을 자제하세요.
6. 반드시 아래 JSON 형식으로만 응답하세요:

{
  "flashcards": [
    {
      "front": "질문 또는 핵심 개념",
      "back": "답변 또는 설명"
    }
  ]
}`;

import type { FlashcardResult } from '../types';

/**
 * 플래시카드를 생성합니다.
 */
export async function generateFlashcards(
    apiKey: string,
    model: string,
    transcript: string,
    maxTokens = 2048
): Promise<FlashcardResult> {
    const response = await callOpenRouter({
        apiKey,
        model,
        maxTokens,
        temperature: 0.5,
        messages: [
            { role: 'system', content: FLASHCARD_PROMPT },
            { role: 'user', content: `다음 영상 내용을 기반으로 플래시카드를 생성해주세요:\n\n${transcript}` },
        ],
    });

    try {
        const jsonMatch =
            response.match(/```json\n?([\s\S]*?)\n?```/) ||
            response.match(/\{[\s\S]*"flashcards"[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('플래시카드 파싱 실패:', error);
        return { flashcards: [] };
    }
}
