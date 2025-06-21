import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const toLang = formData.get('toLang') as string;
    const fromLang = formData.get('fromLang') as string;
    const userId = formData.get('userId') as string;

    // 验证必需的参数
    if (!image || !toLang || !fromLang || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: image, toLang, fromLang, userId' },
        { status: 400 }
      );
    }

    // 验证 Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    // 创建新的FormData发送给第三方API
    const apiFormData = new FormData();
    apiFormData.append('file', image);
    apiFormData.append('fromLang', fromLang);
    apiFormData.append('toLang', toLang);
    apiFormData.append('shouldTranslateImage', 'true'); // 启用图片OCR翻译

    // 调用第三方翻译 API
    const apiResponse = await fetch('https://translate.simplifyai.cn/api/v1/translations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRANSLATION_API_KEY}`
      },
      body: apiFormData
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
      taskId: translationData.taskId,
      status: translationData.status, 
    });
    
  } catch (error) {
    console.error('上传处理错误:', error);
    return NextResponse.json({ 
      error: '服务器内部错误' 
    }, { status: 500 });
  }
}