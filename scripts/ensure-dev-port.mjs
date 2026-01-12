#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const PORT = 3000;

// 检测端口是否被占用
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows
      ? `netstat -ano | findstr :${port}`
      : `lsof -ti tcp:${port}`;
    
    exec(command, (error, stdout) => {
      if (error) {
        // 命令执行失败通常意味着端口未被占用
        resolve(false);
        return;
      }
      // 有输出说明端口被占用
      resolve(stdout.trim().length > 0);
    });
  });
}

// 获取占用端口的进程 PID（Windows）
async function getPidOnWindows(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n').filter(line => line.trim().length > 0);
    
    for (const line of lines) {
      // netstat 输出格式示例:
      // TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12345
      // 或者: TCP    [::]:3000              [::]:0                 LISTENING       12345
      const parts = line.trim().split(/\s+/);
      
      // 查找 LISTENING 状态的行（表示正在监听）
      if (line.includes('LISTENING') && parts.length > 0) {
        // PID 在最后一列
        const pidStr = parts[parts.length - 1];
        const pid = parseInt(pidStr, 10);
        if (!isNaN(pid) && pid > 0) {
          return pid;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// 获取占用端口的进程 PID（macOS/Linux）
async function getPidOnUnix(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti tcp:${port}`);
    const pid = parseInt(stdout.trim(), 10);
    return !isNaN(pid) && pid > 0 ? pid : null;
  } catch (error) {
    return null;
  }
}

// 杀掉进程
async function killProcess(pid) {
  const isWindows = process.platform === 'win32';
  const command = isWindows
    ? `taskkill /F /PID ${pid}`
    : `kill -9 ${pid}`;
  
  try {
    await execAsync(command);
    console.log(`✅ 已终止占用端口 ${PORT} 的进程 (PID: ${pid})`);
    return true;
  } catch (error) {
    console.warn(`⚠️  无法终止进程 ${pid}:`, error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log(`🔍 检查端口 ${PORT} 是否被占用...`);
  
  const portInUse = await isPortInUse(PORT);
  
  if (portInUse) {
    console.log(`⚠️  端口 ${PORT} 已被占用，正在查找并终止占用进程...`);
    
    const isWindows = process.platform === 'win32';
    const pid = isWindows
      ? await getPidOnWindows(PORT)
      : await getPidOnUnix(PORT);
    
    if (pid) {
      await killProcess(pid);
      // 等待一下确保进程已终止
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      console.warn(`⚠️  无法找到占用端口 ${PORT} 的进程 PID`);
    }
  } else {
    console.log(`✅ 端口 ${PORT} 可用`);
  }
  
  // 启动 Next.js 开发服务器
  console.log(`\n🚀 启动 Next.js 开发服务器 (端口 ${PORT})...\n`);
  console.log(`📍 访问地址: http://localhost:${PORT}\n`);
  
  const nextDev = spawn('npx', ['next', 'dev', '-p', PORT.toString()], {
    stdio: 'inherit',
    shell: true,
  });
  
  // 处理退出
  process.on('SIGINT', () => {
    console.log('\n\n🛑 正在停止开发服务器...');
    nextDev.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    nextDev.kill('SIGTERM');
    process.exit(0);
  });
  
  nextDev.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main().catch((error) => {
  console.error('❌ 启动失败:', error);
  process.exit(1);
});

