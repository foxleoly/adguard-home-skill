#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load instance configuration
// Support both default (~/.openclaw/workspace/) and custom (~/.openclaw-*/workspace/) paths
function findConfigPath() {
  // Priority 1: Environment variable OPENCLAW_WORKSPACE
  if (process.env.OPENCLAW_WORKSPACE) {
    const envPath = path.join(process.env.OPENCLAW_WORKSPACE, 'adguard-instances.json');
    if (fs.existsSync(envPath)) {
      return envPath;
    }
  }
  
  // Priority 2: Default OpenClaw workspace (~/.openclaw/workspace/)
  const defaultPath = path.join(process.env.HOME, '.openclaw', 'workspace', 'adguard-instances.json');
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }
  
  // Priority 3: Custom OpenClaw workspace (~/.openclaw-*/workspace/)
  const homeDir = process.env.HOME;
  try {
    const dirs = fs.readdirSync(homeDir);
    for (const dir of dirs) {
      if (dir.startsWith('.openclaw-') && dir !== '.openclaw') {
        const customPath = path.join(homeDir, dir, 'workspace', 'adguard-instances.json');
        if (fs.existsSync(customPath)) {
          return customPath;
        }
      }
    }
  } catch (e) {
    // Ignore readdir errors
  }
  
  // Not found
  return null;
}

const configPath = findConfigPath();
let instances = {};

if (configPath && fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    instances = config.instances || {};
  } catch (e) {
    console.error('Error loading AdGuard instances config:', e.message);
    process.exit(1);
  }
}

// Get command and instance from arguments
const args = process.argv.slice(2);
const command = args[0] || 'stats';
let instanceName = args[1];

// If no instance specified and only one exists, use it
if (!instanceName && Object.keys(instances).length === 1) {
  instanceName = Object.keys(instances)[0];
}

// Validate instance
if (!instanceName || !instances[instanceName]) {
  if (Object.keys(instances).length === 0) {
    console.error('No AdGuard instances configured.');
    console.error('Please create adguard-instances.json in one of these locations:');
    console.error('  1. $OPENCLAW_WORKSPACE/adguard-instances.json (if OPENCLAW_WORKSPACE is set)');
    console.error('  2. ~/.openclaw/workspace/adguard-instances.json (default)');
    console.error('  3. ~/.openclaw-*/workspace/adguard-instances.json (custom workspace)');
    console.error('\nExample configuration:');
    console.error('{');
    console.error('  "instances": {');
    console.error('    "dns1": {');
    console.error('      "url": "http://192.168.1.1:80",');
    console.error('      "username": "admin",');
    console.error('      "password": "your-password"');
    console.error('    }');
    console.error('  }');
    console.error('}');
  } else {
    console.error('Available instances:', Object.keys(instances).join(', '));
  }
  process.exit(1);
}

const instance = instances[instanceName];
const { url, username, password } = instance;

// Create temp cookie file
const cookieFile = `/tmp/adguard_${instanceName}_cookie.txt`;

// Helper function to make authenticated API calls
function apiCall(endpoint) {
  execSync(`curl -s -X POST ${url}/control/login -H "Content-Type: application/json" -d '{"name":"${username}","password":"${password}"}' -c ${cookieFile}`, { stdio: 'ignore' });
  return execSync(`curl -s -b ${cookieFile} ${url}${endpoint}`, { encoding: 'utf8' });
}

