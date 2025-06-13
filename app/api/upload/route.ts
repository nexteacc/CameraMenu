import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 获取表单数据
    const formData = await request.formData();
    
    // 获取必要参数
    const imageFile = formData.get('image') as File | null;
    const targetLang = formData.get('targetLang') as string;
    const fromLang = formData.get('fromLang') as string; // 获取 fromLang
    const userId = formData.get('userId') as string;
    
    // 验证参数
    if (!imageFile || !targetLang || !fromLang || !userId) { // 增加 fromLang 验证
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证用户认证（从请求头获取token）
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 提取token
    // const token = authHeader.split(' ')[1];
    
    // 这里可以添加token验证逻辑
    // ...
    
    // 读取图片数据
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    
    // 调用第三方翻译API
    const apiResponse = await fetch('https://translate.simplifyai.cn/api/v1/translations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRANSLATION_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file: `data:${imageFile.type};base64,${imageBase64}`,
        fromLang: fromLang,  // 使用前端传递的 fromLang
        toLang: targetLang,
        fastCreation: true,  // 异步处理
        clientTaskId: `menu_${userId}_${Date.now()}`  // 自定义任务ID
      })
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json({ 
        error: errorData.message || '翻译服务调用失败' 
      }, { status: apiResponse.status });
    }
    
    const translationData = await apiResponse.json();
    
    // 返回任务信息
    // 当 fastCreation 为 true 时，第三方API通常只返回任务ID和初始状态

    return NextResponse.json({
      taskId: translationData.id,
      status: translationData.status, 
    });
    
  } catch (error) {
    console.error('上传处理错误:', error);
    return NextResponse.json({ 
      error: '服务器内部错误' 
    }, { status: 500 });
  }
}