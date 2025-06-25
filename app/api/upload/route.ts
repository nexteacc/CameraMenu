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
    console.log('=== Upload API Request Started ===');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const toLang = formData.get('toLang') as string;
    const fromLang = formData.get('fromLang') as string;
    const userId = formData.get('userId') as string;
    
    console.log('Parsed form data:', {
      hasImage: !!image,
      toLang,
      fromLang,
      userId,
      imageInfo: image ? { name: image.name, size: image.size, type: image.type } : null
    });

    
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

    // 记录请求详情
    console.log('Making API request to:', `${process.env.TRANSLATION_API_BASE_URL}/api/v1/translations`);
    console.log('Request headers:', {
      'Authorization': `Bearer ${process.env.TRANSLATION_API_KEY ? '[PRESENT]' : '[MISSING]'}`
    });
    console.log('Form data keys:', Array.from(apiFormData.keys()));
    console.log('Image file info:', {
      name: image.name,
      size: image.size,
      type: image.type
    });
    
    const apiResponse = await fetch(`${process.env.TRANSLATION_API_BASE_URL}/api/v1/translations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRANSLATION_API_KEY}`
      },
      body: apiFormData
    });
    
    // 记录响应状态
    console.log('API Response status:', apiResponse.status);
    console.log('API Response headers:', Object.fromEntries(apiResponse.headers.entries()));
    
    if (!apiResponse.ok) {
      let errorData;
      try {
        errorData = await apiResponse.json();
        console.log('API Error response body:', errorData);
      } catch (parseError) {
        console.error('Failed to parse error response as JSON:', parseError);
        const textResponse = await apiResponse.text();
        console.log('API Error response text:', textResponse);
        errorData = { message: `HTTP ${apiResponse.status}: ${textResponse || 'Unknown error'}` };
      }
      
      const errorResult = NextResponse.json({ 
        error: errorData.message || `Translation service call failed (HTTP ${apiResponse.status})` 
      }, { status: apiResponse.status });
      errorResult.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
      return errorResult;
    }
    
    const translationData = await apiResponse.json();
    console.log('API Success response:', translationData);
    


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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    
    const errorResult = NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
    
    // 确保错误响应也有CORS头部
    errorResult.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
    errorResult.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResult.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResult;
  }
}