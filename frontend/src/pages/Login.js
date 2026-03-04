import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
    window.location.href = '/admin';
    } 
    else {
    window.location.href = '/';
    }
    } catch (err) {
      alert("Tài khoản hoặc mật khẩu không đúng!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white shadow-xl rounded-2xl w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        <input type="text" placeholder="Username" className="w-full border p-3 rounded-lg mb-4"
          onChange={(e) => setCredentials({...credentials, username: e.target.value})} />
        <input type="password" placeholder="Password" className="w-full border p-3 rounded-lg mb-6"
          onChange={(e) => setCredentials({...credentials, password: e.target.value})} />
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Đăng nhập</button>
      </form>
    </div>
  );
};

export default Login;