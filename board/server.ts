import index from "./index.html";

Bun.serve({
  port: 4000,
  routes: {
    "/*": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("belief.board running at http://localhost:4000");
