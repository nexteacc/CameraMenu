import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get task ID from URL
    const taskId = request.nextUrl.pathname.split('/').pop();
    
    if (!taskId) {
      const errorResult = NextResponse.json({ error: 'Missing task ID' }, { status: 400 });
      errorResult.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
      return errorResult;
    }
    
    // Verify user authentication (get token from request header)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const errorResult = NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
      errorResult.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
      return errorResult;
    }
    
    // Extract token
    // const token = authHeader.split(' ')[1];
    
    // Token validation logic can be added here
    // Note: In production environment, token validity should be verified
    // For example: Validate JWT token or call authentication service
    
    // Call third-party translation API to check task status
    const apiResponse = await fetch(`${process.env.TRANSLATION_API_BASE_URL}/api/v1/translations/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.TRANSLATION_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      const errorResult = NextResponse.json({ 
        error: errorData.message || 'Failed to get translation task status' 
      }, { status: apiResponse.status });
      errorResult.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
      return errorResult;
    }
    
    const taskData = await apiResponse.json();
    
    // Return task information
    const result = NextResponse.json({
      taskId: taskData.taskId,
      status: taskData.status,
      progress: taskData.progress || 0,
      translatedFileUrl: taskData.translatedFileUrl,
      error: taskData.error
    });
    
  
    result.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
    result.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    result.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return result;
    
  } catch (error) {
    console.error('Task query error:', error);
    const errorResult = NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
    
   
    errorResult.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
    errorResult.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    errorResult.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResult;
  }
}

/**
 * 设置CORS响应头
 * @param res 响应对象
 */
function setCORSHeaders(res: Response) {
  res.headers.set('Access-Control-Allow-Origin', 'https://cameramenu.vercel.app');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}


export async function OPTIONS() {
  const res = new Response(null, { status: 200 });
  setCORSHeaders(res);
  return res;
}