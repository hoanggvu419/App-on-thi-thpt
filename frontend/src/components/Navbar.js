import React, {useEffect, useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut } from 'lucide-react'; 

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem('user'); // Xóa dữ liệu user khỏi bộ nhớ
      setUser(null); // Cập nhật lại giao diện
      navigate('/'); // Chuyển về trang chủ
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      {/* 1. Logo */}
      <div className="flex items-center gap-2">
        <Link to="/" className="text-2xl font-extrabold text-blue-700 tracking-tighter">
          Hoang<span className="text-orange-500">Vu</span>
        </Link>
      </div>

      {/* 2. Menu chính (Ẩn trên mobile) */}
      <div className="hidden md:flex items-center gap-8 font-medium text-gray-700">
        <Link to="/" className="hover:text-blue-600 transition">Trang chủ</Link>
        <Link to="/quiz/Toan" className="hover:text-blue-600 transition">Đề thi</Link>
        <Link to="/document" className="hover:text-blue-600 transition">Tài liệu</Link>
        <Link to="/news" className="hover:text-blue-600 transition">Tin tức</Link>
      </div>

      {/* 3. Thanh tìm kiếm và Nút hành động */}
      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block">
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="bg-gray-100 border-none rounded-full py-2 px-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        </div>

        {user ? (
          // NẾU ĐÃ ĐĂNG NHẬP: Hiện Tên + Nút Đăng xuất
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <User size={18} />
              <span>Chào, {user.full_name}</span>
            </div>
            
            {/* Nếu là Admin thì hiện thêm nút đi tới trang Admin */}
            {user.role === 'admin' && (
              <Link to="/admin" className="text-orange-500 hover:underline text-sm font-bold">
                Quản trị
              </Link>
            )}

            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition"
            >
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        ) : (
          // NẾU CHƯA ĐĂNG NHẬP: Hiện Đăng nhập & Đăng ký
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">
              Đăng nhập
            </Link>
            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;