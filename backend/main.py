from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
import csv
import io
from pdf_parser import extract_text_from_pdf, parse_questions

app = FastAPI()


@app.on_event("startup")
def create_tables():
    conn = mysql.connector.connect(**{
        "host": "localhost", "user": "root",
        "password": "hoangbi410", "database": "app_onthi_thpt"
    })
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz_results (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            subject_id VARCHAR(50) DEFAULT NULL,
            exam_id INT DEFAULT NULL,
            exam_title VARCHAR(255) NOT NULL,
            score INT NOT NULL,
            total INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id)
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Định nghĩa thông tin cấu hình dưới dạng Dictionary
db_params = {
    "host": "localhost",
    "user": "root",
    "password": "hoangbi410",
    "database": "app_onthi_thpt"
}


@app.get("/")
def home():
    return {"message": "Backend đang chạy!"}


# API lấy tất cả câu hỏi
@app.get("/api/questions")
def get_questions():
    try:
        conn = mysql.connector.connect(**db_params)
        cursor = conn.cursor(buffered=True, dictionary=True)
        query = """
        SELECT q.*, s.name as subject_name 
        FROM questions q
        LEFT JOIN subjects s ON q.subject_id = s.id
    """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        return {"error": "Lỗi!", "detail": str(e)}


# 2. API lấy câu hỏi theo môn học (Đã sửa lỗi db not defined)
@app.get("/api/questions/{subject_id}")
def get_questions_by_subject(subject_id: str):
    try:
        # Tạo kết nối mới cho mỗi yêu cầu
        conn = mysql.connector.connect(**db_params)
        cursor = conn.cursor(buffered=True, dictionary=True)

        # Truy vấn lọc theo môn học
        query = "SELECT * FROM questions WHERE subject_id = %s"
        cursor.execute(query, (subject_id,))
        result = cursor.fetchall()

        cursor.close()
        conn.close()
        return result
    except Exception as e:
        return {"error": "Lỗi lọc môn học!", "detail": str(e)}

# Lấy danh sách môn học (Dành cho trang chủ)
@app.get("/api/subjects")
def get_subjects():
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM subjects")
    res = cursor.fetchall()
    conn.close()
    return res

