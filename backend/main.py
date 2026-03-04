from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
from fastapi import HTTPException

app = FastAPI()

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
        cursor.execute("SELECT * FROM questions")
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        return {"error": "Lỗi!", "detail": str(e)}


# 2. API lấy câu hỏi theo môn học (Đã sửa lỗi db not defined)
@app.get("/api/questions/{subject_name}")
def get_questions_by_subject(subject_name: str):
    try:
        # Tạo kết nối mới cho mỗi yêu cầu
        conn = mysql.connector.connect(**db_params)
        cursor = conn.cursor(buffered=True, dictionary=True)

        # Truy vấn lọc theo môn học
        query = "SELECT * FROM questions WHERE subject = %s"
        cursor.execute(query, (subject_name,))
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
@app.post("/api/admin/subjects")
def upsert_subject(data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    query = "INSERT INTO subjects (id, name, icon_name, color_class, bg_class, description) VALUES (%s, %s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE name=%s, description=%s"
    # ... thực thi query ...
    conn.commit()
    return {"status": "success"}

# --- QUẢN LÝ TÀI LIỆU ---

@app.get("/api/document")
def get_document():
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM documents")
    res = cursor.fetchall()
    conn.close()
    return res

@app.post("/api/admin/document")
def add_document(data: dict):
    try:
        conn = mysql.connector.connect(**db_params) # Sử dụng db_params đã khai báo
        cursor = conn.cursor()
        # Query phải có execute mới có tác dụng
        query = "INSERT INTO documents (title, subject_id, file_url, file_size) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (data['title'], data['subject_id'], data['file_url'], data['file_size']))
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

@app.post("/api/admin/news")
def add_news(data: dict):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    query = "INSERT INTO news (title, content, type, date_posted) VALUES (%s, %s, %s, %s)"
    values = (data['title'], data['content'], data['type'], data['date_posted'])
    cursor.execute(query, values)
    conn.commit()
    conn.close()
    return {"status": "success", "message": "Đã đăng tin tức"}

@app.delete("/api/admin/questions/{q_id}")
def delete_question(q_id: int):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM questions WHERE id = %s", (q_id,))
    conn.commit()
    conn.close()
    return {"message": "Đã xóa câu hỏi"}

# Tương tự cho subjects, documents và news
@app.delete("/api/admin/subjects/{s_id}")
def delete_subject(s_id: str):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM subjects WHERE id = %s", (s_id,))
    conn.commit()
    conn.close()
    return {"message": "Đã xóa môn học"}

@app.delete("/api/admin/document/{d_id}")
def delete_document(d_id: int):
    conn = mysql.connector.connect(**db_params)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM document WHERE id = %s", (d_id,))
    conn.commit()
    conn.close()
    return {"message": "Đã xóa tài liệu"}

@app.delete("/api/admin/news/{n_id}")
def delete_question(n_id: int):
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