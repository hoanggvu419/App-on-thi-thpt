import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Result from './pages/Result';
import Navbar from './components/Navbar'; // Nếu bạn đã tạo Navbar
import Document from './pages/Document';
import News from './pages/News';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import ExamList from './pages/ExamList';
import ExamTake from './pages/ExamTake';
import ExamEditor from './pages/ExamEditor';
import HistoryPage from './pages/History';
import Profile from './pages/Profile';
import { Navigate } from 'react-router-dom';


// Component bảo vệ
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar /> 
        <Routes>
          {/* Trang chủ: localhost:3000/ */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          {/* Trang thi theo môn: localhost:3000/quiz/Toan */}
          <Route path="/quiz/:subject" element={<Quiz />} />
          
          {/* Trang kết quả: localhost:3000/result */}
          <Route path="/result" element={<Result />} />

          <Route path="/document" element={<Document />} />
          <Route path="/news" element={<News />} />
          <Route path="/register" element={<Register />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/exams" element={<ExamList />} />
          <Route path="/exams/:examId" element={<ExamTake />} />
          <Route path="/admin/exams/:examId/edit" element={
            <ProtectedRoute>
              <ExamEditor />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;