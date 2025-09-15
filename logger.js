import fs from 'fs';
import path from 'path';

// 获取当前日期的日志文件路径
function getLogFile() {
  const today = new Date().toISOString().split('T')[0]; // 格式：YYYY-MM-DD
  const logDir = path.resolve('./logs');
  
  // 确保logs目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  return path.join(logDir, `app-${today}.log`);
}

export function logError(error, context = '') {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.stack : String(error);
  const logEntry = `[${timestamp}] ${context}\n${errorMessage}\n\n`;
  
  fs.appendFileSync(getLogFile(), logEntry);
}

export function logInfo(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] INFO: ${message}\n`;
  
  fs.appendFileSync(getLogFile(), logEntry);
}