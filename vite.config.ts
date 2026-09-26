import { defineConfig } from 'vite'

// base 用相对路径：本地预览与 GitHub Pages 子路径（/app-encodings/）都能跑，也免去硬编码仓库名
export default defineConfig({
  base: './'
})
