import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 定义公开路由（不需要登录就能访问的路由）
// 这里我们不设置任何公开路由，所有页面都需要登录
const isPublicRoute = createRouteMatcher([
  // 如果需要某些路由公开，可以在这里添加，比如：
  // '/about(.*)',
  // '/pricing(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // 如果不是公开路由，则需要登录
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // 跳过 Next.js 内部文件和静态文件
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // 始终对 API 路由运行
    '/(api|trpc)(.*)',
  ],
};
