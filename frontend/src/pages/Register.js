import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', password: '', full_name: '' });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/register', formData);
      if (res.data.status === 'success') {
        alert("Đăng ký thành công! Hãy đăng nhập.");
        navigate('/login');
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Lỗi đăng ký!");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleRegister} className="p-8 bg-white shadow-xl rounded-2xl w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Tạo tài khoản mới</h2>
        <input type="text" placeholder="Họ và tên" className="w-full border p-3 rounded-lg mb-4"
          onChange={(e) => setFormData({...formData, full_name: e.target.value})} required />
        <input type="text" placeholder="Tên đăng nhập" className="w-full border p-3 rounded-lg mb-4"
          onChange={(e) => setFormData({...formData, username: e.target.value})} required />
        <input type="password" placeholder="Mật khẩu" className="w-full border p-3 rounded-lg mb-6"
          onChange={(e) => setFormData({...formData, password: e.target.value})} required />
        
        <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold transition">
          Đăng ký ngay
        </button>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Đã có tài khoản? <Link to="/login" className="text-blue-500 font-bold">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;