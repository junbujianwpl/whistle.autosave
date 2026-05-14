# whistle.autosave2

在 [whistle.autosave](https://github.com/whistle-plugins/whistle.autosave) 基础上改造：

- 支持保存回环地址请求（`127.0.0.1` / `localhost` / `::1`）
- 按 `日期/时分秒_host_method_status_path.json` 命名并保存到本地目录

### 本地安装

1. 安装 [whistle](https://github.com/avwo/whistle)
2. 在本项目根目录执行（**必须先安装依赖**，否则全局安装后缺少 `koa` 等模块会报错）：

```bash
# 安装生产依赖
npm install --production

# 全局安装本地包
npm install -g .

# 重启 whistle
w2 restart
```

或一条命令：

```bash
npm run install:global && w2 restart
```

或使用 `npm link` 开发调试：

```bash
cd /path/to/whistle.autosave
npm link
w2 restart
```

3. 打开 whistle 管理界面，在插件列表中找到 **autosave2**，进入配置页：
   - 填写本地存储目录（需事先手动创建）
   - 可选填写 URL 过滤条件
   - 勾选「自动保存抓包数据」

### 保存文件示例

```
D:/captures/2026-05-14/1337_12_145_127.0.0.1_8080_GET_200_api_v1_users_page=1.json
```

### 说明

- 浏览器代理需允许回环地址走代理（如 SwitchyOmega 中将 bypass 里的 `127.0.0.1` / `localhost` 改为 `<-loopback>` 或移除）
- 过滤条件为空时保存所有匹配的请求；非空时按插件配置页说明匹配 URL
