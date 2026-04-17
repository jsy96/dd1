import { kv } from '@/lib/kv';
import { NextRequest, NextResponse } from 'next/server';

export interface HSCodeItem {
  id: number;
  hsCode: string;
  englishName: string;
  chineseNote: string;
}

// GET 请求：获取所有 HS 编码记录
export async function GET(request: NextRequest) {
  try {
    // 从 KV 中获取数据
    const items = await kv.get<HSCodeItem[]>('hscodes');

    // 如果数据不存在，返回空数组
    const data = items || [];

    return NextResponse.json({
      success: true,
      data,
      count: data.length
    }, { status: 200 });

  } catch (error) {
    console.error('获取 HS 编码数据失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取数据失败'
    }, { status: 500 });
  }
}

// POST 请求：创建新的 HS 编码记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证必要字段
    const { hsCode, englishName, chineseNote } = body;
    if (!hsCode || !englishName) {
      return NextResponse.json({
        success: false,
        error: '缺少必要字段: hsCode 和 englishName 是必填项'
      }, { status: 400 });
    }

    // 获取现有数据
    const items = await kv.get<HSCodeItem[]>('hscodes') || [];

    // 生成新 ID（现有最大 ID + 1）
    const maxId = items.length > 0 ? Math.max(...items.map(item => item.id)) : 0;
    const newId = maxId + 1;

    // 创建新记录
    const newItem: HSCodeItem = {
      id: newId,
      hsCode: hsCode.trim(),
      englishName: englishName.trim(),
      chineseNote: chineseNote?.trim() || ''
    };

    // 添加到数组
    items.push(newItem);

    // 保存回 KV
    await kv.set('hscodes', items);

    return NextResponse.json({
      success: true,
      data: newItem,
      message: '记录创建成功'
    }, { status: 201 });

  } catch (error) {
    console.error('创建 HS 编码记录失败:', error);
    return NextResponse.json({
      success: false,
      error: '创建记录失败'
    }, { status: 500 });
  }
}