import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 정적 배포(예: GitHub Pages)에서 하위 경로에 올릴 경우 base 를 './' 로 두면 안전합니다.
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    port: 5174,
    open: true,
  },
})
