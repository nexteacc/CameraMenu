import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get task ID from URL
    const taskId = request.nextUrl.pathname.split('/').pop();
    
    if (!taskId) {
      return NextResponse.json({ error: 'Missing task ID' }, { status: 400 });
    }
    
    // Verify user authentication (get token from request header)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
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
      return NextResponse.json({ 
        error: errorData.message || 'Failed to get translation task status' 
      }, { status: apiResponse.status });
    }
    
    const taskData = await apiResponse.json();
    
    // Return task information
    return NextResponse.json({
      taskId: taskData.taskId,
      status: taskData.status,
      progress: taskData.progress || 0,
      translatedFileUrl: taskData.translatedFileUrl,
      error: taskData.error
    });
    
  } catch (error) {
    console.error('Task query error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}