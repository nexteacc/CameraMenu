import React from 'react';

interface FoodListDrawerProps {
  foodList: string[];
  open: boolean;
  onSelect?: (name: string) => void;
}

/**
 * 右侧抽屉式食物列表（仅名称，滚动显示）
 */
const FoodListDrawer: React.FC<FoodListDrawerProps> = ({ foodList, open, onSelect }) => {
  if (!foodList || foodList.length === 0) {
    return null;
  }

  return (
    <div
      className={`absolute top-24 right-4 z-20 transition-all duration-300 ${
        open ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 pointer-events-none'
      }`}
      aria-label="Food list drawer"
    >
      <div className="w-[75vw] max-w-[320px] bg-amber-50/90 backdrop-blur-md border border-amber-200/60 rounded-2xl shadow-xl shadow-amber-200/30 overflow-hidden">
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-amber-100">
          {foodList.map((item) => (
            <button
              key={item}
              onClick={() => onSelect?.(item)}
              className="w-full text-left px-4 py-3 text-zinc-800 hover:bg-amber-100 active:bg-amber-200 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FoodListDrawer;

