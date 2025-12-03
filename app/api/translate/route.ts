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
 * 翻译 API - 使用 Gemini 进行菜单图片翻译
 * 
 * 请求格式：multipart/form-data
 * - image: File (必需) - 菜单图片
 * - toLang: string (必需) - 目标语言
 * 
 * 响应格式：
 * - success: boolean
 * - imageDataUrl: string (Base64 图片 Data URL)
 * - error?: string (错误信息)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== 翻译 API 请求开始 ===');

    // 验证授权
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return setCORSHeaders(
        NextResponse.json(
          { success: false, error: '缺少或无效的授权头' },
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
          { success: false, error: '缺少必需参数: image, toLang' },
          { status: 400 }
        )
      );
    }

    // 验证图片类型
    if (!image.type.startsWith('image/')) {
      return setCORSHeaders(
        NextResponse.json(
          { success: false, error: '无效的图片类型' },
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
          { success: false, error: '服务器配置错误：缺少 API 密钥' },
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

    // 构建翻译提示词
    const prompt = `你是一个专业的菜单翻译助手。

## 任务
为这张菜单添加 ${toLang} 翻译注释。

## 翻译风格
- 保留原文，翻译放在原文段落的下方或旁边，根据布局判断
- 手绘彩笔风格，清晰但不过度遮挡原图
- 颜色根据背景自动选择对比色
- 翻译文字略小于原文，清晰可读

## 翻译要求
- 翻译简洁地道
- 只翻译菜单内容（菜名、配菜、套餐等）
- 价格数字保持不变
- 专有名词转换为目标语言中合适的表达

请生成翻译后的图片。`;

    console.log('正在调用 Gemini API...');

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
          { success: false, error: '未获取到翻译结果' },
          { status: 500 }
        )
      );
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      return setCORSHeaders(
        NextResponse.json(
          { success: false, error: '响应内容格式错误' },
          { status: 500 }
        )
      );
    }

    // 查找图片数据
    let imageDataUrl: string | null = null;
    let textResponse: string | null = null;

    for (const part of content.parts) {
      if (part.inlineData) {
        // 找到图片数据
        const mimeType = part.inlineData.mimeType || 'image/png';
        const data = part.inlineData.data;
        imageDataUrl = `data:${mimeType};base64,${data}`;
        console.log('找到生成的图片');
      } else if (part.text) {
        textResponse = part.text;
        console.log('文字响应:', textResponse?.substring(0, 100));
      }
    }

    // 如果没有图片但有文字响应，说明模型可能无法生成图片
    if (!imageDataUrl) {
      console.log('未找到生成的图片，文字响应:', textResponse);
      return setCORSHeaders(
        NextResponse.json(
          { 
            success: false, 
            error: '无法生成翻译图片。模型响应: ' + (textResponse || '无文字响应'),
            textResponse 
          },
          { status: 500 }
        )
      );
    }

    console.log('翻译完成，返回结果');

    return setCORSHeaders(
      NextResponse.json({
        success: true,
        imageDataUrl,
        textResponse,
      })
    );

  } catch (error) {
    console.error('翻译处理错误:', error);

    // 处理特定错误类型
    let errorMessage = '翻译处理失败';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // 检查是否是 API 限流错误
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        errorMessage = 'API 请求过于频繁，请稍后再试';
        statusCode = 429;
      }
      // 检查是否是认证错误
      else if (error.message.includes('401') || error.message.includes('API key')) {
        errorMessage = 'API 认证失败，请检查配置';
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

