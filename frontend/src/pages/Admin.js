import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, BookOpen, FileText, Newspaper, Plus, Edit, Trash2, X } from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('subjects');
  const [allSubjects, setAllSubjects] = useState([]);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Theo dõi đang Sửa hay Thêm
  const [editId, setEditId] = useState(null);       // Lưu ID của mục đang sửa

  // State lưu dữ liệu người dùng nhập
  const [formData, setFormData] = useState({});
  const fetchAllSubjects = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/subjects');
      setAllSubjects(res.data); // Đổ dữ liệu vào hộp allSubjects
    } catch (err) {
      console.error("Lỗi lấy môn học:", err);
    }
  };

  // Chạy hàm lấy môn học ngay khi trang web vừa load xong
  useEffect(() => {
    fetchAllSubjects();
  }, []);
  // Hàm xử lý gửi dữ liệu lên Backend
  const handleSave = async (e) => {
  e.preventDefault();
  try {
    let res;
    if (isEditing) {
      // Gửi request UPDATE (PUT)
      res = await axios.put(`http://127.0.0.1:8000/api/${activeTab}/${editId}`, formData);
    } else {
      // Gửi request CREATE (POST)
      res = await axios.post(`http://127.0.0.1:8000/api/${activeTab}`, formData);
    }

    if (res.data.status === 'success') {
      alert(isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!");
      closeModal(); // Hàm reset state bên dưới
      fetchData();
    }
  } catch (err) {
    alert("Lỗi khi lưu dữ liệu!");
  }
};
// Hàm đóng modal và reset trắng state
const closeModal = () => {
  setShowModal(false);
  setIsEditing(false);
  setEditId(null);
  setFormData({});
};
  // Load dữ liệu dựa trên Tab đang chọn
  const fetchData = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/${activeTab}`);
      setData(res.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Hàm khi nhấn nút Edit trên dòng
const handleEdit = (item) => {
  setEditId(item.id);
  setFormData(item);      // Đổ toàn bộ dữ liệu dòng đó vào form
  setIsEditing(true);     // Đánh dấu là đang sửa
  setShowModal(true);     // Mở modal
};

  //hàm xử lý xóa mục
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mục này?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/${activeTab}/${id}`);
        fetchData(); // Load lại danh sách
        alert("Xóa thành công!");
      } catch (err) {
        alert("Lỗi khi xóa!");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar bên trái */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6 text-xl font-bold text-blue-600 border-b">Admin Panel</div>
        <nav className="p-4 space-y-2">
          <button onClick={() => setActiveTab('subjects')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'subjects' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}>
            <LayoutDashboard size={20} /> Môn học
          </button>
          <button onClick={() => setActiveTab('questions')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'questions' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}>
            <BookOpen size={20} /> Câu hỏi
          </button>
          <button onClick={() => setActiveTab('document')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'document' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}>
            <FileText size={20} /> Tài liệu
          </button>
          <button onClick={() => setActiveTab('news')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'news' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}>
            <Newspaper size={20} /> Tin tức
          </button>
        </nav>
      </div>

      {/* Nội dung bên phải */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 capitalize">Quản lý {activeTab}</h1>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Plus size={20} /> Thêm mới
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-bold text-gray-600">ID</th>
                {activeTab === 'questions' && (
                  <th className="p-4 font-bold text-gray-600">Môn học</th>
                )}
                <th className="p-4 font-bold text-gray-600">Nội dung / Tiêu đề</th>
                <th className="p-4 font-bold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-500">#{item.id}</td>
                  {activeTab === 'questions' && (
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-600 uppercase">
                        {item.subject_name || 'Chưa phân loại'}
                      </span>
                    </td>
                  )}
                  <td className="p-4 text-gray-800 font-medium">
                    {item.name || item.title || item.content}
                  </td>
                  <td className="p-4 flex gap-3">
                    <button onClick={() => handleEdit(item)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Thêm mới */}
    {showModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Thêm {activeTab} mới</h2>
            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="p-6 space-y-4">
            {/* Nếu là Tab Môn học */}
            {activeTab === 'subjects' && (
              <>
                <input type="text" placeholder="Mã môn (VD: toan-hoc)" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, id: e.target.value})} />
                <input type="text" placeholder="Tên môn học" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <textarea placeholder="Mô tả" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </>
            )}
            {/* Tab Câu hỏi */}
            {activeTab === 'questions' && (
              <>
                <select 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                >
                  <option value="">-- Chọn môn học --</option>
                  {allSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} (Mã: {subject.id})
                    </option>
                  ))}
                </select>
                
                <textarea 
                  placeholder="Nhập nội dung câu hỏi" 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  onChange={(e) => setFormData({...formData, content: e.target.value})} 
                />

                <input 
                  type="text" 
                  placeholder="Lựa chọn A" 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  onChange={(e) => setFormData({...formData, option_a: e.target.value})} 
                />

                <input 
                  type="text" 
                  placeholder="Lựa chọn B" 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  onChange={(e) => setFormData({...formData, option_b: e.target.value})} 
                />

                <input 
                  type="text" 
                  placeholder="Lựa chọn C" 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  onChange={(e) => setFormData({...formData, option_c: e.target.value})} 
                />

                <input 
                  type="text" 
                  placeholder="Lựa chọn D" 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  onChange={(e) => setFormData({...formData, option_d: e.target.value})} 
                />

                <select 
                  required 
                  className="w-full border p-3 rounded-xl outline-none"
                  onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                >
                  <option value="">-- Chọn đáp án đúng --</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </>
            )}
            {/* Nếu là Tab Tin tức */}
            {activeTab === 'news' && (
              <>
                <input type="text" placeholder="Tiêu đề tin tức" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, title: e.target.value})} />
                <textarea placeholder="Nội dung tóm tắt" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, content: e.target.value})} />
              </>
            )}

            {/* Bạn có thể thêm điều kiện cho 'questions' hay 'document' tương tự */}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
                Hủy bỏ
              </button>
              <button type="submit" className="flex-1 py-3 font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition">
                Xác nhận lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
};

export default Admin;