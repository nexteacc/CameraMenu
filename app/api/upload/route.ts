import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const toLang = formData.get('toLang') as string;
    const fromLang = formData.get('fromLang') as string;
    const userId = formData.get('userId') as string;

    
    if (!image || !toLang || !fromLang || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: image, toLang, fromLang, userId' },
        { status: 400 }
      );
    }

   
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }


    const apiFormData = new FormData();
    apiFormData.append('file', image);
    apiFormData.append('fromLang', fromLang);
    apiFormData.append('toLang', toLang);
    apiFormData.append('shouldTranslateImage', 'true'); 

    const apiResponse = await fetch(`${process.env.TRANSLATION_API_BASE_URL}/api/v1/translations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TRANSLATION_API_KEY}`
      },
      body: apiFormData
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json({ 
        error: errorData.message || 'Translation service call failed' 
      }, { status: apiResponse.status });
    }
    
    const translationData = await apiResponse.json();
    
    // Return task information
    // When fastCreation is true, third-party API usually only returns task ID and initial status

    return NextResponse.json({
      taskId: translationData.taskId,
      status: translationData.status, 
    });
    
  } catch (error) {
    console.error('Upload processing error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}