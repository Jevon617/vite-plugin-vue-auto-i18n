import { createApp } from 'vue'
import App from './App.vue'
import test from '@intlify/vite-plugin-vue-i18n/messages'
const app = createApp(App)

app.mount('#app')

console.log(test)
