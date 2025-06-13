import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 从URL中获取任务ID
    const taskId = request.nextUrl.pathname.split('/').pop();
    
    if (!taskId) {
      return NextResponse.json({ error: '缺少任务ID' }, { status: 400 });
    }
    
    // 验证用户认证（从请求头获取token）
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 提取token
    // const token = authHeader.split(' ')[1];
    
    // 这里可以添加token验证逻辑
    // 注意：实际生产环境中应该验证token的有效性
    // 例如：验证JWT token或调用认证服务
    
    // 调用第三方翻译API查询任务状态
    const apiResponse = await fetch(`https://translate.simplifyai.cn/api/v1/translations/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.TRANSLATION_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json({ 
        error: errorData.message || '获取翻译任务状态失败' 
      }, { status: apiResponse.status });
    }
    
    const taskData = await apiResponse.json();
    
    // 返回任务信息
    return NextResponse.json({
      taskId: taskData.id,
      status: taskData.status,
      progress: taskData.progress || 0,
      translatedFileUrl: taskData.translatedFileUrl,
      error: taskData.error
    });
    
  } catch (error) {
    console.error('任务查询错误:', error);
    return NextResponse.json({ 
      error: '服务器内部错误' 
    }, { status: 500 });
  }
}