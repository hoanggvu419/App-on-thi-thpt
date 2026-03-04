import React from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

const News = () => {
  const newsList = [
    { id: 1, title: "Cập nhật phương án thi tốt nghiệp THPT năm 2026", date: "04/02/2026", type: "Thông báo" },
    { id: 2, title: "Top 5 mẹo ôn thi môn Tiếng Anh đạt điểm 9+", date: "02/02/2026", type: "Bí kíp" },
    { id: 3, title: "Lịch thi thử đợt 1 các trường chuyên toàn quốc", date: "30/01/2026", type: "Tin tức" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 border-l-4 border-orange-500 pl-4 mb-8">Tin tức giáo dục</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tin nổi bật bên trái */}
        <div className="lg:col-span-2 space-y-6">
          {newsList.map(news => (
            <div key={news.id} className="flex gap-6 bg-white p-4 rounded-2xl border border-gray-100 hover:border-orange-200 cursor-pointer group transition">
              <div className="w-40 h-28 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                <img src={`https://caodang.fpt.edu.vn/wp-content/uploads/2024/06/Content-10.png`} alt="img" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-between py-1">
                <div>
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-tighter">{news.type}</span>
                  <h2 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition mt-1">{news.title}</h2>
                </div>
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {news.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> 5 phút đọc</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default News;