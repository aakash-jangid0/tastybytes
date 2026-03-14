/**
 * Server status checker
 * Run with: node check-status.js
 */
import http from 'http';
import { exec } from 'child_process';
import os from 'os';

// Configuration
const API_HOST = 'localhost';
const API_PORT = process.env.PORT || 5000;
const API_PATH = '/api/health';

console.log('🔍 Checking backend API status...');
console.log(`🌐 Target: http://${API_HOST}:${API_PORT}${API_PATH}`);

// Check if port is in use
function checkPort() {
  return new Promise((resolve) => {
    const options = {
      host: API_HOST,
      port: API_PORT,
      path: API_PATH,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Port ${API_PORT} is open. Status code: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('✅ API health check response:', parsed);
          resolve(true);
        } catch (e) {
          console.log('❌ Invalid response from API:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ Port ${API_PORT} check failed: ${e.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ Port ${API_PORT} check timed out`);
      resolve(false);
    });

    req.end();
  });
}

// Check for processes using the port
function checkProcesses() {
  const cmd = os.platform() === 'win32' 
    ? `netstat -ano | findstr :${API_PORT}`
    : `lsof -i :${API_PORT} | grep LISTEN`;

  console.log(`\n🔍 Checking for processes using port ${API_PORT}...`);
  
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`✅ No processes found using port ${API_PORT}`);
      return;
    }

    console.log('💡 Process(es) found using the port:');
    console.log(stdout);
    
    // On Windows, extract PIDs and get more info
    if (os.platform() === 'win32') {
      const pids = stdout.split('\n')
        .map(line => line.trim().split(/\s+/).pop())
        .filter((pid, index, self) => pid && self.indexOf(pid) === index);

      if (pids.length > 0) {
        console.log('📋 Process details:');
        pids.forEach(pid => {
          exec(`tasklist /fi "PID eq ${pid}"`, (err, taskOut) => {
            if (!err) console.log(taskOut);
          });
        });
      }
    }
  });
}

// Check database connection (simplified)
function checkDatabase() {
  console.log('\n🔍 Checking database connection...');
  console.log('💡 To verify database connectivity, run the server with the start.js script');
}

// Check system resources
function checkResources() {
  console.log('\n🔍 System resource check:');
  
  // Check memory
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsage = Math.round((usedMem / totalMem) * 100);
  
  console.log(`💻 Memory: ${memUsage}% used (${(freeMem / 1024 / 1024 / 1024).toFixed(2)}GB free of ${(totalMem / 1024 / 1024 / 1024).toFixed(2)}GB)`);
  
  // Check CPU load
  console.log(`⏱️ CPU: ${os.loadavg()[0].toFixed(2)} (1m), ${os.loadavg()[1].toFixed(2)} (5m), ${os.loadavg()[2].toFixed(2)} (15m) average load`);
  
  // Check uptime
  console.log(`⏰ System uptime: ${(os.uptime() / 3600).toFixed(2)} hours`);
}

// Print helper commands
function printHelperCommands() {
  console.log('\n📋 Helpful commands:');
  
  if (os.platform() === 'win32') {
    console.log('  - Start server: cd server && node start.js');
    console.log('  - Kill process using port: FOR /F "tokens=5" %a in (\'netstat -ano ^| findstr :5000\') do taskkill /F /PID %a');
  } else {
    console.log('  - Start server: cd server && node start.js');
    console.log('  - Kill process using port: kill $(lsof -t -i:5000)');
  }
}

// Run checks
async function runChecks() {
  const isPortOpen = await checkPort();
  if (!isPortOpen) {
    checkProcesses();
    checkDatabase();
    checkResources();
    printHelperCommands();
  }
  
  console.log('\n✨ Status check complete');
}

runChecks();
