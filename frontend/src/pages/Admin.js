import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FileText, Newspaper, Plus, Edit, Trash2, X, Upload, Download, ClipboardList, Users, FileUp, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { SUBJECTS } from '../constants/subjects';

const TAB_LABELS = {
  subjects: 'Môn học',
  questions: 'Câu hỏi',
  document: 'Tài liệu',
  news: 'Tin tức',
  exams: 'Đề thi',
  users: 'Người dùng',
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState('subjects');
  const allSubjects = SUBJECTS;
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const pdfFileRef = useRef(null);
  const navigate = useNavigate();

  // PDF Upload state
  const [pdfModal, setPdfModal] = useState(false);
  const [pdfStep, setPdfStep] = useState(1); // 1: cấu hình, 2: preview
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfSaving, setPdfSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfMeta, setPdfMeta] = useState({ subject_id: '', title: '', year: new Date().getFullYear(), duration_minutes: 90 });
  const [pdfPreview, setPdfPreview] = useState(null); // { total, parsed, warnings, exam_meta }
  const [pdfEditQuestions, setPdfEditQuestions] = useState([]);

  // Hàm xử lý import CSV câu hỏi
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/questions/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi khi import file!');
    } finally {
      setImporting(false);
      fileInputRef.current.value = '';
    }
  };

  // Tách đáp án khi backend gộp tất cả vào option_a
  // VD: "exchange B. announce C. expect D. decide" → tách thành 4 đáp án riêng
  const tryFixMergedOptions = (q) => {
    if (q.option_b || q.option_c || q.option_d) return q;
    if (!q.option_a) return q;
    const match = q.option_a.match(/^(.+?)\s+B\.\s+(.+?)\s+C\.\s+(.+?)\s+D\.\s+(.+)$/i);
    if (match) {
      return {
        ...q,
        option_a: match[1].trim(),
        option_b: match[2].trim(),
        option_c: match[3].trim(),
        option_d: match[4].trim(),
      };
    }
    return q;
  };

  // --- PDF Upload handlers ---
  const handleOpenPdfModal = () => {
    setPdfModal(true);
    setPdfStep(1);
    setPdfFile(null);
    setPdfPreview(null);
    setPdfEditQuestions([]);
    setPdfMeta({ subject_id: '', title: '', year: new Date().getFullYear(), duration_minutes: 90 });
  };

  const handleParsePdf = async () => {
    if (!pdfFile) { alert('Vui lòng chọn file PDF!'); return; }
    if (!pdfMeta.subject_id) { alert('Vui lòng chọn môn học!'); return; }
    if (!pdfMeta.title.trim()) { alert('Vui lòng nhập tên đề thi!'); return; }
    setPdfParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', pdfFile);
      fd.append('subject_id', pdfMeta.subject_id);
      fd.append('title', pdfMeta.title);
      fd.append('year', pdfMeta.year);
      fd.append('duration_minutes', pdfMeta.duration_minutes);
      const res = await axios.post('http://127.0.0.1:8000/api/exams/upload-pdf/parse', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPdfPreview(res.data);
      setPdfEditQuestions(res.data.parsed.map((q, i) => ({ ...tryFixMergedOptions(q), _idx: i })));
      setPdfStep(2);
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi khi phân tích PDF!');
    } finally {
      setPdfParsing(false);
    }
  };

  const handleConfirmPdf = async () => {
    setPdfSaving(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/exams/upload-pdf/confirm', {
        exam_meta: pdfPreview.exam_meta,
        questions: pdfEditQuestions,
      });
      alert(res.data.message);
      setPdfModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi khi lưu đề thi!');
    } finally {
      setPdfSaving(false);
    }
  };

  // Tải file CSV mẫu
  const downloadTemplate = () => {
    const header = 'subject_id,content,option_a,option_b,option_c,option_d,correct_answer';
    const example = 'toan,Giá trị của căn bậc hai của 144 là?,10,12,14,16,B';
    const blob = new Blob([header + '\n' + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_cau_hoi.csv';
    a.click();
    URL.revokeObjectURL(url);
  };


  // Hàm xử lý gửi dữ liệu lên Backend
  const handleSave = async (e) => {
  e.preventDefault();
  try {
    let res;
    if (isEditing) {
      // Gửi request UPDATE (PUT)
      res = await axios.put(`http://127.0.0.1:8000/api/${activeTab}/${editId}`, formData);
    } else {
      // Gửi request CREATE (POST)
      res = await axios.post(`http://127.0.0.1:8000/api/${activeTab}`, formData);
    }

    if (res.data.status === 'success') {
      alert(isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!");
      closeModal(); // Hàm reset state bên dưới
      fetchData();
    }
  } catch (err) {
    alert("Lỗi khi lưu dữ liệu!");
  }
};
// Hàm đóng modal và reset trắng state
const closeModal = () => {
  setShowModal(false);
  setIsEditing(false);
  setEditId(null);
  setFormData({});
};
  // Load dữ liệu dựa trên Tab đang chọn
  const fetchData = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/${activeTab}`);
      setData(res.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Hàm khi nhấn nút Edit trên dòng
const handleEdit = (item) => {
  setEditId(item.id);
  setFormData(item);      // Đổ toàn bộ dữ liệu dòng đó vào form
  setIsEditing(true);     // Đánh dấu là đang sửa
  setShowModal(true);     // Mở modal
};

  //hàm xử lý xóa mục
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mục này?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/${activeTab}/${id}`);
        fetchData(); // Load lại danh sách
        alert("Xóa thành công!");
      } catch (err) {
        alert("Lỗi khi xóa!");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar bên trái */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 text-xl font-bold text-blue-600 border-b">Admin Panel</div>
        <nav className="p-4 space-y-2">
          <button onClick={() => setActiveTab('subjects')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'subjects' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}>
            <LayoutDashboard size={20} /> Môn học
          </button>
          <button onClick={() => setActiveTab('questions')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'questions' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}>
            <BookOpen size={20} /> Câu hỏi
          </button>
          <button onClick={() => setActiveTab('document')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'document' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}>
            <FileText size={20} /> Tài liệu
          </button>
          <button onClick={() => setActiveTab('news')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'news' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}>
            <Newspaper size={20} /> Tin tức
          </button>
          <button onClick={() => setActiveTab('exams')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'exams' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}>
            <ClipboardList size={20} /> Đề thi
          </button>
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'users' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}>
            <Users size={20} /> Người dùng
          </button>
        </nav>
      </div>

      {/* Nội dung bên phải */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">Quản lý {TAB_LABELS[activeTab] || activeTab}</h1>
          <div className="flex items-center gap-3">
            {/* Nút Import CSV — chỉ hiện ở tab câu hỏi */}
            {activeTab === 'questions' && (
              <>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImportCSV}
                />
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  <Download size={16} /> Tải file mẫu
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={importing}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
                >
                  <Upload size={20} /> {importing ? 'Đang import...' : 'Import CSV'}
                </button>
              </>
            )}
            {/* Nút Upload PDF — chỉ hiện ở tab đề thi */}
            {activeTab === 'exams' && (
              <button
                onClick={handleOpenPdfModal}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
              >
                <FileUp size={16} /> Upload PDF
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className={`flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition ${
                activeTab === 'users' || activeTab === 'subjects' ? 'hidden' : ''
              }`}
            >
              <Plus size={20} /> Thêm mới
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-bold text-gray-600">ID</th>
                {activeTab === 'subjects' && (
                  <>
                    <th className="p-4 font-bold text-gray-600">Màu nền</th>
                    <th className="p-4 font-bold text-gray-600">Icon</th>
                  </>
                )}
                {activeTab === 'questions' && (
                  <th className="p-4 font-bold text-gray-600">Môn học</th>
                )}
                {activeTab === 'exams' && (
                  <>
                    <th className="p-4 font-bold text-gray-600">Môn học</th>
                    <th className="p-4 font-bold text-gray-600">Năm</th>
                    <th className="p-4 font-bold text-gray-600">Thời gian</th>
                  </>
                )}
                <th className="p-4 font-bold text-gray-600">
                  {activeTab === 'users' ? 'Họ và tên' : 'Nội dung / Tiêu đề'}
                </th>
                {activeTab === 'users' && (
                  <th className="p-4 font-bold text-gray-600">Tên đăng nhập</th>
                )}
                {activeTab === 'users' && (
                  <th className="p-4 font-bold text-gray-600">Vai trò</th>
                )}
                <th className="p-4 font-bold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'subjects' ? allSubjects : data).map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-500">{item.id}</td>
                  {activeTab === 'subjects' && (
                    <>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.bg_class} ${item.color_class}`}>
                          {item.bg_class}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-sm">{item.icon_name}</td>
                    </>
                  )}
                  {activeTab === 'questions' && (
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 uppercase">
                        {item.subject_name || 'Chưa phân loại'}
                      </span>
                    </td>
                  )}
                  {activeTab === 'exams' && (
                    <>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                          {item.subject_name || item.subject_id || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 font-semibold">{item.year || '—'}</td>
                      <td className="p-4 text-gray-500">{item.duration_minutes} phút</td>
                    </>
                  )}
                  <td className="p-4 text-gray-800 font-medium">
                    {activeTab === 'users' ? item.full_name : (item.name || item.title || item.content)}
                  </td>
                  {activeTab === 'users' && (
                    <td className="p-4 text-gray-500">@{item.username}</td>
                  )}
                  {activeTab === 'users' && (
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {item.role === 'admin' ? 'Admin' : 'Học sinh'}
                      </span>
                    </td>
                  )}
                  <td className="p-4 flex gap-2">
                    {activeTab !== 'users' && activeTab !== 'subjects' && (
                      <button onClick={() => handleEdit(item)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit size={18} /></button>
                    )}
                    {activeTab !== 'users' && activeTab !== 'subjects' && (
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={18} /></button>
                    )}
                    {activeTab === 'subjects' && (
                      <span className="text-xs text-gray-400 italic px-2">Cố định</span>
                    )}
                    {activeTab === 'exams' && (
                      <button
                        onClick={() => navigate(`/admin/exams/${item.id}/edit`)}
                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition text-xs font-bold border border-green-200"
                        title="Quản lý câu hỏi"
                      >
                        ✉ Câu hỏi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Thêm / Sửa */}
    {showModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">{isEditing ? `Sửa ${activeTab}` : `Thêm ${activeTab} mới`}</h2>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="p-6 space-y-4">
            {/* Nếu là Tab Môn học */}
            {activeTab === 'subjects' && (
              <>
                <input type="text" placeholder="Mã môn (VD: toan-hoc)" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.id || ''}
                  onChange={(e) => setFormData({...formData, id: e.target.value})} />
                <input type="text" placeholder="Tên môn học" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <textarea placeholder="Mô tả" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})} />
                <input type="text" placeholder="Tên icon Lucide (VD: Atom, Calculator, FlaskConical)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.icon_name || ''}
                  onChange={(e) => setFormData({...formData, icon_name: e.target.value})} />
                <input type="text" placeholder="Class nền (VD: bg-blue-50)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.bg_class || ''}
                  onChange={(e) => setFormData({...formData, bg_class: e.target.value})} />
                <input type="text" placeholder="Class màu chữ (VD: text-blue-600)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.color_class || ''}
                  onChange={(e) => setFormData({...formData, color_class: e.target.value})} />
              </>
            )}
            {/* Tab Câu hỏi */}
            {activeTab === 'questions' && (
              <>
                <select 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  value={formData.subject_id || ''}
                  onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                >
                  <option value="">-- Chọn môn học --</option>
                  {allSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} (Mã: {subject.id})
                    </option>
                  ))}
                </select>
                
                <textarea 
                  placeholder="Nhập nội dung câu hỏi" 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  value={formData.content || ''}
                  onChange={(e) => setFormData({...formData, content: e.target.value})} 
                />

                <input 
                  type="text" 
                  placeholder="Lựa chọn A" 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  value={formData.option_a || ''}
                  onChange={(e) => setFormData({...formData, option_a: e.target.value})} 
                />

                <input 
                  type="text" 
                  placeholder="Lựa chọn B" 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  value={formData.option_b || ''}
                  onChange={(e) => setFormData({...formData, option_b: e.target.value})} 
                />

                <input 
                  type="text" 
                  placeholder="Lựa chọn C" 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  value={formData.option_c || ''}
                  onChange={(e) => setFormData({...formData, option_c: e.target.value})} 
                />

                <input 
                  type="text" 
                  placeholder="Lựa chọn D" 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  value={formData.option_d || ''}
                  onChange={(e) => setFormData({...formData, option_d: e.target.value})} 
                />

                <select 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  value={formData.correct_answer || ''}
                  onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                >
                  <option value="">-- Chọn đáp án đúng --</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </>
            )}
            {/* Nếu là Tab Tin tức */}
            {activeTab === 'news' && (
              <>
                <input type="text" placeholder="Tiêu đề tin tức" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})} />
                <textarea placeholder="Nội dung tóm tắt" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.content || ''}
                  onChange={(e) => setFormData({...formData, content: e.target.value})} />
                <input type="url" placeholder="URL bài viết (https://...)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.url || ''}
                  onChange={(e) => setFormData({...formData, url: e.target.value})} />
              </>
            )}

            {/* Tab Tài liệu */}
            {activeTab === 'document' && (
              <>
                <input type="text" placeholder="Tiêu đề tài liệu" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})} />
                <select
                  className="w-full border p-3 rounded-xl outline-none"
                  value={formData.subject_id || ''}
                  onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                >
                  <option value="">-- Chọn môn học --</option>
                  {allSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
                <input type="text" placeholder="URL file tải về (Google Drive, ...)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.file_url || ''}
                  onChange={(e) => setFormData({...formData, file_url: e.target.value})} />
                <input type="text" placeholder="URL xem trực tuyến (Google Drive preview, ...)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.preview_url || ''}
                  onChange={(e) => setFormData({...formData, preview_url: e.target.value})} />
                <input type="text" placeholder="Dung lượng (VD: 2.4 MB)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.file_size || ''}
                  onChange={(e) => setFormData({...formData, file_size: e.target.value})} />
              </>
            )}

            {/* Tab Đề thi */}
            {activeTab === 'exams' && (
              <>
                <input type="text" placeholder="Tiêu đề đề thi (VD: Đề thi THPT 2024)" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})} />
                <select required className="w-full border p-3 rounded-xl outline-none"
                  value={formData.subject_id || ''}
                  onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                >
                  <option value="">-- Chọn môn học --</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <input type="number" placeholder="Năm (VD: 2024)" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.year || ''}
                  onChange={(e) => setFormData({...formData, year: e.target.value})} />
                <input type="number" placeholder="Thời gian làm bài (phút, VD: 90)" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.duration_minutes || ''}
                  onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})} />
                <textarea placeholder="Mô tả (tuỳ chọn)" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </>
            )}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={closeModal} className="flex-1 py-3 font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                Hủy bỏ
              </button>
              <button type="submit" className="flex-1 py-3 font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                Xác nhận lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {/* ===== MODAL UPLOAD PDF ===== */}
      {pdfModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <FileUp size={22} className="text-purple-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Upload PDF Đề Thi</h2>
                  <p className="text-xs text-gray-400">
                    {pdfStep === 1 ? 'Bước 1/2 — Cấu hình đề thi' : `Bước 2/2 — Kiểm tra preview (${pdfPreview?.total || 0} câu hỏi)`}
                  </p>
                </div>
              </div>
              <button onClick={() => setPdfModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-6">

              {/* ---- Bước 1: Cấu hình ---- */}
              {pdfStep === 1 && (
                <div className="space-y-4">
                  {/* Chọn file */}
                  <div
                    onClick={() => pdfFileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                      pdfFile ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <input
                      ref={pdfFileRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => setPdfFile(e.target.files[0] || null)}
                    />
                    <FileUp size={32} className={`mx-auto mb-2 ${pdfFile ? 'text-purple-500' : 'text-gray-300'}`} />
                    {pdfFile
                      ? <p className="font-semibold text-purple-700">{pdfFile.name}</p>
                      : <><p className="font-semibold text-gray-500">Nhấn để chọn file PDF</p>
                          <p className="text-xs text-gray-400 mt-1">Chỉ hỗ trợ PDF dạng text (không phải ảnh scan)</p></>
                    }
                  </div>

                  {/* Meta đề thi */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Tên đề thi</label>
                      <input
                        type="text"
                        placeholder="VD: Đề thi THPT Quốc Gia 2024 môn Toán"
                        value={pdfMeta.title}
                        onChange={e => setPdfMeta(p => ({...p, title: e.target.value}))}
                        className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Môn học</label>
                      <select
                        value={pdfMeta.subject_id}
                        onChange={e => setPdfMeta(p => ({...p, subject_id: e.target.value}))}
                        className="w-full border border-gray-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        <option value="">-- Chọn môn --</option>
                        {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Năm thi</label>
                      <input
                        type="number"
                        min={2000} max={2030}
                        value={pdfMeta.year}
                        onChange={e => setPdfMeta(p => ({...p, year: e.target.value}))}
                        className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-600 mb-1.5">Thời gian làm bài (phút)</label>
                      <input
                        type="number"
                        min={1} max={300}
                        value={pdfMeta.duration_minutes}
                        onChange={e => setPdfMeta(p => ({...p, duration_minutes: e.target.value}))}
                        className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ---- Bước 2: Preview ---- */}
              {pdfStep === 2 && pdfPreview && (
                <div className="space-y-4">
                  {/* Tóm tắt */}
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                    <p className="font-semibold text-green-700">
                      Tách thành công <span className="text-2xl font-black">{pdfPreview.total}</span> câu hỏi
                    </p>
                  </div>

                  {/* Warnings */}
                  {pdfPreview.warnings.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} className="text-yellow-600" />
                        <p className="text-sm font-bold text-yellow-700">{pdfPreview.warnings.length} cảnh báo</p>
                      </div>
                      <ul className="text-xs text-yellow-700 space-y-1 max-h-24 overflow-y-auto">
                        {pdfPreview.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Bảng preview + edit inline */}
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Kiểm tra & chỉnh sửa câu hỏi:</p>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {pdfEditQuestions.map((q, idx) => (
                        <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50 text-sm">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="font-bold text-gray-400 flex-shrink-0">#{idx + 1}</span>
                            <textarea
                              className="flex-1 border border-gray-200 rounded-lg p-2 text-sm resize-none focus:ring-1 focus:ring-purple-400 outline-none"
                              rows={2}
                              value={q.content}
                              onChange={e => {
                                const next = [...pdfEditQuestions];
                                next[idx] = { ...next[idx], content: e.target.value };
                                setPdfEditQuestions(next);
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {['a','b','c','d'].map(opt => (
                              <div key={opt} className="flex items-center gap-1">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  q.correct_answer.toLowerCase() === opt ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>{opt.toUpperCase()}</span>
                                <input
                                  type="text"
                                  value={q[`option_${opt}`] || ''}
                                  onChange={e => {
                                    const next = [...pdfEditQuestions];
                                    next[idx] = { ...next[idx], [`option_${opt}`]: e.target.value };
                                    setPdfEditQuestions(next);
                                  }}
                                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-purple-400 outline-none"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-semibold">Đáp án đúng:</span>
                            {['A','B','C','D'].map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  const next = [...pdfEditQuestions];
                                  next[idx] = { ...next[idx], correct_answer: opt };
                                  setPdfEditQuestions(next);
                                }}
                                className={`w-7 h-7 rounded-full text-xs font-bold transition ${
                                  q.correct_answer.toUpperCase() === opt ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-green-100'
                                }`}
                              >{opt}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-3 flex-shrink-0">
              <button
                onClick={() => pdfStep === 1 ? setPdfModal(false) : setPdfStep(1)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                {pdfStep === 1 ? 'Hủy' : '← Quay lại'}
              </button>
              {pdfStep === 1 ? (
                <button
                  onClick={handleParsePdf}
                  disabled={pdfParsing}
                  className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {pdfParsing ? 'Đang phân tích...' : <><ChevronRight size={18} /> Phân tích đề</>}
                </button>
              ) : (
                <button
                  onClick={handleConfirmPdf}
                  disabled={pdfSaving || pdfEditQuestions.length === 0}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {pdfSaving ? 'Đang lưu...' : <><CheckCircle2 size={18} /> Lưu {pdfEditQuestions.length} câu hỏi</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal quản lý câu hỏi trong đề thi */}
    </div>
  );
};

export default Admin;