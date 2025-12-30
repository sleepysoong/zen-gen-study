/**
 * PDF 생성 유틸리티
 * html2canvas를 사용하여 퀴즈를 PDF로 변환합니다.
 * 한글, LaTeX, 마크다운 모두 지원합니다.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Quiz } from '../types';

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 퀴즈 유형 라벨을 반환합니다.
 */
function getTypeLabel(type: string): string {
    switch (type) {
        case 'ox':
            return 'O/X';
        case 'choice':
            return '선택형';
        case 'short':
            return '단답형';
        default:
            return '';
    }
}

/**
 * 퀴즈 정답 텍스트를 반환합니다.
 */
function getAnswerText(quiz: Quiz): string {
    if (quiz.type === 'ox') {
        return quiz.answer ? 'O' : 'X';
    } else if (quiz.type === 'choice') {
        return `${(quiz.answer as number) + 1}번`;
    }
    return String(quiz.answer);
}

/**
 * HTML 특수문자를 이스케이프합니다.
 */
function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
}

// ============================================
// PDF 생성
// ============================================

/**
 * 퀴즈를 PDF로 다운로드합니다.
 * @param quizzes 퀴즈 배열
 * @param title PDF 제목
 */
export async function generateQuizPDF(quizzes: Quiz[], title = '학습 퀴즈'): Promise<void> {
    // PDF용 임시 컨테이너 생성
    const container = document.createElement('div');
    container.id = 'pdf-container';
    container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 595px;
    padding: 40px;
    background: #FFFEF5;
    font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    font-size: 12px;
    line-height: 1.6;
    color: #3B3B3B;
  `;

    // HTML 생성
    container.innerHTML = `
    <div style="background: #8B7355; padding: 20px 30px; margin: -40px -40px 30px; color: #FFFEF5;">
      <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700;">${escapeHtml(title)}</h1>
      <p style="margin: 0; font-size: 12px; opacity: 0.9;">
        총 ${quizzes.length}문제 | ${new Date().toLocaleDateString('ko-KR')}
      </p>
    </div>
    
    <h2 style="font-size: 16px; color: #8B7355; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 2px solid #8B7355;">
      문제
    </h2>
    
    ${quizzes
            .map(
                (quiz, i) => `
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <span style="background: #8B7355; color: #FFFEF5; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">
            Q${i + 1}
          </span>
          <span style="background: #2D5A3D; color: #FFFEF5; padding: 2px 8px; border-radius: 12px; font-size: 10px;">
            ${getTypeLabel(quiz.type)}
          </span>
        </div>
        <p style="margin: 0 0 12px; font-size: 13px; font-weight: 500;">
          ${escapeHtml(quiz.question)}
        </p>
        ${quiz.type === 'choice' && quiz.options
                        ? `
          <div style="padding-left: 16px;">
            ${quiz.options
                            .map(
                                (opt, j) => `
              <div style="margin-bottom: 6px; font-size: 12px;">
                <span style="display: inline-block; width: 20px; height: 20px; line-height: 20px; text-align: center; background: #E8E4DD; border-radius: 50%; font-size: 10px; font-weight: 600; margin-right: 8px;">
                  ${j + 1}
                </span>
                ${escapeHtml(opt)}
              </div>
            `
                            )
                            .join('')}
          </div>
        `
                        : ''
                    }
      </div>
    `
            )
            .join('')}
    
    <div style="page-break-before: always; margin-top: 40px;">
      <div style="background: #2D5A3D; padding: 15px 30px; margin: 0 -40px 30px; color: #FFFEF5;">
        <h2 style="margin: 0; font-size: 16px; font-weight: 600;">정답 및 해설</h2>
      </div>
      
      ${quizzes
            .map(
                (quiz, i) => `
        <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #E8E4DD; page-break-inside: avoid;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <span style="font-weight: 700; color: #8B7355;">Q${i + 1}</span>
            <span style="font-weight: 600; color: #2D5A3D;">
              정답: ${getAnswerText(quiz)}
            </span>
          </div>
          <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.7;">
            ${escapeHtml(quiz.explanation)}
          </p>
        </div>
      `
            )
            .join('')}
    </div>
    
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E8E4DD; font-size: 10px; color: #999;">
      Zen Gen Study - AI Study Teacher
    </div>
  `;

    document.body.appendChild(container);

    try {
        // html2canvas로 HTML을 캔버스로 변환
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#FFFEF5',
        });

        // PDF 생성
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // 이미지 비율 계산
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // 여러 페이지로 분할
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // 다운로드
        const fileName = `${title.replace(/[^a-zA-Z0-9가-힣\s]/g, '').trim()}_퀴즈.pdf`;
        pdf.save(fileName);
    } finally {
        // 임시 컨테이너 제거
        document.body.removeChild(container);
    }
}
