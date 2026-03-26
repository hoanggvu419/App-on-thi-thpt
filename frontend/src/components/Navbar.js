import React, {useEffect, useState, useRef} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, History, ChevronDown, UserCircle } from 'lucide-react'; 

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem('user');
      setUser(null);
      setDropdownOpen(false);
      navigate('/');
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
        <Link to="/exams" className="hover:text-blue-600 transition">Đề thi</Link>
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
          // NẾU ĐÃ ĐĂNG NHẬP: Dropdown menu
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 text-gray-700 font-medium hover:text-blue-600 transition px-2 py-1 rounded-lg hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block">{user.full_name}</span>
              <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-sm font-bold text-gray-800 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition"
                >
                  <UserCircle size={17} /> Hồ sơ cá nhân
                </Link>

                <Link
                  to="/history"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition"
                >
                  <History size={17} /> Lịch sử làm bài
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-orange-500 hover:bg-orange-50 transition font-semibold"
                  >
                    <User size={17} /> Quản trị Admin
                  </Link>
                )}

                <div className="border-t border-gray-50 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    <LogOut size={17} /> Đăng xuất
                  </button>
                </div>
              </div>
            )}
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