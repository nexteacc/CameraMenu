'use client';

/**
 * 背景图标网格组件
 * 使用 CSS Grid 实现 12 个图标的真正平铺展示
 * 网格布局：4列 x 3行 = 12个图标
 * 单元格大小：100px x 100px
 * 网格总尺寸：400px x 300px
 */
export default function BananaBackground() {
  // 12 个图标
  const icons = Array.from({ length: 12 }, (_, i) => `/bananafood/${i + 1}.png`);
  
  // 创建 3x3 = 9 个网格副本，确保覆盖大屏幕 + 动画空间
  // 每个网格 400x300，9个网格覆盖 1200x900
  const gridPositions = [
    // 第一行
    { top: -300, left: -400 },
    { top: -300, left: 0 },
    { top: -300, left: 400 },
    { top: -300, left: 800 },
    { top: -300, left: 1200 },
    // 第二行
    { top: 0, left: -400 },
    { top: 0, left: 0 },
    { top: 0, left: 400 },
    { top: 0, left: 800 },
    { top: 0, left: 1200 },
    // 第三行
    { top: 300, left: -400 },
    { top: 300, left: 0 },
    { top: 300, left: 400 },
    { top: 300, left: 800 },
    { top: 300, left: 1200 },
    // 第四行
    { top: 600, left: -400 },
    { top: 600, left: 0 },
    { top: 600, left: 400 },
    { top: 600, left: 800 },
    { top: 600, left: 1200 },
    // 第五行
    { top: 900, left: -400 },
    { top: 900, left: 0 },
    { top: 900, left: 400 },
    { top: 900, left: 800 },
    { top: 900, left: 1200 },
  ];
  
  return (
    <div className="banana-bg-container">
      {gridPositions.map((pos, gridIndex) => (
        <div
          key={gridIndex}
          className="banana-grid"
          style={{ top: pos.top, left: pos.left }}
        >
          {icons.map((icon, i) => (
            <div
              key={i}
              className="banana-icon"
              style={{ backgroundImage: `url(${icon})` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
