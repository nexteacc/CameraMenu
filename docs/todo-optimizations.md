# BananaFood 待优化项

> 记录日期：2024-12-04

---

## 1. 移动端卡片固定布局

### 问题描述

当前页面在移动端可能出现上下滚动，但作为一个类 App 应用，卡片应该固定在视口中，不应有页面滚动。

### 期望效果

- 整个页面视口固定，禁止滚动
- Glass Card 卡片固定在屏幕中央
- 背景图标动画正常滚动，但页面内容不可滚动
- 类似原生 App 的体验

### 涉及页面

- 首页（idle）
- 选择来源页（select-source）
- 处理中页（processing）

### 可能的实现方案

```css
/* 方案 1：禁止 body 滚动 */
body {
  overflow: hidden;
  position: fixed;
  width: 100%;
  height: 100%;
}

/* 方案 2：使用 100vh 固定高度 */
.banana-page {
  height: 100vh;
  overflow: hidden;
}

/* 方案 3：使用 dvh 单位（推荐） */
.banana-page {
  height: 100dvh;
  overflow: hidden;
}
```

### 注意事项

- 需要处理移动端 100vh 的兼容性问题（iOS Safari 地址栏）
- 可考虑使用 `100dvh`（dynamic viewport height）
- 确保软键盘弹出时布局不被破坏

### 优先级

⭐⭐⭐ 高

---

## 2. 背景图标点击显示食物名称

### 功能描述

用户在移动端点击（或长按）背景中的食物图标时，在图标右上角弹出一个小标签，显示该食物的名称。

### 交互设计

| 项目 | 说明 |
|------|------|
| 触发方式 | 单击或长按图标 |
| 显示位置 | 图标右上角 |
| 显示内容 | 食物名称（如 "Pizza"、"Sushi" 等） |
| 消失方式 | 点击其他区域或自动延时消失（2-3秒） |

### 视觉效果

```
    ┌──────────┐
    │  Sushi   │ ← 小标签（右上角）
    └──────────┘
  ┌─────────────┐
  │             │
  │   🍣 图标   │
  │             │
  └─────────────┘
```

### 实现要点

1. 为每个图标配置对应的食物名称
2. 当前 `pointer-events: none` 需要调整为允许点击
3. 标签样式：小圆角、半透明背景、白色文字
4. 动画：淡入淡出效果

### 数据结构示例

```typescript
const foodIcons = [
  { id: 1, src: '/bananafood/1.png', name: 'Pizza' },
  { id: 2, src: '/bananafood/2.png', name: 'Sushi' },
  { id: 3, src: '/bananafood/3.png', name: 'Burger' },
  { id: 4, src: '/bananafood/4.png', name: 'Ramen' },
  { id: 5, src: '/bananafood/5.png', name: 'Taco' },
  { id: 6, src: '/bananafood/6.png', name: 'Ice Cream' },
  { id: 7, src: '/bananafood/7.png', name: 'Donut' },
  { id: 8, src: '/bananafood/8.png', name: 'Coffee' },
  { id: 9, src: '/bananafood/9.png', name: 'Cake' },
  { id: 10, src: '/bananafood/10.png', name: 'Salad' },
  { id: 11, src: '/bananafood/11.png', name: 'Steak' },
  { id: 12, src: '/bananafood/12.png', name: 'Pasta' },
];
```

### 注意事项

- 点击背景图标不应影响前景卡片的交互
- 标签不应遮挡重要 UI 元素
- 考虑多语言支持（食物名称可根据用户选择的语言显示）

### 优先级

⭐⭐ 中

---

## 相关文件

- `app/globals.css` - 样式文件
- `components/BananaBackground.tsx` - 背景组件
- `app/page.tsx` - 主页面
