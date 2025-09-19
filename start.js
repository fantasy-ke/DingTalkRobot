// 本地启动脚本
import dotenv from 'dotenv';
import { logError, logInfo } from './logger.js';
// 加载环境变量
dotenv.config();

// 检查必需的环境变量
const requiredEnvVars = [
  'DINGTALK_WATER_ACCESS_TOKEN',
  'DINGTALK_WATER_SECRET',
  'DINGTALK_ACCESS_TOKEN',
  'DINGTALK_SECRET', 
  'BAIDU_AK'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logError('❌ 缺少必需的环境变量:');
  missingVars.forEach(varName => {
    logError('异常', `   - ${varName}`);
  });
  logError('异常', '\n请参考 config.example.env 文件配置环境变量');
  logError('异常', '或者设置以下环境变量:');
  requiredEnvVars.forEach(varName => {
    logError('异常',  `   export ${varName}=your_value_here`);
  });
  process.exit(1);
}
logInfo(`✅ 环境变量检查通过`);
logInfo(`🚀 启动通知机器人...`);

// 导入并启动主程序
import('./index.js').catch(error => {
  console.error('启动失败:', error);
  process.exit(1);
});
