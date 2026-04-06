import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Zap, GraduationCap, HelpCircle, X, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { SUBJECTS } from '../constants/subjects';

const Home = () => {
  const subjects = SUBJECTS;
  const [quickModal, setQuickModal] = useState({ open: false, subject: null });
  const [numQuestions, setNumQuestions] = useState(20);
  const [timeLimit, setTimeLimit] = useState(30);
  const [practiceMode, setPracticeMode] = useState(false);
  const navigate = useNavigate();

  // 2. Hàm hỗ trợ hiển thị Icon động từ chuỗi (ví dụ: "Atom" -> <Atom />)
  const renderIcon = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent size={32} /> : <HelpCircle size={32} />;
  };

  const handleOpenQuickModal = (sub) => {
    setNumQuestions(20);
    setTimeLimit(30);
    setPracticeMode(false);
    setQuickModal({ open: true, subject: sub });
  };

  const handleStartQuick = () => {
    navigate(`/quiz/${quickModal.subject.id}`, {
      state: {
        numQuestions: parseInt(numQuestions),
        timeLimit: practiceMode ? null : parseInt(timeLimit),
        quickPractice: true,
        practiceMode,
      }
    });
    setQuickModal({ open: false, subject: null });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 1. Hero Banner */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="text-left md:w-1/2">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Luyện Thi THPT Quốc Gia <br /> <span className="text-orange-400">Hiệu Quả & Miễn Phí</span>
            </h1>
            <p className="text-blue-100 text-lg mb-8">
              Hệ thống ngân hàng câu hỏi bám sát cấu trúc đề thi của Bộ Giáo dục, giúp bạn tự tin chinh phục điểm 9+.
            </p>
            <button
              onClick={() => navigate('/exams')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg">
              Bắt đầu học ngay
            </button>
          </div>
          <div className="hidden md:block">
            <GraduationCap size={200} className="text-blue-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* 2. Danh sách môn học */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-blue-600" /> Luyện thi theo môn học
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subjects.map((sub) => (
            <div key={sub.id} className="group relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-xl transition-all duration-300">
              {/* Icon & Title */}
              <div className={`${sub.bg_class || 'bg-blue-50'} ${sub.color_class || 'text-blue-600'} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {/* Gọi hàm render icon động từ tên icon trong Database */}
                {renderIcon(sub.icon_name)}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-3">{sub.name}</h3>
              <p className="text-gray-500 text-sm mb-6">{sub.description}</p>
              
              <button
                onClick={() => handleOpenQuickModal(sub)}
                className="flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600 transition-all"
              >
                <Zap size={16} /> Luyện tập nhanh
              </button>

              {/* Dropdown Menu khi Hover (Lưu ý: sub.chapters phải là mảng hoặc cần xử lý JSON nếu lưu dạng string) */}
              <div className="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 border border-gray-100 translate-y-2 group-hover:translate-y-0">
                <p className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Danh mục chương bài:</p>
                <div className="space-y-1">
                  {/* Nếu DB chưa có chapters, ta thêm kiểm tra để tránh crash */}
                  {sub.chapters && Array.isArray(sub.chapters) ? sub.chapters.map((chap) => (
                    <div key={chap} className="flex items-center justify-between p-2 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-sm transition cursor-pointer">
                      {chap} <ChevronRight size={14} className="opacity-0 group-hover:opacity-100" />
                    </div>
                  )) : <p className="text-gray-400 text-xs italic">Đang cập nhật...</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Luyện tập nhanh */}
      {quickModal.open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-gray-800">Luyện tập nhanh</h2>
              <button onClick={() => setQuickModal({ open: false, subject: null })} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-blue-600 font-semibold mb-4">{quickModal.subject?.name}</p>

            {/* Chế độ thi */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
              <button
                onClick={() => setPracticeMode(false)}
                className={`flex-1 py-2 text-sm font-bold transition ${!practiceMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                🏆 Thi thử
              </button>
              <button
                onClick={() => setPracticeMode(true)}
                className={`flex-1 py-2 text-sm font-bold transition ${practiceMode ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                📚 Luyện tập
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số câu hỏi</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={numQuestions}
                  onChange={e => setNumQuestions(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                />
              </div>
              {!practiceMode && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Thời gian làm bài (phút)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timeLimit}
                    onChange={e => setTimeLimit(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setQuickModal({ open: false, subject: null })}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleStartQuick}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
              >
                Bắt đầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;