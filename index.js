import path from "path";
import fs from "fs";
import { Signale } from "signale";

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import history from "connect-history-api-fallback";
import cors from "cors";

const logger = new Signale({
  scope: "app",
});

const cwd = process.cwd();

// import.meta.dir
// $bunfs
const configPath = process.env.CONFIG ? process.env.CONFIG : path.join(cwd, "./config.json");
logger.log(`配置文件: ${configPath}`);

if (!fs.existsSync(configPath)) {
  logger.error(`配置文件不存在: ${configPath}`);
  logger.log("可以通过设置环境变量 CONFIG 来指定配置文件路径");
  logger.log("例如: CONFIG=./config.json");
  process.exit(1);
}

let config = await import(configPath);

const app = express();
const port = config.port || 10000;

app.use(cors());

// 使用 history 中间件
app.use(history());

let staticDir = config.root || 'dist'

console.log('===> 网站入口目录为: ' + staticDir)
// 静态文件服务
app.use('/', express.static(path.join(cwd, staticDir)));

// 代理配置
app.use(
  "/prod-api",
  createProxyMiddleware({
    target: config.proxy,
    changeOrigin: true,
    pathRewrite: {
      "^/prod-api": "", // 去掉 /prod-api 前缀
    },
  })
);

app.listen(port, () => {
  logger.log(`服务器已启动，监听端口: ${port}`);
});
