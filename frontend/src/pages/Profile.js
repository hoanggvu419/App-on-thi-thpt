import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, Save, History, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { SUBJECTS } from '../constants/subjects';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Form thông tin
  const [fullName, setFullName] = useState('');

  // Form đổi mật khẩu
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', msg: '' }

  // Thống kê
  const [stats, setStats] = useState({ total: 0, avg: 0, best: 0 });
  const [subjectStats, setSubjectStats] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setFullName(u.full_name);

    // Lấy lịch sử để tính thống kê
    axios.get(`http://127.0.0.1:8000/api/results?user_id=${u.id}`)
      .then(res => {
        const results = res.data;
        if (results.length === 0) return;
        const percents = results.map(r => Math.round((r.score / r.total) * 100));
        setStats({
          total: results.length,
          avg: Math.round(percents.reduce((a, b) => a + b, 0) / percents.length),
          best: Math.max(...percents),
        });

        // Thống kê theo môn
        const bySubject = {};
        results.forEach(r => {
          if (!r.subject_id) return;
          if (!bySubject[r.subject_id]) bySubject[r.subject_id] = [];
          bySubject[r.subject_id].push(Math.round((r.score / r.total) * 100));
        });
        const sStats = Object.entries(bySubject).map(([sid, ps]) => ({
          subject_id: sid,
          name: SUBJECTS.find(s => s.id === sid)?.name || sid,
          color: SUBJECTS.find(s => s.id === sid)?.color_class || 'text-blue-600',
          bg: SUBJECTS.find(s => s.id === sid)?.bg_class || 'bg-blue-50',
          count: ps.length,
          avg: Math.round(ps.reduce((a, b) => a + b, 0) / ps.length),
          best: Math.max(...ps),
        }));
        setSubjectStats(sStats);
      })
      .catch(() => {});
  }, []);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3500);
  };

  // Lưu thông tin cơ bản
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { showAlert('error', 'Họ tên không được để trống!'); return; }
    setSaving(true);
    try {
      const res = await axios.put(`http://127.0.0.1:8000/api/users/${user.id}`, {
        full_name: fullName.trim(),
      });
      const updated = { ...user, full_name: res.data.user.full_name };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      showAlert('success', 'Cập nhật thông tin thành công!');
    } catch {
      showAlert('error', 'Lỗi khi cập nhật thông tin!');
    } finally {
      setSaving(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword) { showAlert('error', 'Vui lòng nhập mật khẩu hiện tại!'); return; }
    if (newPassword.length < 6) { showAlert('error', 'Mật khẩu mới phải có ít nhất 6 ký tự!'); return; }
    if (newPassword !== confirmPassword) { showAlert('error', 'Xác nhận mật khẩu không khớp!'); return; }
    setSaving(true);
    try {
      await axios.put(`http://127.0.0.1:8000/api/users/${user.id}`, {
        full_name: user.full_name,
        old_password: oldPassword,
        password: newPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAlert('success', 'Đổi mật khẩu thành công!');
    } catch (err) {
      showAlert('error', err.response?.data?.detail || 'Mật khẩu hiện tại không đúng!');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const roleLabel = user.role === 'admin' ? 'Quản trị viên' : 'Học sinh';
  const roleColor = user.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600';

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Alert */}
      {alert && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium shadow-sm ${
          alert.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {alert.type === 'success'
            ? <CheckCircle size={18} />
            : <AlertCircle size={18} />}
          {alert.msg}
        </div>
      )}

      {/* Thẻ hồ sơ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{user.full_name}</h1>
            <p className="text-sm text-gray-400">@{user.username}</p>
            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold ${roleColor}`}>
              <ShieldCheck size={13} /> {roleLabel}
            </span>
          </div>
        </div>

        {/* Thống kê nhanh */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-50">
            <div className="text-center">
              <p className="text-2xl font-black text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Bài đã làm</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-orange-500">{stats.avg}%</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Trung bình</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-green-600">{stats.best}%</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Cao nhất</p>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-50">
          <Link
            to="/history"
            className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline"
          >
            <History size={15} /> Xem lịch sử làm bài
          </Link>
        </div>
      </div>

      {/* Form cập nhật thông tin */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={20} className="text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800">Thông tin cá nhân</h2>
        </div>
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Tên đăng nhập</label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full border border-gray-200 bg-gray-50 text-gray-400 p-3 rounded-xl text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Nhập họ và tên..."
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 transition"
          >
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>
      </div>

      {/* Form đổi mật khẩu */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={20} className="text-orange-500" />
          <h2 className="text-lg font-bold text-gray-800">Đổi mật khẩu</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none transition"
              placeholder="Nhập mật khẩu hiện tại..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none transition"
              placeholder="Tối thiểu 6 ký tự..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 outline-none transition"
              placeholder="Nhập lại mật khẩu mới..."
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-60 transition"
          >
            <Lock size={16} /> {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>

      {/* Thống kê theo môn */}
      {subjectStats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Thống kê theo môn</h2>
          <div className="grid grid-cols-1 gap-3">
            {subjectStats.map(s => (
              <div key={s.subject_id} className={`flex items-center justify-between p-3 rounded-xl ${s.bg}`}>
                <div>
                  <p className={`font-bold text-sm ${s.color}`}>{s.name}</p>
                  <p className="text-xs text-gray-400">{s.count} bài đã làm</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${s.color}`}>{s.avg}%</p>
                  <p className="text-xs text-gray-400">TB • cao nhất {s.best}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
