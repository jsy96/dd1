import { kv } from '@/lib/kv';
import { NextRequest, NextResponse } from 'next/server';

export interface HSCodeItem {
  id: number;
  hsCode: string;
  englishName: string;
  chineseNote: string;
}

// PUT 请求：更新指定 ID 的 HS 编码记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json({
        success: false,
        error: 'ID 必须是数字'
      }, { status: 400 });
    }

    const body = await request.json();
    const { hsCode, englishName, chineseNote } = body;

    // 至少需要一个更新字段
    if (!hsCode && !englishName && !chineseNote) {
      return NextResponse.json({
        success: false,
        error: '至少需要一个更新字段: hsCode, englishName 或 chineseNote'
      }, { status: 400 });
    }

    // 获取现有数据
    const items = await kv.get<HSCodeItem[]>('hscodes') || [];

    // 查找要更新的项目
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return NextResponse.json({
        success: false,
        error: `未找到 ID 为 ${itemId} 的记录`
      }, { status: 404 });
    }

    // 更新项目
    const updatedItem = { ...items[itemIndex] };
    if (hsCode !== undefined) updatedItem.hsCode = hsCode.trim();
    if (englishName !== undefined) updatedItem.englishName = englishName.trim();
    if (chineseNote !== undefined) updatedItem.chineseNote = chineseNote.trim();

    items[itemIndex] = updatedItem;

    // 保存回 KV
    await kv.set('hscodes', items);

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: '记录更新成功'
    }, { status: 200 });

  } catch (error) {
    console.error('更新 HS 编码记录失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新记录失败'
    }, { status: 500 });
  }
}

// DELETE 请求：删除指定 ID 的 HS 编码记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);

    if (isNaN(itemId)) {
      return NextResponse.json({
        success: false,
        error: 'ID 必须是数字'
      }, { status: 400 });
    }

    // 获取现有数据
    const items = await kv.get<HSCodeItem[]>('hscodes') || [];

    // 查找要删除的项目
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return NextResponse.json({
        success: false,
        error: `未找到 ID 为 ${itemId} 的记录`
      }, { status: 404 });
    }

    // 删除项目
    const deletedItem = items.splice(itemIndex, 1)[0];

    // 保存回 KV
    await kv.set('hscodes', items);

    return NextResponse.json({
      success: true,
      data: deletedItem,
      message: '记录删除成功'
    }, { status: 200 });

  } catch (error) {
    console.error('删除 HS 编码记录失败:', error);
    return NextResponse.json({
      success: false,
      error: '删除记录失败'
    }, { status: 500 });
  }
}