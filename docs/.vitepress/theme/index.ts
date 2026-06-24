import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import Home from "./views/home/Home.vue";
import Gallery from "./views/gallery/Gallery.vue";
import Tools from "./views/tools/Tools.vue";
import PostsOverview from "./views/posts/PostsOverview.vue";
import CalorieCalculator from "./components/tools/CalorieCalculator.vue";
import WeatherPage from "./views/weather/Weather.vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./custom.css";

export default {
  ...DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // 初始化 Pinia
    const pinia = createPinia();
    pinia.use(piniaPluginPersistedstate);
    app.use(pinia);
    app.use(ElementPlus);
    // 注册全局组件
    app.component("Home", Home);
    app.component("Gallery", Gallery);
    app.component("Tools", Tools);
    app.component("PostsOverview", PostsOverview);
    app.component("CalorieCalculator", CalorieCalculator);
    app.component("WeatherPage", WeatherPage);
  },
};