try {
  let data;
  switch (command) {
    case 'stats':
      data = apiCall('/control/stats');
      const stats = JSON.parse(data);
      console.log(`📊 AdGuard Home Statistics (${instanceName})`);
      console.log(`Total DNS Queries: ${stats.num_dns_queries.toLocaleString()}`);
      console.log(`Blocked Requests: ${stats.num_blocked_filtering.toLocaleString()} (${((stats.num_blocked_filtering / stats.num_dns_queries) * 100).toFixed(1)}%)`);
      console.log(`Avg Response Time: ${stats.avg_processing_time.toFixed(3)}ms`);
      break;
      
    case 'top-clients':
      data = apiCall('/control/stats');
      const clientsData = JSON.parse(data);
      const clients = {};
      for (const item of clientsData.top_clients) {
        const [ip, count] = Object.entries(item)[0];
        clients[ip] = count;
      }
      console.log(`💻 Top Clients (${instanceName})`);
      Object.entries(clients).slice(0, 10).forEach(([ip, count], i) => {
        console.log(`${i + 1}. ${ip}: ${count.toLocaleString()} queries`);
      });
      break;
      
    case 'top-blocked':
      data = apiCall('/control/stats');
      const blockedData = JSON.parse(data);
      const blocked = {};
      for (const item of blockedData.top_blocked_domains) {
        const [domain, count] = Object.entries(item)[0];
        blocked[domain] = count;
      }
      console.log(`🚫 Top Blocked Domains (${instanceName})`);
      Object.entries(blocked).slice(0, 10).forEach(([domain, count], i) => {
        console.log(`${i + 1}. ${domain}: ${count.toLocaleString()} blocks`);
      });
      break;
      
    case 'health':
      const healthCode = execSync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, { encoding: 'utf8' });
      console.log(`✅ Health Check (${instanceName}): HTTP ${healthCode}`);
      break;
      
    case 'status':
      data = apiCall('/control/status');
      const status = JSON.parse(data);
      console.log(`🔧 AdGuard Home Status (${instanceName})`);
      console.log(`Version: ${status.version}`);
      console.log(`Running: ${status.running ? '✅ Yes' : '❌ No'}`);
      console.log(`Protection: ${status.protection_enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`DNS Port: ${status.dns_port}`);
      console.log(`HTTP Port: ${status.http_port}`);
      console.log(`Language: ${status.language}`);
      console.log(`DHCP Available: ${status.dhcp_available ? '✅ Yes' : '❌ No'}`);
      break;
      
    case 'dns-info':
      data = apiCall('/control/dns_info');
      const dnsInfo = JSON.parse(data);
      console.log(`🌐 DNS Configuration (${instanceName})`);
      console.log(`Protection: ${dnsInfo.protection_enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`Rate Limit: ${dnsInfo.ratelimit} req/s`);
      console.log(`Upstream Mode: ${dnsInfo.upstream_mode}`);
      console.log(`Cache: ${dnsInfo.cache_enabled ? `✅ ${ (dnsInfo.cache_size / 1024 / 1024).toFixed(0) }MB` : '❌ Disabled'}`);
      console.log(`DNSSEC: ${dnsInfo.dnssec_enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`IPv6: ${dnsInfo.disable_ipv6 ? '❌ Disabled' : '✅ Enabled'}`);
      console.log(`\nUpstream DNS Servers:`);
      dnsInfo.upstream_dns.forEach((dns, i) => {
        console.log(`  ${i + 1}. ${dns}`);
      });
      break;
      
    case 'filter-rules':
      data = apiCall('/control/filtering/status');
      const filterStatus = JSON.parse(data);
      console.log(`🛡️ Filter Rules (${instanceName})`);
      console.log(`Filtering: ${filterStatus.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`Update Interval: ${filterStatus.interval} hours`);
      console.log(`User Rules: ${filterStatus.user_rules ? filterStatus.user_rules.length : 0} custom rules`);
      console.log(`\nFilter Lists:`);
      if (filterStatus.filters && filterStatus.filters.length > 0) {
        filterStatus.filters.forEach((filter, i) => {
          const status = filter.enabled ? '✅' : '❌';
          console.log(`  ${i + 1}. ${status} ${filter.name} (${filter.rules_count} rules)`);
        });
      } else {
        console.log('  No filter lists configured');
      }
      break;
      
    case 'querylog':
      const limit = args[2] || '10';
      data = apiCall(`/control/querylog?limit=${limit}&response_status="all"`);
      const queryLog = JSON.parse(data);
      console.log(`📜 Recent DNS Queries (${instanceName}) - Last ${limit} entries\n`);
      if (queryLog.data && queryLog.data.length > 0) {
        queryLog.data.forEach((entry, i) => {
          const status = entry.reason.includes('Filtered') ? '🚫 BLOCKED' : '✅ OK';
          const domain = entry.question.name;
          const client = entry.client;
          const time = new Date(entry.time).toLocaleTimeString();
          console.log(`${i + 1}. [${time}] ${status} ${domain} (${client})`);
          if (entry.rule) {
            console.log(`   Rule: ${entry.rule}`);
          }
        });
      } else {
        console.log('No query log entries found');
      }
      break;
      
    case 'clients':
      data = apiCall('/control/clients');
      const clientsList = JSON.parse(data);
      console.log(`👥 Clients (${instanceName})`);
      if (clientsList.clients && clientsList.clients.length > 0) {
        clientsList.clients.forEach((client, i) => {
          console.log(`${i + 1}. ${client.name || client.ids[0] || 'Unknown'}`);
          if (client.use_global_settings === false) {
            console.log(`   Custom settings enabled`);
          }
          if (client.blocking_mode) {
            console.log(`   Blocking mode: ${client.blocking_mode}`);
          }
        });
      } else {
        console.log('No manually configured clients');
      }
      console.log(`\nAuto-discovered clients: ${clientsList.auto_clients ? clientsList.auto_clients.length : 0}`);
      break;
      
    case 'tls-status':
      data = apiCall('/control/tls/status');
      const tlsStatus = JSON.parse(data);
      console.log(`🔒 TLS/Encryption Status (${instanceName})`);
      console.log(`TLS Enabled: ${tlsStatus.enabled ? '✅ Yes' : '❌ No'}`);
      console.log(`Force HTTPS: ${tlsStatus.force_https ? '✅ Yes' : '❌ No'}`);
      console.log(`Valid Certificate: ${tlsStatus.valid_cert ? '✅ Yes' : '❌ No'}`);
      console.log(`HTTPS Port: ${tlsStatus.port_https}`);
      console.log(`DoT Port: ${tlsStatus.port_dns_over_tls}`);
      console.log(`DoQ Port: ${tlsStatus.port_dns_over_quic}`);
      console.log(`Allow Unencrypted DoH: ${tlsStatus.allow_unencrypted_doh ? '✅ Yes' : '❌ No'}`);
      break;
      
    default:
      console.error('Unknown command. Available commands:');
      console.error('  stats          - DNS query and blocking statistics');
      console.error('  top-clients    - Most active clients');
      console.error('  top-blocked    - Most frequently blocked domains');
      console.error('  health         - Instance health check');
      console.error('  status         - Service status (version, protection, ports)');
      console.error('  dns-info       - DNS configuration details');
      console.error('  filter-rules   - Filter rules and lists');
      console.error('  querylog [n]   - Recent DNS queries (default: 10)');
      console.error('  clients        - Configured clients');
      console.error('  tls-status     - TLS/encryption status');
      process.exit(1);
  }
} catch (e) {
  console.error('Error querying AdGuard instance:', e.message);
  process.exit(1);
} finally {
  // Clean up cookie file
  if (fs.existsSync(cookieFile)) {
    fs.unlinkSync(cookieFile);
  }
}
