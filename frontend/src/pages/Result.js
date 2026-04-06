import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCcw, Home, RotateCcw } from 'lucide-react';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, total, details, subjectName, retryPath, retryState } = location.state || { score: 0, total: 0, details: [] };

  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const score10 = total > 0 ? (score / total * 10).toFixed(2) : '0.00';
  const percentColor = percent >= 80 ? 'text-green-500' : percent >= 50 ? 'text-orange-500' : 'text-red-500';

  const wrongDetails = details.filter(d => !d.isCorrect);

  const handleRetry = () => {
    if (retryPath) {
      navigate(retryPath, retryState ? { state: retryState } : {});
    } else {
      navigate('/');
    }
  };

  const handleReviewWrong = () => {
    navigate('/quiz/review', {
      state: { reviewQuestions: wrongDetails, practiceMode: true },
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kết quả bài thi</h1>
        {subjectName && (
          <p className="text-gray-500 mb-4">Bạn đã hoàn thành: <span className="font-semibold text-blue-600">{subjectName}</span></p>
        )}

        {/* Điểm thang 10 — nổi bật */}
        <div className={`text-7xl font-black mb-1 ${percentColor}`}>{score10}</div>
        <p className="text-gray-400 text-sm font-medium mb-1">điểm / thang 10</p>
        <p className="text-gray-300 text-xs mb-6">({percent}% — {score}/{total} câu đúng)</p>

        <div className="flex justify-center gap-12 mb-8">
          <div>
            <p className="text-4xl font-black text-green-500">{score}</p>
            <p className="text-sm text-gray-400 uppercase font-bold">Câu đúng</p>
          </div>
          <div className="border-l border-gray-100"></div>
          <div>
            <p className="text-4xl font-black text-red-400">{total - score}</p>
            <p className="text-sm text-gray-400 uppercase font-bold">Câu sai</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
            <Home size={18} /> Về trang chủ
          </button>
          {retryPath && (
            <button onClick={handleRetry} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
              <RefreshCcw size={18} /> Làm lại
            </button>
          )}
          {wrongDetails.length > 0 && (
            <button onClick={handleReviewWrong} className="flex items-center gap-2 bg-orange-500 text-white px-5 py-3 rounded-xl font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 transition">
              <RotateCcw size={18} /> Ôn lại {wrongDetails.length} câu sai
            </button>
          )}
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-800 mb-4">Xem lại đáp án</h3>
      <div className="space-y-4">
        {details.map((item, index) => (
          <div key={index} className={`p-6 rounded-2xl border-2 ${item.isCorrect ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
            <div className="flex items-start gap-4">
              {item.isCorrect ? <CheckCircle className="text-green-500 mt-1" /> : <XCircle className="text-red-500 mt-1" />}
              <div>
                <p className="font-bold text-gray-800 mb-2">Câu {index + 1}: {item.content}</p>
                <p className="text-sm mb-1">Đáp án của bạn: <span className="font-bold uppercase">{item.userAnswer}</span></p>
                <p className="text-sm mb-3">Đáp án đúng: <span className="font-bold uppercase text-green-600">{item.correct_answer}</span></p>
                {item.explanation && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm italic text-gray-600">
                    <strong>Giải thích:</strong> {item.explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Result;