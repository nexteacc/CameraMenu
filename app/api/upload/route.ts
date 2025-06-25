import { NextRequest, NextResponse } from 'next/server';

/**
 * 设置CORS响应头
 * @param res 响应对象
 */
function setCORSHeaders(res: Response) {
  res.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}


export async function OPTIONS() {
  const res = new Response(null, { status: 200 });
  setCORSHeaders(res);
  return res;
}
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const toLang = formData.get('toLang') as string;
    const fromLang = formData.get('fromLang') as string;
    const userId = formData.get('userId') as string;

    
    if (!image || !toLang || !fromLang || !userId) {
      const errorResult = NextResponse.json(
        { error: 'Missing required parameters: image, toLang, fromLang, userId' },
        { status: 400 }
      );
      errorResult.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
      return errorResult;
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errorResult = NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
      errorResult.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
      return errorResult;
    }


    const apiFormData = new FormData();
    apiFormData.append('file', image);
    apiFormData.append('fromLang', fromLang);
    apiFormData.append('toLang', toLang);

    const apiResponse = await fetch(`${process.env.TRANSLATION_API_BASE_URL}/api/v1/translations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRANSLATION_API_KEY}`
      },
      body: apiFormData
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      const errorResult = NextResponse.json({ 
        error: errorData.message || 'Translation service call failed' 
      }, { status: apiResponse.status });
      errorResult.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
      return errorResult;
    }
    
    const translationData = await apiResponse.json();
    


    const result = NextResponse.json({
      taskId: translationData.taskId,
      status: translationData.status, 
    });
    
    // 确保CORS头部被设置
    result.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
    result.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return result;
    
  } catch (error) {
    console.error('Upload processing error:', error);
    const errorResult = NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
    
    // 确保错误响应也有CORS头部
    errorResult.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
    errorResult.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResult.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResult;
  }
}