import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCcw, Home } from 'lucide-react';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Nhận dữ liệu từ trang Quiz gửi sang
  const { score, total, details } = location.state || { score: 0, total: 0, details: [] };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kết quả bài thi</h1>
        <p className="text-gray-500 mb-6">Bạn đã hoàn thành bài ôn tập môn {details[0]?.subject}</p>
        
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

        <div className="flex justify-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
            <Home size={20} /> Về trang chủ
          </button>
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
            <RefreshCcw size={20} /> Làm lại
          </button>
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
                <p className="text-sm mb-3">Đáp án đúng: <span className="font-bold uppercase text-green-600">{item.correctAnswer}</span></p>
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