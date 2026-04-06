import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Eye, Search, X } from 'lucide-react';
import { SUBJECTS } from '../constants/subjects';

const Document = () => {
  const [docs, setDocs] = useState([]);
  const subjects = SUBJECTS;
  const [activeSubject, setActiveSubject] = useState('all');
  const [search, setSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/document')
      .then(res => setDocs(res.data))
      .catch(err => console.error("Lỗi tải tài liệu:", err));
  }, []);

  const filtered = docs.filter(doc => {
    const matchSubject = activeSubject === 'all' || doc.subject_id === activeSubject;
    const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4">Kho tài liệu ôn thi</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm tài liệu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-500 outline-none w-64"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {/* Filter theo môn */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveSubject('all')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            activeSubject === 'all' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSubject(s.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeSubject === s.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Danh sách tài liệu */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-16">Không tìm thấy tài liệu nào.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition flex flex-col">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 flex-shrink-0">
                <FileText size={24} />
              </div>
              <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 flex-1">{doc.title}</h3>
              <div className="flex justify-between items-center text-xs text-gray-400 mb-4">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold uppercase">
                  {subjects.find(s => s.id === doc.subject_id)?.name || doc.subject_id}
                </span>
                {doc.file_size && <span>{doc.file_size}</span>}
              </div>
              <div className="flex gap-2 mt-auto">
                {doc.preview_url ? (
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-blue-500 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                  >
                    <Eye size={15} /> Xem
                  </button>
                ) : null}
                {doc.file_url ? (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium ${doc.preview_url ? 'flex-1' : 'w-full'}`}
                  >
                    <Download size={15} /> Tải về
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal xem trực tuyến */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden"
            style={{ height: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="font-bold text-gray-800 line-clamp-1">{previewDoc.title}</h2>
                {previewDoc.file_size && <p className="text-xs text-gray-400 mt-0.5">{previewDoc.file_size}</p>}
              </div>
              <div className="flex items-center gap-3">
                {previewDoc.file_url && (
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    <Download size={15} /> Tải về
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={22} />
                </button>
              </div>
            </div>
            <iframe
              src={previewDoc.preview_url}
              className="flex-1 w-full"
              title={previewDoc.title}
              allow="fullscreen"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Document;