import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, BookOpen, FileText, Newspaper, Plus, Trash2, Edit } from 'lucide-react';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('subjects');
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);

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
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mục này?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/admin/${activeTab}/${id}`);
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
                <th className="p-4 font-bold text-gray-600">Nội dung / Tiêu đề</th>
                <th className="p-4 font-bold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-500">#{item.id}</td>
                  <td className="p-4 text-gray-800 font-medium">
                    {item.name || item.title || item.content}
                  </td>
                  <td className="p-4 flex gap-3">
                    <button className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;