# Thêm/Sửa môn học (Dành cho Admin)
@app.post("/api/subjects")
def upsert_subject(data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        # Câu lệnh SQL để thêm hoặc cập nhật nếu đã tồn tại mã ID
        query = """
            INSERT INTO subjects (id, name, description, icon_name, color_class, bg_class) 
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE name=%s, description=%s
        """
        values = (
            data['id'], data['name'], data.get('description', ''),
            data.get('icon_name', 'BookOpen'), 'text-blue-600', 'bg-blue-50',
            data['name'], data.get('description', '')
        )
        cursor.execute(query, values) # QUAN TRỌNG: Phải có dòng này
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        print(f"Lỗi SQL: {e}") # In ra PyCharm để xem lỗi
        return {"status": "error", "message": str(e)}
    finally:
        conn.close()

# --- QUẢN LÝ TÀI LIỆU ---

@app.get("/api/document")
def get_document():
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM documents")
    res = cursor.fetchall()
    conn.close()
    return res

@app.post("/api/document")
def add_document(data: dict):
    try:
        conn = mysql.connector.connect(**db_params) # Sử dụng db_params đã khai báo
        cursor = conn.cursor()
        # Query phải có execute mới có tác dụng
        query = "INSERT INTO documents (title, subject_id, file_url, preview_url, file_size) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(query, (data['title'], data['subject_id'], data.get('file_url', ''), data.get('preview_url', ''), data.get('file_size', '')))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# --- QUẢN LÝ TIN TỨC ---

@app.get("/api/news")
def get_news():
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor(dictionary=True) # Thêm dictionary=True ở đây
    cursor.execute("SELECT * FROM news ORDER BY id DESC")
    res = cursor.fetchall()
    conn.close()
    return res

@app.post("/api/news")
def add_news(data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = "INSERT INTO news (title, content, url) VALUES (%s, %s, %s)"
        values = (data['title'], data.get('content', ''), data.get('url', ''))
        cursor.execute(query, values)
        conn.commit()
        return {"status": "success", "message": "Đã đăng tin tức"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/api/questions/{q_id}")
def delete_question(q_id: int):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM questions WHERE id = %s", (q_id,))
    conn.commit()
    conn.close()
    return {"message": "Đã xóa câu hỏi"}

# Tương tự cho subjects, documents và news
@app.delete("/api/subjects/{s_id}")
def delete_subject(s_id: str):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM subjects WHERE id = %s", (s_id,))
    conn.commit()
    conn.close()
    return {"message": "Đã xóa môn học"}

@app.delete("/api/document/{d_id}")
def delete_document(d_id: int):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = %s", (d_id,))
    conn.commit()
    conn.close()
    return {"message": "Đã xóa tài liệu"}

@app.delete("/api/news/{n_id}")
def delete_news(n_id: int):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM news WHERE id = %s", (n_id,))
    conn.commit()
    conn.close()
    return {"message": "Đã xóa tin tức"}


#Hàm kiểm tra xem Username và Password có khớp không
@app.post("/api/login")
def login(credentials: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor(dictionary=True)

    # Kiểm tra user trong DB
    query = "SELECT * FROM users WHERE username = %s AND password = %s"
    cursor.execute(query, (credentials['username'], credentials['password']))
    user = cursor.fetchone()

    conn.close()

    if user:
        return {
            "status": "success",
            "user": {
                "id": user['id'],
                "username": user['username'],
                "full_name": user['full_name'],
                "role": user['role']
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu")


@app.post("/api/register")
def register(data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()

    try:
        # Kiểm tra xem username đã tồn tại chưa
        cursor.execute("SELECT * FROM users WHERE username = %s", (data['username'],))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Tên tài khoản đã tồn tại")

        # Thêm người dùng mới (Mặc định role là 'student' để bảo mật)
        query = "INSERT INTO users (username, password, full_name, role) VALUES (%s, %s, %s, %s)"
        values = (data['username'], data['password'], data['full_name'], 'student')

        cursor.execute(query, values)
        conn.commit()
        return {"status": "success", "message": "Đăng ký tài khoản thành công!"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/api/questions")
def add_question(data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO questions (subject_id, content, option_a, option_b, option_c, option_d, correct_answer) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            data.get('subject_id'),
            data.get('content'),
            data.get('option_a'),
            data.get('option_b'),
            data.get('option_c'),
            data.get('option_d'),
            data.get('correct_answer'),
        )

        if not values[0] or not values[1]:
            raise HTTPException(status_code=400, detail="Thiếu môn học hoặc nội dung câu hỏi")

        cursor.execute(query, values)
        conn.commit()

        return {"status": "success", "message": "Thêm câu hỏi thành công!"}

    except mysql.connector.Error as err:
        print(f"Lỗi MySQL: {err}")
        raise HTTPException(status_code=500, detail="Lỗi cơ sở dữ liệu")
    finally:
        cursor.close()
        conn.close()

# --- IMPORT CÂU HỎI HÀNG LOẠT TỪ FILE CSV ---
# Định dạng CSV: subject_id,content,option_a,option_b,option_c,option_d,correct_answer
@app.post("/api/questions/import")
async def import_questions(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file CSV!")
    
    contents = await file.read()
    text = contents.decode('utf-8-sig')  # utf-8-sig để xử lý BOM của Excel
    reader = csv.DictReader(io.StringIO(text))

    required_fields = {'subject_id', 'content', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer'}
    if not required_fields.issubset(set(reader.fieldnames or [])):
        raise HTTPException(status_code=400, detail=f"File CSV thiếu cột. Cần có: {', '.join(required_fields)}")

    rows = list(reader)
    if len(rows) == 0:
        raise HTTPException(status_code=400, detail="File CSV không có dữ liệu!")

    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO questions (subject_id, content, option_a, option_b, option_c, option_d, correct_answer)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = [
            (
                row['subject_id'].strip(),
                row['content'].strip(),
                row['option_a'].strip(),
                row['option_b'].strip(),
                row['option_c'].strip(),
                row['option_d'].strip(),
                row['correct_answer'].strip().upper(),
            )
            for row in rows if row.get('content') and row.get('subject_id')
        ]
        cursor.executemany(query, values)
        conn.commit()
        return {"status": "success", "message": f"Đã import thành công {len(values)} câu hỏi!"}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=f"Lỗi DB: {str(err)}")
    finally:
        cursor.close()
        conn.close()

@app.put("/api/subjects/{s_id}")
def update_subject(s_id: str, data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = "UPDATE subjects SET name=%s, description=%s WHERE id=%s"
        cursor.execute(query, (data['name'], data.get('description', ''), s_id))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.put("/api/questions/{q_id}")
def update_question(q_id: int, data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = "UPDATE questions SET subject_id=%s, content=%s, option_a=%s, option_b=%s, option_c=%s, option_d=%s, correct_answer=%s WHERE id=%s"
        cursor.execute(query, (
            data['subject_id'], data['content'],
            data.get('option_a'), data.get('option_b'),
            data.get('option_c'), data.get('option_d'),
            data.get('correct_answer'), q_id
        ))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.put("/api/document/{d_id}")
def update_document(d_id: int, data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = "UPDATE documents SET title=%s, subject_id=%s, file_url=%s, preview_url=%s, file_size=%s WHERE id=%s"
        cursor.execute(query, (
            data['title'], data.get('subject_id'),
            data.get('file_url', ''), data.get('preview_url', ''), data.get('file_size', ''), d_id
        ))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.put("/api/news/{n_id}")
def update_news(n_id: int, data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = "UPDATE news SET title=%s, content=%s, url=%s WHERE id=%s"
        cursor.execute(query, (data['title'], data.get('content', ''), data.get('url', ''), n_id))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# =============================================
# --- QUẢN LÝ ĐỀ THI ---
# =============================================

@app.get("/api/exams")
def get_exams(subject_id: str = None):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor(dictionary=True)
    try:
        if subject_id:
            cursor.execute("""
                SELECT e.*, s.name as subject_name 
                FROM exams e LEFT JOIN subjects s ON e.subject_id = s.id
                WHERE e.subject_id = %s ORDER BY e.year DESC
            """, (subject_id,))
        else:
            cursor.execute("""
                SELECT e.*, s.name as subject_name 
                FROM exams e LEFT JOIN subjects s ON e.subject_id = s.id
                ORDER BY e.year DESC
            """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()


@app.get("/api/exams/{exam_id}")
def get_exam_detail(exam_id: int):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT e.*, s.name as subject_name 
            FROM exams e LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE e.id = %s
        """, (exam_id,))
        exam = cursor.fetchone()
        if not exam:
            raise HTTPException(status_code=404, detail="Không tìm thấy đề thi")

        cursor.execute("SELECT * FROM exam_questions WHERE exam_id = %s", (exam_id,))
        exam['questions'] = cursor.fetchall()
        return exam
    finally:
        cursor.close()
        conn.close()


@app.post("/api/exams")
def create_exam(data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO exams (title, subject_id, year, duration_minutes, description) 
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            data['title'], data['subject_id'], data['year'],
            data.get('duration_minutes', 90), data.get('description', '')
        ))
        conn.commit()
        return {"status": "success", "id": cursor.lastrowid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@app.put("/api/exams/{exam_id}")
def update_exam(exam_id: int, data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = """
            UPDATE exams SET title=%s, subject_id=%s, year=%s, 
            duration_minutes=%s, description=%s WHERE id=%s
        """
        cursor.execute(query, (
            data['title'], data['subject_id'], data['year'],
            data.get('duration_minutes', 90), data.get('description', ''), exam_id
        ))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@app.delete("/api/exams/{exam_id}")
def delete_exam(exam_id: int):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        # exam_questions sẽ tự xóa nhờ ON DELETE CASCADE
        cursor.execute("DELETE FROM exams WHERE id = %s", (exam_id,))
        conn.commit()
        return {"status": "success", "message": "Đã xóa đề thi"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# =============================================
# --- QUẢN LÝ CÂU HỎI TRONG ĐỀ THI ---
# =============================================

@app.post("/api/exams/{exam_id}/questions")
def add_exam_question(exam_id: int, data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = """
            INSERT INTO exam_questions 
            (exam_id, content, option_a, option_b, option_c, option_d, correct_answer, explanation) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            exam_id, data['content'],
            data['option_a'], data['option_b'], data['option_c'], data['option_d'],
            data['correct_answer'].upper(), data.get('explanation', '')
        ))
        conn.commit()
        return {"status": "success", "id": cursor.lastrowid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@app.put("/api/exam-questions/{q_id}")
def update_exam_question(q_id: int, data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        query = """
            UPDATE exam_questions SET content=%s, option_a=%s, option_b=%s,
            option_c=%s, option_d=%s, correct_answer=%s, explanation=%s WHERE id=%s
        """
        cursor.execute(query, (
            data['content'], data['option_a'], data['option_b'],
            data['option_c'], data['option_d'],
            data['correct_answer'].upper(), data.get('explanation', ''), q_id
        ))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@app.delete("/api/exam-questions/{q_id}")
def delete_exam_question(q_id: int):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM exam_questions WHERE id = %s", (q_id,))
        conn.commit()
        return {"status": "success", "message": "Đã xóa câu hỏi"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

# =============================================
# --- IMPORT CSV CAU HOI VAO DE THI ---
# =============================================

@app.post("/api/exams/{exam_id}/questions/import")
async def import_exam_questions(exam_id: int, file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    required = {"content", "option_a", "option_b", "option_c", "option_d", "correct_answer"}
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="File CSV rong hoac sai dinh dang!")
    if not required.issubset(set(reader.fieldnames or [])):
        raise HTTPException(status_code=400, detail=f"File CSV thieu cot. Can co: {', '.join(required)}")
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        inserted = 0
        for row in rows:
            cursor.execute("""
                INSERT INTO exam_questions
                (exam_id, content, option_a, option_b, option_c, option_d, correct_answer, explanation)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                exam_id, row["content"].strip(),
                row["option_a"].strip(), row["option_b"].strip(),
                row["option_c"].strip(), row["option_d"].strip(),
                row["correct_answer"].strip().upper(),
                row.get("explanation", "").strip()
            ))
            inserted += 1
        conn.commit()
        return {"status": "success", "inserted": inserted, "message": f"Da import {inserted} cau hoi thanh cong!"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# =============================================
# --- LỊCH SỬ KẾT QUẢ ---
# =============================================

@app.post("/api/results")
def save_result(data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO quiz_results (user_id, subject_id, exam_id, exam_title, score, total)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            data['user_id'], data.get('subject_id'), data.get('exam_id'),
            data['exam_title'], data['score'], data['total']
        ))
        conn.commit()
        return {"status": "success", "id": cursor.lastrowid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@app.get("/api/results")
def get_results(user_id: int):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, user_id, subject_id, exam_id, exam_title, score, total,
                   DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%s') AS created_at
            FROM quiz_results WHERE user_id = %s ORDER BY created_at DESC
        """, (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()


# =============================================
# --- CẬP NHẬT THÔNG TIN NGƯỜI DÙNG ---
# =============================================

@app.put("/api/users/{user_id}")
def update_user(user_id: int, data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor(dictionary=True)
    try:
        if data.get('password'):
            cursor.execute("SELECT password FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if not row or row['password'] != data.get('old_password', ''):
                raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng!")
            cursor.execute(
                "UPDATE users SET full_name=%s, password=%s WHERE id=%s",
                (data['full_name'], data['password'], user_id)
            )
        else:
            cursor.execute(
                "UPDATE users SET full_name=%s WHERE id=%s",
                (data['full_name'], user_id)
            )
        conn.commit()
        cursor.execute("SELECT id, username, full_name, role FROM users WHERE id=%s", (user_id,))
        user = cursor.fetchone()
        return {"status": "success", "user": user}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# =============================================
# --- UPLOAD PDF ĐỀ THI (Parse không lưu DB) ---
# =============================================

@app.post("/api/exams/upload-pdf/parse")
async def parse_exam_pdf(
    file: UploadFile = File(...),
    subject_id: str = Form(...),
    title: str = Form(...),
    year: int = Form(...),
    duration_minutes: int = Form(90),
):
    """Bước 1: Trích text từ PDF, trả về preview câu hỏi — KHÔNG lưu DB."""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PDF!")

    try:
        file_bytes = await file.read()
        text = extract_text_from_pdf(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Không đọc được file PDF: {str(e)}")

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="PDF không có text (có thể là ảnh scan). Hãy dùng file PDF gốc dạng text."
        )

    questions, warnings = parse_questions(text, subject_id)

    return {
        "total": len(questions),
        "parsed": questions,
        "warnings": warnings,
        "exam_meta": {
            "title": title,
            "subject_id": subject_id,
            "year": year,
            "duration_minutes": duration_minutes,
        }
    }


# =============================================
# --- CONFIRM: Lưu đề thi + câu hỏi vào DB ---
# =============================================

@app.post("/api/exams/upload-pdf/confirm")
def confirm_exam_pdf(data: dict):
    """
    Bước 2: Nhận exam_meta + questions từ frontend (sau khi admin đã xem preview),
    tạo đề thi và bulk insert câu hỏi vào DB.
    """
    meta = data.get('exam_meta', {})
    questions = data.get('questions', [])

    if not meta.get('title') or not meta.get('subject_id'):
        raise HTTPException(status_code=400, detail="Thiếu tiêu đề hoặc môn học!")
    if not questions:
        raise HTTPException(status_code=400, detail="Không có câu hỏi để lưu!")

    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    try:
        # Tạo đề thi
        cursor.execute(
            """INSERT INTO exams (title, subject_id, year, duration_minutes, description)
               VALUES (%s, %s, %s, %s, %s)""",
            (
                meta['title'], meta['subject_id'],
                meta.get('year'), meta.get('duration_minutes', 90),
                meta.get('description', f"Import từ PDF — {meta['title']}")
            )
        )
        exam_id = cursor.lastrowid

        # Bulk insert câu hỏi
        inserted = 0
        for q in questions:
            content = (q.get('content') or '').strip()
            if not content:
                continue
            cursor.execute(
                """INSERT INTO exam_questions
                   (exam_id, content, option_a, option_b, option_c, option_d, correct_answer, explanation)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    exam_id, content,
                    q.get('option_a', ''), q.get('option_b', ''),
                    q.get('option_c', ''), q.get('option_d', ''),
                    (q.get('correct_answer') or '').upper(),
                    q.get('explanation', '')
                )
            )
            inserted += 1

        conn.commit()
        return {
            "status": "success",
            "exam_id": exam_id,
            "inserted": inserted,
            "message": f"Đã tạo đề thi với {inserted} câu hỏi!"
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()

