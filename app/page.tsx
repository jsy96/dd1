"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Upload } from 'lucide-react';

interface HSCodeItem {
  id: number;
  hsCode: string;
  englishName: string;
  chineseNote: string;
}

type EditingItem = {
  id: number;
  hsCode: string;
  englishName: string;
  chineseNote: string;
};

export default function Home() {
  const [items, setItems] = useState<HSCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 原位编辑状态
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);

  // 批量添加状态
  const [showBatchAdd, setShowBatchAdd] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [batchProcessing, setBatchProcessing] = useState(false);

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

  // 原位编辑：开始编辑某行
  const startInlineEdit = (item: HSCodeItem) => {
    setEditingItem({
      id: item.id,
      hsCode: item.hsCode,
      englishName: item.englishName,
      chineseNote: item.chineseNote
    });
  };

  // 原位编辑：取消编辑
  const cancelInlineEdit = () => {
    setEditingItem(null);
  };

  // 原位编辑：保存编辑
  const saveInlineEdit = async () => {
    if (!editingItem) return;
    if (!editingItem.hsCode.trim() || !editingItem.englishName.trim()) {
      alert('HS编码和英文品名是必填项');
      return;
    }

    try {
      const response = await fetch(`/api/hscodes/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hsCode: editingItem.hsCode,
          englishName: editingItem.englishName,
          chineseNote: editingItem.chineseNote
        })
      });
      const result = await response.json();

      if (result.success) {
        await fetchItems();
        setEditingItem(null);
      } else {
        alert(`更新失败: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('更新失败，请检查网络连接');
    }
  };

  // 批量添加：解析并提交
  const handleBatchAdd = async () => {
    if (!batchText.trim()) {
      alert('请输入数据');
      return;
    }

    setBatchProcessing(true);
    const lines = batchText.trim().split('\n');
    const itemsToAdd: { hsCode: string; englishName: string; chineseNote: string }[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // 尝试用 tab 分隔，如果没有 tab 则用逗号分隔
      let parts = trimmedLine.split('\t');
      if (parts.length < 2) {
        parts = trimmedLine.split(/,|，/); // 支持中英文逗号
      }

      if (parts.length < 2) {
        errors.push(`第 ${index + 1} 行格式错误，至少需要两列（HS编码和英文品名）`);
        return;
      }

      const hsCode = parts[0]?.trim() || '';
      const englishName = parts[1]?.trim() || '';
      const chineseNote = parts[2]?.trim() || '';

      if (!hsCode || !englishName) {
        errors.push(`第 ${index + 1} 行缺少必填项`);
        return;
      }

      itemsToAdd.push({ hsCode, englishName, chineseNote });
    });

    if (errors.length > 0) {
      alert(`解析错误：\n${errors.join('\n')}`);
      setBatchProcessing(false);
      return;
    }

    if (itemsToAdd.length === 0) {
      alert('没有有效的数据可以添加');
      setBatchProcessing(false);
      return;
    }

    try {
      const response = await fetch('/api/hscodes/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToAdd })
      });
      const result = await response.json();

      if (result.success) {
        await fetchItems();
        setBatchText('');
        setShowBatchAdd(false);
        alert(`成功添加 ${result.count || itemsToAdd.length} 条记录`);
      } else {
        alert(`添加失败: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('批量添加失败，请检查网络连接');
    } finally {
      setBatchProcessing(false);
    }
  };

  // 打开批量添加弹窗
  const openBatchAdd = () => {
    setShowBatchAdd(true);
    setBatchText('');
  };

  // 关闭批量添加弹窗
  const closeBatchAdd = () => {
    setShowBatchAdd(false);
    setBatchText('');
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HS 编码管理系统</h1>
          <p className="text-gray-600 mt-2">使用 Vercel KV 存储的 HS 编码数据增删查改功能</p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">HS 编码列表</h2>
            <button
              onClick={openBatchAdd}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Upload size={18} />
              批量添加
            </button>
          </div>

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
                  {items.map((item) => {
                    const isEditing = editingItem?.id === item.id;
                    return (
                      <tr key={item.id} className={isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                        {isEditing ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={editingItem.hsCode}
                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, hsCode: e.target.value } : null)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={editingItem.englishName}
                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, englishName: e.target.value } : null)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={editingItem.chineseNote}
                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, chineseNote: e.target.value } : null)}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={saveInlineEdit}
                                  className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-md transition-colors"
                                >
                                  <Save size={14} />
                                  保存
                                </button>
                                <button
                                  onClick={cancelInlineEdit}
                                  className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md transition-colors"
                                >
                                  <X size={14} />
                                  取消
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.hsCode}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{item.englishName}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{item.chineseNote}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startInlineEdit(item)}
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
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>数据来源: HScode.txt | 存储后端: Vercel KV | 当前记录数: {items.length}</p>
          <p className="mt-2">使用说明: 点击"批量添加"按钮粘贴多行数据，点击行中的"编辑"按钮在原位修改记录</p>
        </footer>

        {/* 批量添加模态框 */}
        {showBatchAdd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">批量添加 HS 编码</h3>
                <p className="text-gray-600 text-sm mt-1">
                  每行一条记录，使用 Tab 或逗号分隔三列：HS编码、英文品名、中文备注
                </p>
              </div>
              <div className="p-6 flex-1 overflow-auto">
                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="示例：&#10;39206200&#9;STRAPPING MATERIAL&#9;打包带&#10;39269090&#9;OTHER PLASTIC ARTICLES&#9;其他塑料制品&#10;&#10;或使用逗号分隔：&#10;39206200,STRAPPING MATERIAL,打包带&#10;39269090,OTHER PLASTIC ARTICLES,其他塑料制品"
                />
                <div className="mt-4 text-sm text-gray-500">
                  <p>格式说明：</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>第一列：HS 编码（必填）</li>
                    <li>第二列：英文品名（必填）</li>
                    <li>第三列：中文备注（可选）</li>
                  </ul>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={closeBatchAdd}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  disabled={batchProcessing}
                >
                  <X size={18} />
                  取消
                </button>
                <button
                  onClick={handleBatchAdd}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400"
                  disabled={batchProcessing || !batchText.trim()}
                >
                  {batchProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      处理中...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      批量添加
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
