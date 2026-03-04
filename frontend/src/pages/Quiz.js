import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Quiz = () => {
  const [userAnswers, setUserAnswers] = useState({}); // Lưu {câu_hỏi_id: 'a'}
  const navigate = useNavigate(); // Để chuyển trang
  const { subject } = useParams(); // Lấy tên môn học từ URL
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    // API lọc theo môn học từ Backend của bạn
    axios.get(`http://127.0.0.1:8000/api/questions/${subject}`)
      .then(res => setQuestions(res.data))
      .catch(err => console.log(err));
  }, [subject]);
const handleNopBai = () => {
  let score = 0;
  const details = questions.map(q => {
    const isCorrect = userAnswers[q.id] === q.correct_answer.toLowerCase();
    if (isCorrect) score++;
    return {
      ...q,
      userAnswer: userAnswers[q.id],
      isCorrect
    };
  });

  // Chuyển sang trang kết quả và gửi kèm dữ liệu
  navigate('/result', { state: { score, total: questions.length, details } });
};
// Hàm để lưu đáp án khi người dùng bấm chọn A, B, C hoặc D
  const handleSelectOption = (questionId, option) => {
  setUserAnswers(prev => ({ 
    ...prev, 
    [questionId]: option 
  }));
};
  if (questions.length === 0) return <div className="p-10 text-center text-gray-500">Đang tải đề thi...</div>;

  const q = questions[currentIdx];

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col md:flex-row gap-8">
      {/* Cột trái: Nội dung câu hỏi */}
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between mb-6">
          <span className="text-blue-600 font-bold uppercase tracking-widest">Môn {subject}</span>
          <span className="text-gray-400">Câu {currentIdx + 1} / {questions.length}</span>
        </div>
        
        <h2 className="text-xl font-medium text-gray-800 mb-8 leading-relaxed">{q.content}</h2>
        
        <div className="grid grid-cols-1 gap-4">
          {['a', 'b', 'c', 'd'].map(opt => (
  <button 
    key={opt}
    onClick={() => handleSelectOption(q.id, opt)}
    // Cập nhật className để đổi màu khi được chọn
    className={`text-left p-4 rounded-xl border transition-all flex items-center gap-4 group ${
      userAnswers[q.id] === opt 
        ? 'border-blue-500 bg-blue-50 shadow-sm' // Màu khi đã chọn
        : 'border-gray-100 hover:bg-blue-50 hover:border-blue-300' // Màu mặc định
    }`}
  >
    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold uppercase transition-all ${
      userAnswers[q.id] === opt
        ? 'bg-blue-600 text-white' // Icon khi chọn
        : 'bg-gray-100 text-gray-500 group-hover:bg-blue-600 group-hover:text-white'
    }`}>
      {opt}
    </span>
    <span className={`transition-all ${userAnswers[q.id] === opt ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
      {q[`option_${opt}`]}
    </span>
  </button>
))}
        </div>
      </div>

      {/* Cột phải: Danh sách số câu (Giống web thi thật) */}
      <div className="w-full md:w-80 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-24">
        <h3 className="font-bold text-gray-800 mb-4">Danh sách câu hỏi</h3>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((_, index) => {
  const questionId = questions[index].id;
  const isAnswered = userAnswers[questionId] !== undefined; // Kiểm tra đã làm chưa

  return (
    <button 
      key={index}
      onClick={() => setCurrentIdx(index)}
      className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all ${
        currentIdx === index 
          ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300' // Đang xem
          : isAnswered 
            ? 'bg-green-100 text-green-700 border border-green-200' // Đã làm
            : 'bg-gray-50 text-gray-400 hover:bg-gray-100' // Chưa làm
      }`}
    >
      {index + 1}
    </button>
  );
})}
        </div>
        <button onClick={handleNopBai} className="w-full mt-8 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100">
          Nộp bài
        </button>
      </div>
    </div>
  );
};

export default Quiz;