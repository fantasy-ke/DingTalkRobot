# NotificationBot

一个通过钉钉发送提醒的通知机器人。

## 功能特性

-  喝水提醒（带天气信息）
-  午餐时间提醒
-  上班时间提醒（幽默风趣）
-  工作日检测
-  天气信息集成

## 环境变量配置

复制 `config.example.env` 文件并重命名为 `.env`，然后配置以下环境变量：

```bash
# 钉钉机器人配置
DINGTALK_ACCESS_TOKEN=your_dingtalk_access_token_here
DINGTALK_SECRET=your_dingtalk_secret_here

# 可选：喝水提醒专用机器人（若配置则喝水提醒走该机器人）
DINGTALK_WATER_ACCESS_TOKEN=your_dingtalk_water_access_token_here
DINGTALK_WATER_SECRET=your_dingtalk_water_secret_here

# 百度天气API配置
BAIDU_AK=your_baidu_ak_here
BAIDU_DISTRICT_ID=440304
```

## 本地运行

```bash
# 安装依赖
yarn install

# 配置环境变量后运行
node scripts/start.js
```

## 提醒时间表

- **9:00** - 上班时间提示
- **9:30-11:30** - 喝水提醒（每30分钟）
- **10:45** - 午餐预警
- **11:55** - 外卖取餐提醒
- **14:00-18:30** - 喝水提醒（每30分钟）
- **18:45** - 下班倒计时

## 目录结构

```
NotificationBot/
├── data/                 # 数据文件
├── logs/                 # 日志文件
├── scripts/              # 脚本文件
├── index.js             # 主程序
├── holidays.js          # 节假日处理
└── logger.js            # 日志模块
```

## PowerShell 脚本（本地开发）

#### 启动 Bot
```powershell
.\scripts\index-bot.ps1 start
```
#### 关闭 Bot
```powershell
.\scripts\index-bot.ps1 stop
```
#### 重启 Bot
```powershell
.\scripts\index-bot.ps1 restart
```