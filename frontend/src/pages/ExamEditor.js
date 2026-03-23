import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Plus, Edit, Trash2, X, Save,
  CheckCircle, BookOpen, Clock, Upload, Download
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';

const emptyQForm = {
  content: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_answer: '', explanation: ''
};

const ExamEditor = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyQForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const fileRef = React.useRef(null);

  const fetchExam = async () => {
    const res = await axios.get(`${API}/exams/${examId}`);
    setExam(res.data);
    setQuestions(res.data.questions || []);
  };

  useEffect(() => { fetchExam(); }, [examId]);

  // ---- Lưu câu hỏi (thêm mới hoặc cập nhật) ----
  const handleSaveQ = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/exam-questions/${editingId}`, form);
      } else {
        await axios.post(`${API}/exams/${examId}/questions`, form);
      }
      setForm(emptyQForm);
      setEditingId(null);
      setShowForm(false);
      fetchExam();
    } catch {
      alert('Lỗi khi lưu câu hỏi!');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (q) => {
    setForm({ ...q });
    setEditingId(q.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa câu hỏi này?')) return;
    await axios.delete(`${API}/exam-questions/${id}`);
    fetchExam();
  };

  const cancelForm = () => {
    setForm(emptyQForm);
    setEditingId(null);
    setShowForm(false);
  };

  // ---- Import CSV câu hỏi ----
  const handleImportCsv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportingCsv(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`${API}/exams/${examId}/questions/import`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
      fetchExam();
    } catch (err) {
      alert(err.response?.data?.detail || 'Lỗi khi import file!');
    } finally {
      setImportingCsv(false);
      fileRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const header = 'content,option_a,option_b,option_c,option_d,correct_answer,explanation';
    const row = '"Tốc độ ánh sáng trong chân không xấp xỉ bao nhiêu?","2×10^8 m/s","3×10^8 m/s","4×10^8 m/s","5×10^8 m/s","B","c = 3×10^8 m/s"';
    const blob = new Blob([header + '\n' + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mau_cau_hoi_de_thi_${examId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!exam) return (
    <div className="flex items-center justify-center min-h-screen text-gray-500">Đang tải...</div>
  );

  const optionLabels = { a: 'A', b: 'B', c: 'C', d: 'D' };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30 px-6 py-4 flex items-center gap-4 shadow-sm">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft size={20} /> Quay lại Admin
        </button>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex-1">
          <h1 className="font-bold text-gray-800 text-lg leading-tight">{exam.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400 mt-0.5">
            <span className="flex items-center gap-1"><BookOpen size={13} /> {exam.subject_name}</span>
            <span>Năm {exam.year}</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {exam.duration_minutes} phút</span>
            <span className="font-semibold text-blue-600">{questions.length} câu</span>
          </div>
        </div>

        {/* Nút thêm câu hỏi */}
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImportCsv} />
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm transition"
          >
            <Download size={15} /> File mẫu
          </button>
          <button
            onClick={() => fileRef.current.click()}
            disabled={importingCsv}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm transition disabled:opacity-60"
          >
            <Upload size={15} /> {importingCsv ? 'Đang import...' : 'Import CSV'}
          </button>
          <button
            onClick={() => { cancelForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Plus size={18} /> Thêm câu hỏi
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Form thêm / sửa câu hỏi */}
        {showForm && (
          <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-blue-700">
                {editingId ? `Sửa câu hỏi #${editingId}` : `Thêm câu hỏi mới (Câu ${questions.length + 1})`}
              </h2>
              <button onClick={cancelForm} className="text-gray-400 hover:text-gray-700 transition"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveQ} className="space-y-4">
              {/* Nội dung câu hỏi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nội dung câu hỏi *</label>
                <textarea
                  required rows={3}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none resize-none text-gray-800"
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                />
              </div>

              {/* 4 phương án */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['a', 'b', 'c', 'd'].map(opt => (
                  <div key={opt}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Phương án {optionLabels[opt]} *
                    </label>
                    <input
                      required type="text"
                      placeholder={`Nội dung đáp án ${optionLabels[opt]}`}
                      className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none text-gray-800"
                      value={form[`option_${opt}`]}
                      onChange={e => setForm({ ...form, [`option_${opt}`]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              {/* Đáp án đúng + Giải thích */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Đáp án đúng *</label>
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm({ ...form, correct_answer: opt })}
                        className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all border-2 ${
                          form.correct_answer === opt
                            ? 'bg-green-500 text-white border-green-500 shadow-md'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-green-400'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giải thích đáp án (tùy chọn)</label>
                  <textarea
                    rows={3}
                    placeholder="Giải thích tại sao đây là đáp án đúng..."
                    className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none resize-none text-gray-800"
                    value={form.explanation}
                    onChange={e => setForm({ ...form, explanation: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={cancelForm}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit" disabled={saving || !form.correct_answer}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save size={18} /> {saving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Lưu câu hỏi')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Danh sách câu hỏi */}
        {questions.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <BookOpen size={56} className="mb-4 opacity-30" />
            <p className="text-lg font-semibold">Đề thi chưa có câu hỏi nào</p>
            <p className="text-sm mt-1">Bấm <strong>Thêm câu hỏi</strong> để bắt đầu nhập, hoặc <strong>Import CSV</strong> để nhập hàng loạt.</p>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                editingId === q.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 leading-relaxed">
                    <span className="text-blue-500 font-bold mr-2">Câu {idx + 1}.</span>
                    {q.content}
                  </p>

                  {/* 4 đáp án */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <div
                        key={opt}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          q.correct_answer.toLowerCase() === opt
                            ? 'bg-green-50 text-green-700 font-semibold border border-green-200'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {q.correct_answer.toLowerCase() === opt && <CheckCircle size={14} className="flex-shrink-0" />}
                        <span className="font-bold mr-1">{optionLabels[opt]}.</span>
                        {q[`option_${opt}`]}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 text-sm italic text-gray-500 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                      💡 {q.explanation}
                    </div>
                  )}
                </div>

                {/* Nút thao tác */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(q)}
                    className="flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition text-sm font-medium border border-blue-200"
                  >
                    <Edit size={15} /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="flex items-center gap-1.5 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition text-sm font-medium border border-red-200"
                  >
                    <Trash2 size={15} /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Nút thêm câu hỏi cuối trang */}
        {questions.length > 0 && !showForm && (
          <button
            onClick={() => { cancelForm(); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="mt-6 w-full py-4 border-2 border-dashed border-blue-300 text-blue-500 rounded-2xl font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Thêm câu hỏi tiếp theo
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamEditor;
