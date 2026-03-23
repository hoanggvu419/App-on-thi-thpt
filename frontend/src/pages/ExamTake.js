import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const ExamTake = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Refs để tránh stale closure trong auto-submit
  const questionsRef = useRef([]);
  const userAnswersRef = useRef({});
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { userAnswersRef.current = userAnswers; }, [userAnswers]);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/exams/${examId}`)
      .then(res => {
        setExam(res.data);
        setQuestions(res.data.questions || []);
        setTimeLeft((res.data.duration_minutes || 90) * 60);
      })
      .catch(err => console.log(err));
  }, [examId]);

  const doSubmit = (qs, ua) => {
    let score = 0;
    const details = qs.map(q => {
      const isCorrect = (ua[q.id] || '') === (q.correct_answer || '').toLowerCase();
      if (isCorrect) score++;
      return { ...q, userAnswer: ua[q.id], isCorrect };
    });
    navigate('/result', { state: { score, total: qs.length, details } });
  };

  // Đếm ngược
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft === 0) {
      doSubmit(questionsRef.current, userAnswersRef.current);
      return;
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const handleSelectOption = (qId, opt) => {
    setUserAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const handleNopBai = () => {
    if (submitted) return;
    const unanswered = questions.filter(q => !userAnswers[q.id]).length;
    if (unanswered > 0) {
      const ok = window.confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài?`);
      if (!ok) return;
    }
    setSubmitted(true);
    doSubmit(questionsRef.current, userAnswersRef.current);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!exam || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Đang tải đề thi...
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col md:flex-row gap-8">
      {/* Cột trái: nội dung câu hỏi */}
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between mb-2">
          <span className="text-blue-600 font-bold">{exam.title}</span>
          <span className="text-gray-400 text-sm">{exam.subject_name || exam.subject_id} — {exam.year}</span>
        </div>
        <p className="text-gray-400 text-sm mb-6">Câu {currentIdx + 1} / {questions.length}</p>

        <h2 className="text-lg font-semibold text-gray-800 mb-8 leading-relaxed">{q.content}</h2>

        <div className="grid grid-cols-1 gap-4">
          {['a', 'b', 'c', 'd'].map(opt => (
            <button
              key={opt}
              onClick={() => handleSelectOption(q.id, opt)}
              className={`text-left p-4 rounded-xl border transition-all flex items-center gap-4 group ${
                userAnswers[q.id] === opt
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-100 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold uppercase transition-all flex-shrink-0 ${
                userAnswers[q.id] === opt
                  ? 'bg-blue-600 text-white'
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

        {/* Điều hướng câu */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition"
          >
            <ArrowLeft size={16} /> Câu trước
          </button>
          <button
            onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
            disabled={currentIdx === questions.length - 1}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition"
          >
            Câu tiếp <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Cột phải: timer + danh sách câu */}
      <div className="w-full md:w-80 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-24">
        <h3 className="font-bold text-gray-800 mb-4">Danh sách câu hỏi</h3>

        {/* Đồng hồ đếm ngược */}
        {timeLeft !== null && (
          <div className={`mb-4 p-3 rounded-xl text-center font-mono text-2xl font-bold tracking-widest ${
            timeLeft <= 60
              ? 'bg-red-50 text-red-600 animate-pulse'
              : timeLeft <= 300
                ? 'bg-orange-50 text-orange-500'
                : 'bg-blue-50 text-blue-700'
          }`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        )}

        {/* Grid số câu */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {questions.map((_, index) => {
            const qId = questions[index].id;
            const isAnswered = userAnswers[qId] !== undefined;
            return (
              <button
                key={index}
                onClick={() => setCurrentIdx(index)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all text-sm ${
                  currentIdx === index
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                    : isAnswered
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        {/* Chú thích */}
        <div className="flex gap-4 text-xs text-gray-400 mb-6">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block"></span> Đã làm</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block"></span> Chưa làm</span>
        </div>

        <button
          onClick={handleNopBai}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition"
        >
          Nộp bài
        </button>
      </div>
    </div>
  );
};

export default ExamTake;
