import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/login', credentials);
      const user = res.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      alert("Tài khoản hoặc mật khẩu không đúng!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-2xl w-96">
        <h2 className="text-2xl font-bold mb-2 text-center text-blue-600">Đăng nhập</h2>
        <p className="text-center text-sm text-gray-400 mb-6">Chào mừng bạn quay trở lại!</p>
        <input type="text" placeholder="Tên đăng nhập" className="w-full border p-3 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setCredentials({...credentials, username: e.target.value})} />
        <input type="password" placeholder="Mật khẩu" className="w-full border p-3 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setCredentials({...credentials, password: e.target.value})} />
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">Đăng nhập</button>
        <p className="mt-4 text-center text-sm text-gray-600">
          Chưa có tài khoản? <Link to="/register" className="text-blue-500 font-bold hover:underline">Đăng ký ngay</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;