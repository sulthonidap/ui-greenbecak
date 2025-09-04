import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get API URL from environment or use default
  const apiUrl = process.env.VITE_API_URL || 'https://api.becakjogja.id';
  const apiPort = process.env.VITE_API_PORT || '443';
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: true, // Enable SSL verification for HTTPS
          // Fallback untuk development tanpa backend
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error:', err);
              console.log('Request URL:', req.url);
              console.log(`Backend not available at ${apiUrl} - running in mock mode`);
              // Return mock response untuk development
              if (res && !res.headersSent) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                  message: `Backend not available at ${apiUrl} - running in mock mode`,
                  data: [],
                  status: 'success'
                }));
              }
            });
          }
        },
      },
    },
  };
});
