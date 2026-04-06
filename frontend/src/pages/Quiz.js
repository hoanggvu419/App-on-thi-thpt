import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, CheckCircle, XCircle } from 'lucide-react';
import { SUBJECTS } from '../constants/subjects';

const Quiz = () => {
  const [userAnswers, setUserAnswers] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const { subject } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flagged, setFlagged] = useState(new Set());

  const { numQuestions: numQ, timeLimit, quickPractice, practiceMode, reviewQuestions } = location.state || {};
  const isReviewMode = Boolean(reviewQuestions);
  const isPracticeMode = Boolean(practiceMode) || isReviewMode;

  const [timeLeft, setTimeLeft] = useState(isPracticeMode ? null : (timeLimit ? timeLimit * 60 : null));

  const questionsRef = useRef([]);
  const userAnswersRef = useRef({});
  const submittedRef = useRef(false);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { userAnswersRef.current = userAnswers; }, [userAnswers]);

  const subjectLabel = SUBJECTS.find(s => s.id === subject)?.name || subject;

  const toggleFlag = (qId) => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const saveResult = (score, total) => {
    if (isReviewMode) return;
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const u = JSON.parse(stored);
    axios.post('http://127.0.0.1:8000/api/results', {
      user_id: u.id,
      subject_id: subject,
      exam_title: `Luyện tập nhanh - ${subject}`,
      score,
      total,
    }).catch(err => console.error('Lỗi lưu kết quả:', err));
  };

  useEffect(() => {
    if (isReviewMode) {
      setQuestions(reviewQuestions);
      return;
    }
    axios.get(`http://127.0.0.1:8000/api/questions/${subject}`)
      .then(res => {
        let qs = res.data;
        if (quickPractice && numQ && numQ < qs.length) {
          qs = [...qs].sort(() => Math.random() - 0.5).slice(0, numQ);
        }
        setQuestions(qs);
      })
      .catch(err => console.log(err));
  }, [subject]);

  const doSubmit = (qs, ua) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    let score = 0;
    const details = qs.map(q => {
      const isCorrect = (ua[q.id] || '') === (q.correct_answer || '').toLowerCase();
      if (isCorrect) score++;
      return { ...q, userAnswer: ua[q.id], isCorrect };
    });
    saveResult(score, qs.length);
    navigate('/result', {
      state: {
        score, total: qs.length, details,
        subjectName: isReviewMode ? 'Ôn lại câu sai' : subjectLabel,
        retryPath: isReviewMode ? null : `/quiz/${subject}`,
        retryState: isReviewMode ? null : location.state,
      }
    });
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft === 0) {
      doSubmit(questionsRef.current, userAnswersRef.current);
      return;
    }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  const handleNopBai = () => {
    if (!isPracticeMode) {
      const unanswered = questions.filter(q => !userAnswers[q.id]).length;
      if (unanswered > 0) {
        const ok = window.confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài?`);
        if (!ok) return;
      }
    }
    doSubmit(questionsRef.current, userAnswersRef.current);
  };

  const handleSelectOption = (questionId, option) => {
    if (isPracticeMode && userAnswers[questionId]) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const getOptionStyle = (q, opt) => {
    const isRevealed = isPracticeMode && Boolean(userAnswers[q.id]);
    const correct = (q.correct_answer || '').toLowerCase();
    const selected = userAnswers[q.id];
    if (isRevealed) {
      if (opt === correct) return 'border-green-500 bg-green-50 shadow-sm';
      if (opt === selected && opt !== correct) return 'border-red-400 bg-red-50';
      return 'border-gray-100 opacity-50';
    }
    return selected === opt
      ? 'border-blue-500 bg-blue-50 shadow-sm'
      : 'border-gray-100 hover:bg-blue-50 hover:border-blue-300';
  };

  const getBadgeStyle = (q, opt) => {
    const isRevealed = isPracticeMode && Boolean(userAnswers[q.id]);
    const correct = (q.correct_answer || '').toLowerCase();
    const selected = userAnswers[q.id];
    if (isRevealed) {
      if (opt === correct) return 'bg-green-500 text-white';
      if (opt === selected && opt !== correct) return 'bg-red-400 text-white';
      return 'bg-gray-100 text-gray-400';
    }
    return selected === opt
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-500 group-hover:bg-blue-600 group-hover:text-white';
  };

  const allAnswered = questions.length > 0 && questions.every(q => userAnswers[q.id]);

  if (questions.length === 0) return <div className="p-10 text-center text-gray-500">Đang tải đề thi...</div>;

  const q = questions[currentIdx];
  const isCurrentRevealed = isPracticeMode && Boolean(userAnswers[q.id]);
  const correctAnswer = (q.correct_answer || '').toLowerCase();
  const userAnswer = userAnswers[q.id];

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col md:flex-row gap-8">
      {/* Cột trái: Nội dung câu hỏi */}
      <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-blue-600 font-bold uppercase tracking-widest">
              {isReviewMode ? '🔁 Ôn lại câu sai' : `Môn ${subjectLabel}`}
            </span>
            {isPracticeMode && !isReviewMode && (
              <span className="text-xs bg-orange-100 text-orange-600 font-bold px-2 py-1 rounded-full">📚 Luyện tập</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400">Câu {currentIdx + 1} / {questions.length}</span>
            <button
              onClick={() => toggleFlag(q.id)}
              title={flagged.has(q.id) ? 'Bỏ đánh dấu' : 'Đánh dấu câu này'}
              className={`p-2 rounded-lg transition ${flagged.has(q.id) ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'}`}
            >
              {flagged.has(q.id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
          </div>
        </div>

        <h2 className="text-xl font-medium text-gray-800 mb-8 leading-relaxed">{q.content}</h2>

        <div className="grid grid-cols-1 gap-4">
          {['a', 'b', 'c', 'd'].map(opt => (
            <button
              key={opt}
              onClick={() => handleSelectOption(q.id, opt)}
              disabled={isPracticeMode && Boolean(userAnswers[q.id])}
              className={`text-left p-4 rounded-xl border transition-all flex items-center gap-4 group ${getOptionStyle(q, opt)}`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold uppercase transition-all flex-shrink-0 ${getBadgeStyle(q, opt)}`}>
                {opt}
              </span>
              <span className={`transition-all flex-1 ${userAnswers[q.id] === opt ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                {q[`option_${opt}`]}
              </span>
              {isCurrentRevealed && opt === correctAnswer && (
                <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
              )}
              {isCurrentRevealed && opt === userAnswer && opt !== correctAnswer && (
                <XCircle size={18} className="text-red-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Thông báo đúng/sai trong practice mode */}
        {isCurrentRevealed && (
          <div className={`mt-4 p-4 rounded-xl font-medium text-sm ${userAnswer === correctAnswer ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {userAnswer === correctAnswer
              ? '✅ Chính xác!'
              : `❌ Sai rồi! Đáp án đúng là: ${correctAnswer.toUpperCase()}`
            }
            {q.explanation && <p className="mt-1 text-gray-600 font-normal">{q.explanation}</p>}
          </div>
        )}

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
            disabled={currentIdx === questions.length - 1 || (isPracticeMode && !userAnswers[q.id])}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition"
          >
            Câu tiếp <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Cột phải: Danh sách số câu */}
      <div className="w-full md:w-80 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-24">
        <h3 className="font-bold text-gray-800 mb-4">Danh sách câu hỏi</h3>
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
        {flagged.size > 0 && (
          <p className="text-xs text-yellow-600 font-semibold mb-3">⚑ {flagged.size} câu đánh dấu</p>
        )}
        <div className="grid grid-cols-5 gap-2">
          {questions.map((_, index) => {
            const qId = questions[index].id;
            const isAnswered = userAnswers[qId] !== undefined;
            const isFlagged = flagged.has(qId);
            return (
              <button
                key={index}
                onClick={() => setCurrentIdx(index)}
                className={`relative w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all text-sm ${
                  currentIdx === index
                    ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                    : isFlagged && isAnswered
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                      : isFlagged
                        ? 'bg-yellow-50 text-yellow-600 border-2 border-yellow-300'
                        : isAnswered
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {index + 1}
                {isFlagged && currentIdx !== index && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-400 my-3">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block"></span> Đã làm</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border-2 border-yellow-400 inline-block"></span> Đánh dấu</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block"></span> Đang xem</span>
        </div>
        {isPracticeMode ? (
          allAnswered ? (
            <button onClick={handleNopBai} className="w-full mt-2 bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-100 transition">
              🎯 Xem kết quả
            </button>
          ) : (
            <p className="w-full mt-2 text-center text-sm text-gray-400 py-3">Trả lời hết {questions.length} câu để xem kết quả</p>
          )
        ) : (
          <button onClick={handleNopBai} className="w-full mt-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition">
            Nộp bài
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;