import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, ExternalLink } from 'lucide-react';

const News = () => {
  const [newsList, setNewsList] = useState([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/news')
      .then(res => setNewsList(res.data))
      .catch(err => console.error("Lỗi tải tin tức:", err));
  }, []);

  const handleClick = (news) => {
    if (news.url) {
      window.open(news.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 border-l-4 border-orange-500 pl-4 mb-8">Tin tức giáo dục</h1>

      <div className="space-y-4">
        {newsList.length === 0 && (
          <p className="text-center text-gray-400 py-16">Chưa có tin tức nào.</p>
        )}
        {newsList.map(news => (
          <div
            key={news.id}
            onClick={() => handleClick(news)}
            className={`bg-white p-5 rounded-2xl border border-gray-100 hover:border-orange-300 hover:shadow-md transition group ${news.url ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition leading-snug">
                  {news.title}
                </h2>
                {news.content && (
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">{news.content}</p>
                )}
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  {news.date_posted && (
                    <span className="flex items-center gap-1">
                      <Calendar size={13} /> {news.date_posted}
                    </span>
                  )}
                  {news.type && (
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-semibold uppercase tracking-tight">
                      {news.type}
                    </span>
                  )}
                </div>
              </div>
              {news.url && (
                <ExternalLink size={18} className="text-gray-300 group-hover:text-orange-400 transition flex-shrink-0 mt-1" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default News;