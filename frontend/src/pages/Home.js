import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, ChevronRight, GraduationCap, HelpCircle } from 'lucide-react';
import * as Icons from 'lucide-react'; 

const Home = () => {
  // 1. Đưa useState và useEffect VÀO TRONG function Home
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/subjects')
      .then(res => {
        setSubjects(res.data);
      })
      .catch(err => console.error("Lỗi kết nối API:", err));
  }, []);

  // 2. Hàm hỗ trợ hiển thị Icon động từ chuỗi (ví dụ: "Atom" -> <Atom />)
  const renderIcon = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent size={32} /> : <HelpCircle size={32} />;
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
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg">
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
              
              <Link 
                to={`/quiz/${sub.id}`} 
                className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all"
              >
                Luyện tập ngay <ChevronRight size={18} />
              </Link>

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
    </div>
  );
};

export default Home;