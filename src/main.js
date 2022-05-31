import { createApp } from 'vue'
import App from './App.vue'
import VueGoogleMaps from "@fawmi/vue-google-maps"
import router from './router'
import store from './store'

createApp(App).use(store).use(router).use(VueGoogleMaps, {
    load: {
      key: ""
    }
  }).mount('#app')
