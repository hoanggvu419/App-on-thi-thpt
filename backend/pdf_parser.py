"""
PDF Parser cho đề thi THPT
- Trích text từ PDF bằng pdfplumber
- Regex tách câu hỏi theo chuẩn định dạng Bộ GD&ĐT
"""
import re
import pdfplumber
import io


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Trích xuất toàn bộ text từ file PDF (text-based)."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def _extract_answer_key(text: str) -> dict:
    """
    Tìm bảng đáp án ở cuối đề (nếu có).
    Hỗ trợ các dạng:
      - "1. A  2. B  3. C"
      - "1-A  2-B  3-C"
      - "Câu 1: A  Câu 2: B"
      - Bảng nhiều hàng: "1  2  3 ..." / "A  C  B ..."
    Trả về dict: {1: 'A', 2: 'B', ...}
    """
    answer_key = {}

    # Tìm section đáp án
    section_match = re.search(
        r'(?:ĐÁP ÁN|đáp án|DAP AN|BẢNG ĐÁP ÁN|Đáp án)(.*?)(?:\Z)',
        text, re.IGNORECASE | re.DOTALL
    )
    section = section_match.group(1) if section_match else text

    # Dạng: "1. A" hoặc "1- A" hoặc "1: A" hoặc "Câu 1: A"
    pattern = r'(?:câu\s*)?(\d+)[.\-:]\s*([A-Da-d])\b'
    for m in re.finditer(pattern, section, re.IGNORECASE):
        answer_key[int(m.group(1))] = m.group(2).upper()

    return answer_key


def parse_questions(text: str, subject_id: str) -> tuple[list[dict], list[str]]:
    """
    Tách danh sách câu hỏi từ text đề thi THPT.
    Trả về: (questions: list[dict], warnings: list[str])

    Mỗi question dict:
    {
        subject_id, content, option_a, option_b, option_c, option_d,
        correct_answer  ('' nếu không tìm được đáp án)
    }
    """
    warnings = []
    questions = []

    # --- Bước 1: Trước khi tách, loại bỏ section đáp án ---
    answer_key = _extract_answer_key(text)

    # Cắt bỏ phần đáp án khỏi text chính (tránh nhận nhầm là câu hỏi)
    text_main = re.split(
        r'(?:ĐÁP ÁN|đáp án|DAP AN|BẢNG ĐÁP ÁN)',
        text, maxsplit=1, flags=re.IGNORECASE
    )[0]

    # --- Bước 2: Tách từng câu hỏi ---
    # Anchor: "Câu 1:" hoặc "Câu 1." hoặc "1." ở đầu dòng
    splitter = re.compile(
        r'(?:^|\n)\s*(?:Câu\s+)?(\d+)[.:]\s*',
        re.IGNORECASE
    )

    segments = splitter.split(text_main)
    # segments = ['phần đầu không phải câu hỏi', '1', 'nội dung câu 1', '2', 'nội dung câu 2', ...]
    # Bỏ phần đầu, ghép cặp (số, nội dung)
    if len(segments) < 3:
        warnings.append("Không tìm thấy câu hỏi nào. Hãy kiểm tra định dạng file PDF.")
        return [], warnings

    pairs = []
    i = 1
    while i + 1 < len(segments):
        q_num = segments[i].strip()
        q_body = segments[i + 1].strip()
        if q_num.isdigit():
            pairs.append((int(q_num), q_body))
        i += 2

    # --- Bước 3: Tách đáp án A/B/C/D khỏi nội dung từng câu ---
    # Hỗ trợ định dạng: "A. nội dung", "A) nội dung", "a. nội dung"
    opt_pattern = re.compile(
        r'\n\s*([A-Da-d])[.)]\s*(.+?)(?=\n\s*[A-Da-d][.)]\s*|\Z)',
        re.DOTALL
    )

    for q_num, body in pairs:
        options_found = opt_pattern.findall(body)
        if len(options_found) < 4:
            warnings.append(f"Câu {q_num}: Chỉ tìm được {len(options_found)}/4 đáp án — cần kiểm tra lại.")

        opts = {k.upper(): v.strip().replace('\n', ' ') for k, v in options_found}

        # Nội dung câu hỏi = phần trước đáp án A đầu tiên
        first_opt_match = re.search(r'\n\s*[A-Da-d][.)]', body)
        content = body[:first_opt_match.start()].strip().replace('\n', ' ') if first_opt_match else body.strip().replace('\n', ' ')

        if not content:
            warnings.append(f"Câu {q_num}: Không tách được nội dung câu hỏi.")
            continue

        # Lấy đáp án đúng từ answer_key (nếu có)
        correct = answer_key.get(q_num, '')

        questions.append({
            'subject_id': subject_id,
            'content': content,
            'option_a': opts.get('A', ''),
            'option_b': opts.get('B', ''),
            'option_c': opts.get('C', ''),
            'option_d': opts.get('D', ''),
            'correct_answer': correct,
        })

    if not questions:
        warnings.append("Không tách được câu hỏi nào. PDF có thể là ảnh scan (không có text).")

    return questions, warnings
