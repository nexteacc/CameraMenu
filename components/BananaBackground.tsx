'use client';

/**
 * 背景图标网格组件
 * 使用 CSS Grid 实现 12 个图标的真正平铺展示
 * 网格布局：3列 x 4行 = 12个图标
 * 单元格大小：120px x 120px，间距 20px
 * 网格总尺寸：3×120 + 2×20 = 400px (宽) x 4×120 + 3×20 = 540px (高)
 * 滚动方向：左上 → 右下
 */
export default function BananaBackground() {
  // 12 个图标
  const icons = Array.from({ length: 12 }, (_, i) => `/bananafood/${i + 1}.png`);

  // 网格尺寸（含间距）
  const gridWidth = 400;
  const gridHeight = 540;

  // 创建网格位置，覆盖视口 + 动画需要的额外空间
  const gridPositions: { top: number; left: number }[] = [];

  // 向左上方多扩展，向右下方也扩展，确保动画时无空白
  for (let row = -2; row <= 4; row++) {
    for (let col = -2; col <= 5; col++) {
      gridPositions.push({
        top: row * gridHeight,
        left: col * gridWidth,
      });
    }
  }

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
