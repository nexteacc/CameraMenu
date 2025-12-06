import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

/**
 * 设置 CORS 头部
 */
function setCORSHeaders(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

/**
 * 处理 OPTIONS 预检请求
 */
export async function OPTIONS() {
  return setCORSHeaders(
    new NextResponse(null, { status: 200 })
  );
}

/**
 * 食物识别 API - 使用 Gemini 识别图片中的食物并打标签
 * 
 * 请求格式：multipart/form-data
 * - image: File (必需) - 食物图片
 * - toLang: string (必需) - 标签语言
 * 
 * 响应格式：
 * - success: boolean
 * - imageDataUrl: string (Base64 图片 Data URL)
 * - error?: string (错误信息)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== 食物识别 API 请求开始 ===');

    // 验证授权
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return setCORSHeaders(
        NextResponse.json(
          { success: false, error: 'Missing or invalid authorization header' },
          { status: 401 }
        )
      );
    }

    // 解析表单数据
    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const toLang = formData.get('toLang') as string | null;

    console.log('请求参数:', {
      hasImage: !!image,
      toLang,
      imageInfo: image ? { name: image.name, size: image.size, type: image.type } : null
    });

    // 验证必需参数
    if (!image || !toLang) {
      return setCORSHeaders(
        NextResponse.json(
          { success: false, error: 'Missing required parameters: image, toLang' },
          { status: 400 }
        )
      );
    }

    // 验证图片类型
    if (!image.type.startsWith('image/')) {
      return setCORSHeaders(
        NextResponse.json(
          { success: false, error: 'Invalid image type' },
          { status: 400 }
        )
      );
    }

    // 检查 API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY 环境变量未设置');
      return setCORSHeaders(
        NextResponse.json(
          { success: false, error: 'Server configuration error: Missing API key' },
          { status: 500 }
        )
      );
    }

    // 初始化 Gemini 客户端
    const ai = new GoogleGenAI({ apiKey });

    // 读取图片数据并转换为 Base64
    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    console.log('图片处理完成，大小:', imageBuffer.byteLength, 'bytes');

    // 构建食物识别提示词：要求返回标注后的图片 + 仅名称的 JSON 数组
    const prompt = `You are a food recognition assistant.

## Task
Identify all food items in this image and add ${toLang} labels.

## Labeling Style
- Add a colored label near the top-right corner of each food item
- Use different background colors for different items (red, blue, green, orange, purple, etc.)
- Labels should have rounded corners, white text on colored background
- Labels should be clear and readable, not too large
- Each food item gets ONE label with its name in ${toLang}

## Requirements
- Only label food items (fruits, vegetables, dishes, ingredients, snacks, drinks, etc.)
- Keep labels concise 
- Do not label non-food items (plates, utensils, tables, etc.)
- Do not overlap labels with each other
- If the same type of food appears multiple times, label it only once

## Output
- Generate the labeled image.
- Also return ONLY a JSON array (no markdown, no extra text) of food names in ${toLang}.`;

    console.log('正在调用 Gemini API 进行食物识别...');

    // 调用 Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: image.type,
                data: base64Image,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    console.log('Gemini API 响应成功');

    // 处理响应
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return setCORSHeaders(
        NextResponse.json(
          { success: false, error: 'Failed to get recognition result' },
          { status: 500 }
        )
      );
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      return setCORSHeaders(
        NextResponse.json(
          { success: false, error: 'Invalid response format' },
          { status: 500 }
        )
      );
    }

    // 查找图片数据
    let imageDataUrl: string | null = null;
    let textResponse: string | null = null;
    let textPreview: string | null = null;

    for (const part of content.parts) {
      if (part.inlineData) {
        // 找到图片数据
        const mimeType = part.inlineData.mimeType || 'image/png';
        const data = part.inlineData.data;
        imageDataUrl = `data:${mimeType};base64,${data}`;
        console.log('找到生成的标注图片');
      } else if (part.text) {
        textResponse = part.text;
        textPreview = part.text.substring(0, 500);
        console.log('文字响应预览:', textPreview);
      }
    }

    if (!textResponse) {
      console.log('未收到文本部分，content.parts 长度:', content.parts.length);
    }

    // 如果没有图片但有文字响应，说明模型可能无法生成图片
    if (!imageDataUrl) {
      console.log('未找到生成的图片，文字响应:', textResponse);
      return setCORSHeaders(
        NextResponse.json(
          { 
            success: false, 
            error: 'Failed to generate labeled image. Model response: ' + (textResponse || 'No text response'),
            textResponse 
          },
          { status: 500 }
        )
      );
    }

    console.log('食物识别完成，返回结果');

    // 解析文字响应为食物列表（若失败则为空数组，不影响图片）
    const parseFoodList = (text: string | null): string[] => {
      if (!text) return [];
      try {
        // 去掉可能的 ```json 包裹
        const cleaned = text
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((v) => v);
        }
      } catch (err) {
        console.warn('解析食物列表失败，返回空数组', err);
      }
      return [];
    };

    const foodList = parseFoodList(textResponse);

    return setCORSHeaders(
      NextResponse.json({
        success: true,
        imageDataUrl,
        textResponse,
        foodList,
      })
    );

  } catch (error) {
    console.error('食物识别处理错误:', error);

    // 处理特定错误类型
    let errorMessage = 'Food recognition processing failed';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // 检查是否是 API 限流错误
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorMessage = 'API request rate limit exceeded, please try again later';
        statusCode = 429;
      }
      // 检查是否是认证错误
      else if (error.message.includes('401') || error.message.includes('API key')) {
        errorMessage = 'API authentication failed, please check configuration';
        statusCode = 401;
      }
    }

    return setCORSHeaders(
      NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: error instanceof Error ? error.message : String(error)
        },
        { status: statusCode }
      )
    );
  }
}
