"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface HSCodeItem {
  id: number;
  hsCode: string;
  englishName: string;
  chineseNote: string;
}

export default function Home() {
  const [items, setItems] = useState<HSCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    hsCode: '',
    englishName: '',
    chineseNote: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // 获取数据
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hscodes');
      const result = await response.json();

      if (result.success) {
        setItems(result.data);
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      setError('网络请求失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchItems();
  }, []);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 提交表单（添加或更新）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hsCode.trim() || !formData.englishName.trim()) {
      alert('HS编码和英文品名是必填项');
      return;
    }

    try {
      if (editingId !== null) {
        // 更新现有记录
        const response = await fetch(`/api/hscodes/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await response.json();

        if (result.success) {
          await fetchItems();
          resetForm();
        } else {
          alert(`更新失败: ${result.error}`);
        }
      } else {
        // 添加新记录
        const response = await fetch('/api/hscodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const result = await response.json();

        if (result.success) {
          await fetchItems();
          resetForm();
        } else {
          alert(`添加失败: ${result.error}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('操作失败，请检查网络连接');
    }
  };

  // 删除记录
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      const response = await fetch(`/api/hscodes/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        await fetchItems();
      } else {
        alert(`删除失败: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('删除失败');
    }
  };

  // 开始编辑
  const startEdit = (item: HSCodeItem) => {
    setEditingId(item.id);
    setFormData({
      hsCode: item.hsCode,
      englishName: item.englishName,
      chineseNote: item.chineseNote
    });
    setIsAdding(false);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({ hsCode: '', englishName: '', chineseNote: '' });
    setEditingId(null);
    setIsAdding(false);
  };

  // 开始添加
  const startAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HS 编码管理系统</h1>
          <p className="text-gray-600 mt-2">使用 Vercel KV 存储的 HS 编码数据增删查改功能</p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {isAdding ? '添加新记录' : editingId !== null ? '编辑记录' : 'HS 编码列表'}
            </h2>
            <button
              onClick={startAdd}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={18} />
              添加新记录
            </button>
          </div>

          {/* 表单 */}
          {(isAdding || editingId !== null) && (
            <form onSubmit={handleSubmit} className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HS 编码 *</label>
                  <input
                    type="text"
                    name="hsCode"
                    value={formData.hsCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如: 39206200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">英文品名 *</label>
                  <input
                    type="text"
                    name="englishName"
                    value={formData.englishName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如: STRAPPING MATERIAL"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">中文备注</label>
                  <input
                    type="text"
                    name="chineseNote"
                    value={formData.chineseNote}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例如: 打包带 / 捆扎材料"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Save size={18} />
                  {editingId !== null ? '更新记录' : '添加记录'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <X size={18} />
                  取消
                </button>
              </div>
            </form>
          )}

          {/* 数据表格 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">加载数据中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchItems}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                重试
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">暂无数据，请添加第一条记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">HS 编码</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">英文品名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">中文备注</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.hsCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.englishName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.chineseNote}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="flex items-center gap-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-md transition-colors"
                          >
                            <Edit size={14} />
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>数据来源: HScode.txt | 存储后端: Vercel KV | 当前记录数: {items.length}</p>
          <p className="mt-2">使用说明: 点击"添加新记录"按钮添加数据，点击行中的"编辑"或"删除"按钮进行操作</p>
        </footer>
      </div>
    </div>
  );
}
