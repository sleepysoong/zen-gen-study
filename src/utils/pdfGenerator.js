/**
 * PDF 생성 유틸리티
 * 퀴즈를 깔끔한 디자인의 PDF로 다운로드
 */
import jsPDF from 'jspdf';

// LaTeX를 일반 텍스트로 변환 (PDF에서는 LaTeX 렌더링이 어려우므로)
function convertLatexToText(text) {
    if (!text) return '';

    return text
        // 블록 수식 제거
        .replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => `[수식: ${formula.trim()}]`)
        // 인라인 수식 변환
        .replace(/\$([\s\S]*?)\$/g, (_, formula) => formula.trim())
        // 마크다운 굵게
        .replace(/\*\*(.*?)\*\*/g, '$1')
        // 마크다운 기울임
        .replace(/\*(.*?)\*/g, '$1')
        // 마크다운 코드
        .replace(/`(.*?)`/g, '$1');
}

export async function generateQuizPDF(quizzes, title = '학습 퀴즈') {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // 폰트 설정 (한글 지원을 위해 기본 폰트 사용)
    // jsPDF 기본 폰트는 한글을 지원하지 않으므로, 간단한 영문으로 대체하거나
    // 별도 폰트 추가가 필요함. 여기서는 기본으로 진행

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // 헤더
    doc.setFillColor(139, 115, 85); // #8B7355
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 254, 245); // #FFFEF5
    doc.setFontSize(20);
    doc.text(title, margin, 25);

    doc.setFontSize(10);
    doc.text(`총 ${quizzes.length}문제 | ${new Date().toLocaleDateString('ko-KR')}`, margin, 33);

    y = 50;

    // 문제 섹션
    doc.setTextColor(59, 59, 59);
    doc.setFontSize(16);
    doc.text('문제', margin, y);
    y += 10;

    quizzes.forEach((quiz, index) => {
        // 페이지 넘김 체크
        if (y > pageHeight - 40) {
            doc.addPage();
            y = margin;
        }

        doc.setFontSize(11);
        doc.setTextColor(139, 115, 85);

        const typeLabel = quiz.type === 'ox' ? 'O/X' : quiz.type === 'choice' ? '선택형' : '단답형';
        doc.text(`Q${index + 1}. [${typeLabel}]`, margin, y);
        y += 6;

        // 문제 텍스트
        doc.setTextColor(59, 59, 59);
        doc.setFontSize(10);
        const questionText = convertLatexToText(quiz.question);
        const questionLines = doc.splitTextToSize(questionText, contentWidth);
        doc.text(questionLines, margin, y);
        y += questionLines.length * 5 + 3;

        // 선택형 보기
        if (quiz.type === 'choice' && quiz.options) {
            quiz.options.forEach((option, optIdx) => {
                const optionText = `${optIdx + 1}) ${convertLatexToText(option)}`;
                const optionLines = doc.splitTextToSize(optionText, contentWidth - 5);
                doc.text(optionLines, margin + 5, y);
                y += optionLines.length * 4 + 2;
            });
        }

        y += 5;
    });

    // 새 페이지 - 정답 및 해설
    doc.addPage();
    y = margin;

    doc.setFillColor(45, 90, 61); // #2D5A3D
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 254, 245);
    doc.setFontSize(16);
    doc.text('정답 및 해설', margin, 20);

    y = 40;

    quizzes.forEach((quiz, index) => {
        if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
        }

        // 문제 번호
        doc.setFontSize(11);
        doc.setTextColor(45, 90, 61);
        doc.text(`Q${index + 1}.`, margin, y);

        // 정답
        let answerText = '';
        if (quiz.type === 'ox') {
            answerText = quiz.answer ? 'O' : 'X';
        } else if (quiz.type === 'choice') {
            answerText = `${quiz.answer + 1}번`;
        } else {
            answerText = quiz.answer;
        }

        doc.setTextColor(139, 115, 85);
        doc.text(`정답: ${answerText}`, margin + 15, y);
        y += 7;

        // 해설
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        const explanationText = convertLatexToText(quiz.explanation);
        const explanationLines = doc.splitTextToSize(explanationText, contentWidth);
        doc.text(explanationLines, margin, y);
        y += explanationLines.length * 4 + 8;

        // 구분선
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y - 3, pageWidth - margin, y - 3);
    });

    // 푸터
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Zen Gen Study | Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    // 다운로드
    const fileName = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_퀴즈.pdf`;
    doc.save(fileName);
}
