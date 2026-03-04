import React from 'react';
import { FileText, Download, Search } from 'lucide-react';

const Document = () => {
  const docs = [
    { id: 1, title: "Tổng hợp công thức Giải tích 12", subject: "Toán", size: "2.4 MB" },
    { id: 2, title: "70 câu trắc nghiệm Vật lý hạt nhân", subject: "Vật lý", size: "1.8 MB" },
    { id: 3, title: "Từ vựng trọng tâm thi THPT Quốc gia", subject: "Tiếng Anh", size: "3.5 MB" },
    { id: 4, title: "Sơ đồ tư duy Hóa hữu cơ lớp 11-12", subject: "Hóa học", size: "5.0 MB" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4">Kho tài liệu ôn thi</h1>
        <div className="relative">
          <input type="text" placeholder="Tìm tài liệu..." className="pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-500 outline-none w-64" />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {docs.map(doc => (
          <div key={doc.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 h-12">{doc.title}</h3>
            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
              <span>{doc.subject}</span>
              <span>{doc.size}</span>
            </div>
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm">
              <Download size={16} /> Tải xuống
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Document;