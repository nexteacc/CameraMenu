'use client';

import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

// 12张食物图片
const foodImages = Array.from({ length: 12 }, (_, i) => `/bananafood/${i + 1}.png`);

// 预设的散开位置（百分比），覆盖整个屏幕
const spreadPositions = [
  { x: '5%', y: '10%' },
  { x: '25%', y: '5%' },
  { x: '50%', y: '8%' },
  { x: '75%', y: '12%' },
  { x: '90%', y: '15%' },
  { x: '8%', y: '45%' },
  { x: '85%', y: '50%' },
  { x: '15%', y: '80%' },
  { x: '35%', y: '85%' },
  { x: '55%', y: '75%' },
  { x: '75%', y: '82%' },
  { x: '92%', y: '78%' },
];

// 堆叠时的偏移（营造层次感）
const stackOffsets = [
  { x: 0, y: 0, rotate: -15 },
  { x: 8, y: -5, rotate: -10 },
  { x: 16, y: -10, rotate: -5 },
  { x: 24, y: -15, rotate: 0 },
  { x: 32, y: -20, rotate: 5 },
  { x: 40, y: -25, rotate: 10 },
  { x: 48, y: -30, rotate: 15 },
  { x: 56, y: -35, rotate: 20 },
  { x: 64, y: -40, rotate: 25 },
  { x: 72, y: -45, rotate: 30 },
  { x: 80, y: -50, rotate: 35 },
  { x: 88, y: -55, rotate: 40 },
];

/**
 * 浮动卡片背景组件
 * 实现：堆叠 -> 散开 -> 浮动 -> 收拢 的循环动画
 */
const FloatingCards = () => {
  const controls = useAnimation();

  useEffect(() => {
    const runAnimation = async () => {
      while (true) {
        // 阶段1：堆叠状态（初始）
        await controls.start('stacked');
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 阶段2：散开到屏幕各处
        await controls.start('spread');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 阶段3：轻微浮动（呼吸感）
        await controls.start('floating');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 阶段4：收拢回中心
        await controls.start('gather');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    runAnimation();
  }, [controls]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* 容器居中 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {foodImages.map((src, index) => (
          <motion.div
            key={index}
            className="absolute"
            initial="stacked"
            animate={controls}
            variants={{
              // 堆叠状态：卡片叠在中心，有层次偏移
              stacked: {
                x: stackOffsets[index].x,
                y: stackOffsets[index].y,
                rotate: stackOffsets[index].rotate,
                scale: 0.8,
                opacity: 0.9,
                transition: {
                  duration: 0.8,
                  delay: index * 0.05,
                  ease: 'easeInOut',
                },
              },
              // 散开状态：飞到屏幕各处
              spread: {
                x: `calc(${spreadPositions[index].x} - 50vw)`,
                y: `calc(${spreadPositions[index].y} - 50vh)`,
                rotate: Math.random() * 20 - 10,
                scale: 0.6 + Math.random() * 0.3,
                opacity: 0.7,
                transition: {
                  duration: 1.2,
                  delay: index * 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94],
                },
              },
              // 浮动状态：轻微上下浮动
              floating: {
                y: `calc(${spreadPositions[index].y} - 50vh + ${Math.sin(index) * 15}px)`,
                transition: {
                  duration: 2,
                  repeat: 1,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                },
              },
              // 收拢状态：回到中心
              gather: {
                x: stackOffsets[index].x,
                y: stackOffsets[index].y,
                rotate: stackOffsets[index].rotate,
                scale: 0.8,
                opacity: 0.9,
                transition: {
                  duration: 1,
                  delay: (11 - index) * 0.05,
                  ease: 'easeInOut',
                },
              },
            }}
            style={{
              zIndex: index,
            }}
          >
            <img
              src={src}
              alt=""
              className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-lg"
              draggable={false}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FloatingCards;
