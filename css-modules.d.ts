// CSS 文件类型声明 - 解决 TypeScript 对样式文件导入的警告
// 这些文件作为副作用导入，不需要实际的类型信息

declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';

// 第三方 CSS 库类型声明
declare module 'animate.css';
declare module 'katex/dist/katex.min.css';
declare module 'shadcn/tailwind.css';
declare module 'tailwindcss';
declare module 'tw-animate-css';
