import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Remove jspdf-autotable exclusion as we are no longer using it
    exclude: ['chartjs-adapter-date-fns', 'jspdf'] // Keep jspdf exclusion if needed, or remove if simple text works
  }
})
