import { defineConfig } from "vite";

export default defineConfig({
  base: "/ripple-interference/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        animate: "animate.html",
        mobile: "mobile.html",
      },
    },
  },
});
