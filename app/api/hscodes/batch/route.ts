import { kv } from '@/lib/kv';
import { NextRequest, NextResponse } from 'next/server';

export interface HSCodeItem {
  id: number;
  hsCode: string;
  englishName: string;
  chineseNote: string;
}

// POST 请求：批量创建 HS 编码记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请提供要添加的记录数组'
      }, { status: 400 });
    }

    // 获取现有数据
    const existingItems = (await kv.get('hscodes') as HSCodeItem[]) || [];

    // 生成新 ID 的起始值
    const maxId = existingItems.length > 0 ? Math.max(...existingItems.map(item => item.id)) : 0;
    let currentId = maxId + 1;

    // 创建新记录数组
    const newItems: HSCodeItem[] = [];
    const errors: string[] = [];

    items.forEach((item: any, index: number) => {
      const { hsCode, englishName, chineseNote } = item;

      if (!hsCode || !englishName) {
        errors.push(`第 ${index + 1} 条记录缺少必填项（hsCode 和 englishName）`);
        return;
      }

      newItems.push({
        id: currentId++,
        hsCode: hsCode.trim(),
        englishName: englishName.trim(),
        chineseNote: chineseNote?.trim() || ''
      });
    });

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: `数据验证失败：\n${errors.join('\n')}`
      }, { status: 400 });
    }

    if (newItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: '没有有效的记录可以添加'
      }, { status: 400 });
    }

    // 合并现有数据和新数据
    const allItems = [...existingItems, ...newItems];

    // 保存回 KV
    await kv.set('hscodes', allItems);

    return NextResponse.json({
      success: true,
      data: newItems,
      count: newItems.length,
      message: `成功添加 ${newItems.length} 条记录`
    }, { status: 201 });

  } catch (error) {
    console.error('批量创建 HS 编码记录失败:', error);
    return NextResponse.json({
      success: false,
      error: '批量创建记录失败'
    }, { status: 500 });
  }
}
