import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Clock, ChevronRight, BookOpen } from 'lucide-react';

const ExamList = () => {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/subjects')
      .then(r => setSubjects(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedSubject
      ? `http://127.0.0.1:8000/api/exams?subject_id=${selectedSubject}`
      : 'http://127.0.0.1:8000/api/exams';
    axios.get(url)
      .then(r => setExams(r.data))
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, [selectedSubject]);

  // Nhóm đề thi theo năm (giảm dần)
  const byYear = exams.reduce((acc, exam) => {
    const yr = exam.year || 'Khác';
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(exam);
    return acc;
  }, {});
  const years = Object.keys(byYear).sort((a, b) => b - a);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <FileText size={36} className="text-orange-300" />
          <div>
            <h1 className="text-3xl font-extrabold">Đề Thi</h1>
            <p className="text-blue-200 mt-1">Luyện tập với đề thi THPT Quốc Gia các năm trước</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Bộ lọc theo môn */}
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => setSelectedSubject('')}
            className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
              !selectedSubject
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'
            }`}
          >
            Tất cả môn
          </button>
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                selectedSubject === s.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Trạng thái loading */}
        {loading && (
          <div className="text-center text-gray-400 py-20">Đang tải dữ liệu...</div>
        )}

        {/* Không có đề thi */}
        {!loading && years.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <BookOpen size={56} className="mb-4 opacity-30" />
            <p className="text-lg font-semibold">Chưa có đề thi nào</p>
            <p className="text-sm mt-1">Đề thi sẽ được cập nhật sớm.</p>
          </div>
        )}

        {/* Danh sách đề thi theo năm */}
        {!loading && years.map(year => (
          <div key={year} className="mb-12">
            <h2 className="text-lg font-bold text-gray-700 mb-5 flex items-center gap-3">
              <span className="w-1.5 h-7 bg-blue-600 rounded-full inline-block"></span>
              Năm {year}
              <span className="text-sm font-normal text-gray-400">({byYear[year].length} đề)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {byYear[year].map(exam => (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600">
                      {exam.subject_name || exam.subject_id}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{exam.year}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 leading-snug">{exam.title}</h3>
                  {exam.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{exam.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock size={14} />
                      {exam.duration_minutes} phút
                    </span>
                    <button
                      onClick={() => navigate(`/exams/${exam.id}`)}
                      className="flex items-center gap-1 bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-100"
                    >
                      Làm bài <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamList;
