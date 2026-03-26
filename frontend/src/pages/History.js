import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { History, BookOpen, Calendar, Trophy, TrendingUp } from 'lucide-react';

const HistoryPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    axios.get(`http://127.0.0.1:8000/api/results?user_id=${user.id}`)
      .then(res => setResults(res.data))
      .catch(err => console.error('Lỗi tải lịch sử:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getPercent = (score, total) => Math.round((score / total) * 100);

  const getScoreStyle = (score, total) => {
    const pct = getPercent(score, total);
    if (pct >= 80) return { bg: 'bg-green-50', text: 'text-green-600', bar: 'bg-green-500' };
    if (pct >= 50) return { bg: 'bg-orange-50', text: 'text-orange-500', bar: 'bg-orange-400' };
    return { bg: 'bg-red-50', text: 'text-red-500', bar: 'bg-red-400' };
  };

  const totalDone = results.length;
  const avgPercent = totalDone > 0
    ? Math.round(results.reduce((s, r) => s + getPercent(r.score, r.total), 0) / totalDone)
    : 0;
  const bestPercent = totalDone > 0
    ? Math.max(...results.map(r => getPercent(r.score, r.total)))
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <History size={22} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lịch sử làm bài</h1>
          <p className="text-sm text-gray-400">Theo dõi quá trình luyện tập của bạn</p>
        </div>
      </div>

      {/* Tổng quan */}
      {totalDone > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-black text-blue-600">{totalDone}</p>
            <p className="text-sm text-gray-400 mt-1 font-medium">Bài đã làm</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-black text-orange-500">{avgPercent}%</p>
            <p className="text-sm text-gray-400 mt-1 font-medium flex items-center justify-center gap-1">
              <TrendingUp size={14} /> Trung bình
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center">
            <p className="text-3xl font-black text-green-600">{bestPercent}%</p>
            <p className="text-sm text-gray-400 mt-1 font-medium flex items-center justify-center gap-1">
              <Trophy size={14} /> Cao nhất
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center text-gray-400 py-16">Đang tải lịch sử...</div>
      )}

      {/* Trống */}
      {!loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <BookOpen size={56} className="mb-4 opacity-30" />
          <p className="text-lg font-semibold">Bạn chưa làm bài thi nào</p>
          <p className="text-sm mt-1 mb-6">Hãy bắt đầu luyện tập để xem lịch sử ở đây.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition"
          >
            Bắt đầu luyện tập
          </button>
        </div>
      )}

      {/* Danh sách kết quả */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => {
            const pct = getPercent(r.score, r.total);
            const style = getScoreStyle(r.score, r.total);
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200 p-5"
              >
                <div className="flex items-center gap-4">
                  {/* Score badge */}
                  <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center ${style.bg}`}>
                    <span className={`text-xl font-black leading-none ${style.text}`}>{pct}%</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{r.exam_title}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <Calendar size={12} />
                      {formatDate(r.created_at)}
                    </p>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                      <div
                        className={`h-full rounded-full ${style.bar} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-2xl font-black ${style.text}`}>
                      {r.score}<span className="text-base font-semibold text-gray-300">/{r.total}</span>
                    </p>
                    <p className="text-xs text-gray-400">câu đúng</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
