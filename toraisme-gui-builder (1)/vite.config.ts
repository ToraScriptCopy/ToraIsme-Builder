import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Загружаем переменные из .env файла, если он есть
    const env = loadEnv(mode, process.cwd(), '');
    
    // Твой ключ (лучше держать в .env, но для теста прописываем здесь как запасной вариант)
    const GEMINI_KEY = env.GEMINI_API_KEY || 'AIzaSyDXckpDCNKDn6kvL_vmXg1IUn_JJwv63L4';

    return {
      // Базовый путь для GitHub Pages
      base: '/ToraIsme-Builder/', 
      
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      
      plugins: [react()],
      
      define: {
        // Пробрасываем ключ в клиентскую часть приложения
        'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_KEY),
        'process.env.API_KEY': JSON.stringify(GEMINI_KEY)
      },
      
      resolve: {
        alias: {
          // Настройка алиаса для удобных импортов
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
