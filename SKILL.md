# AdGuard Home Skill

🛡️ Query AdGuard Home instances for DNS statistics, blocked domains, and client activity  
🛡️ 查询 AdGuard Home 实例的 DNS 统计、拦截域名和客户端活动

---

## Features | 功能特性

- ✅ Multi-instance support | 支持多实例配置
- ✅ Real-time DNS query statistics | 实时 DNS 查询统计
- ✅ Blocked domains leaderboard | 拦截域名排行
- ✅ Active client analysis | 活跃客户端分析
- ✅ Health status check | 健康状态检查
- ✅ Service status monitoring | 服务状态监控
- ✅ DNS configuration details | DNS 配置详情
- ✅ Filter rules inspection | 过滤规则检查
- ✅ Recent query log | 最近查询日志
- ✅ TLS/encryption status | TLS/加密状态

---

## Usage | 使用方法

### Basic Commands | 基础命令

```bash
# Statistics & Monitoring | 统计与监控
/adguard stats [instance]           # DNS statistics | DNS 统计
/adguard top-clients [instance]     # Top 10 active clients | 活跃客户端 Top 10
/adguard top-blocked [instance]     # Top 10 blocked domains | 被拦截域名 Top 10
/adguard health [instance]          # Health check | 健康检查
/adguard status [instance]          # Service status | 服务状态

# Configuration & Rules | 配置与规则
/adguard dns-info [instance]        # DNS configuration | DNS 配置详情
/adguard filter-rules [instance]    # Filter rules and lists | 过滤规则和列表
/adguard clients [instance]         # Configured clients | 已配置的客户端
/adguard tls-status [instance]      # TLS/encryption status | TLS/加密状态

# Query Log | 查询日志
/adguard querylog [instance] [n]    # Recent n queries (default: 10) | 最近 n 条查询
```

### Examples | 命令示例

```bash
# Query dns1 instance statistics | 查询 dns1 实例的统计
/adguard stats dns1

# Check service status | 检查服务状态
/adguard status dns1

# View DNS configuration | 查看 DNS 配置
/adguard dns-info dns1

# View filter rules | 查看过滤规则
/adguard filter-rules dns1

# View last 20 DNS queries | 查看最近 20 条 DNS 查询
/adguard querylog dns1 20

# Check TLS status | 检查 TLS 状态
/adguard tls-status dns1

# If no instance specified, uses the first configured instance | 不指定实例则使用第一个
/adguard stats
```

### Output Examples | 输出示例

**stats command | stats 命令：**
```
📊 AdGuard Home Statistics (dns1)
Total DNS Queries: 141,647
Blocked Requests: 32,540 (23.0%)
Avg Response Time: 0.005ms
```

**status command | status 命令：**
```
🔧 AdGuard Home Status (dns1)
Version: v0.107.72
Running: ✅ Yes
Protection: ✅ Enabled
DNS Port: 53
HTTP Port: 1080
Language: zh-cn
DHCP Available: ✅ Yes
```

**dns-info command | dns-info 命令：**
```
🌐 DNS Configuration (dns1)
Protection: ✅ Enabled
Rate Limit: 20 req/s
Upstream Mode: parallel
Cache: ✅ 4MB
DNSSEC: ❌ Disabled
IPv6: ✅ Enabled

Upstream DNS Servers:
  1. https://dns.alidns.com/dns-query
  2. 192.168.1.1:53
  3. 8.8.8.8:53
```

**filter-rules command | filter-rules 命令：**
```
🛡️ Filter Rules (dns1)
Filtering: ✅ Enabled
Update Interval: 12 hours
User Rules: 6 custom rules

Filter Lists:
  1. ✅ AdAway Default Blocklist (6540 rules)
  2. ✅ gh_100M_block (1110461 rules)
  3. ✅ 三角洲行动黑名单 (78126 rules)
```

**querylog command | querylog 命令：**
```
📜 Recent DNS Queries (dns1) - Last 5 entries

1. [12:26:44 AM] 🚫 BLOCKED api.telegram.org (192.168.145.188)
2. [12:26:43 AM] 🚫 BLOCKED self.events.data.microsoft.com (192.168.145.123)
   Rule: ||events.data.microsoft.com^
3. [12:26:42 AM] ✅ OK open.feishu.cn (192.168.145.188)
```

---

## Configuration | 配置说明

Configure instances in `adguard-instances.json`. The skill searches in this order:  
配置文件 `adguard-instances.json` 的搜索顺序：

1. `$OPENCLAW_WORKSPACE/adguard-instances.json` (if env var set | 如果设置了环境变量)
2. `~/.openclaw/workspace/adguard-instances.json` (default | 默认)
3. `~/.openclaw-*/workspace/adguard-instances.json` (custom workspace | 自定义工作区)

Example configuration | 配置示例：
```json
{
  "instances": {
    "dns1": {
      "url": "http://192.168.145.249:1080",
      "username": "admin",
      "password": "admin"
    },
    "dns2": {
      "url": "http://192.168.145.96:3000",
      "username": "admin",
      "password": "admin"
    }
  }
}
```

### Configuration Parameters | 配置参数

| Parameter | Description | Example |
|-----------|-------------|---------|
| `url` | AdGuard Home URL (with port) | `http://192.168.145.249:1080` |
| `username` | Admin username | `admin` |
| `password` | Admin password | `admin` |

| 参数 | 说明 | 示例 |
|------|------|------|
| `url` | AdGuard Home 访问地址（含端口） | `http://192.168.145.249:1080` |
| `username` | 管理员用户名 | `admin` |
| `password` | 管理员密码 | `admin` |

---

## Technical Details | 技术实现

- **Authentication | 认证方式:** Cookie-based (POST `/control/login`)
- **Data API | 数据接口:** GET `/control/*` endpoints
- **Runtime | 运行环境:** Node.js (ES Module)
- **Entrypoint | 入口文件:** `index.js`

### API Endpoints Used | 使用的 API 端点

- `/control/stats` - Statistics data | 统计数据
- `/control/status` - Service status | 服务状态
- `/control/dns_info` - DNS configuration | DNS 配置
- `/control/filtering/status` - Filter rules | 过滤规则
- `/control/querylog` - Query log | 查询日志
- `/control/clients` - Client management | 客户端管理
- `/control/tls/status` - TLS status | TLS 状态

---

## FAQ | 常见问题

**Q: Error "No AdGuard instances configured"?**  
**Q: 提示 "No AdGuard instances configured"？**

A: The skill searches for config in multiple locations. Check these paths in order:  
A: Skill 会在多个位置查找配置文件，按顺序检查：
   1. `$OPENCLAW_WORKSPACE/adguard-instances.json`
   2. `~/.openclaw/workspace/adguard-instances.json`
   3. `~/.openclaw-*/workspace/adguard-instances.json`

---

**Q: Authentication error when querying?**  
**Q: 查询失败，返回认证错误？**

A: Verify username/password in config file. Ensure AdGuard Home service is running.  
A: 检查配置文件中的用户名密码是否正确，确认 AdGuard Home 服务正常运行。

---

**Q: How to add more instances?**  
**Q: 如何添加更多实例？**

A: Add new key-value pairs to the `instances` object in `adguard-instances.json`.  
A: 在 `adguard-instances.json` 的 `instances` 对象中添加新的键值对即可。

---

**Q: querylog shows no data?**  
**Q: querylog 没有数据？**

A: Ensure query log is enabled in AdGuard Home settings (Settings → DNS Settings → Query log).  
A: 确保 AdGuard Home 设置中已启用查询日志（设置 → DNS 设置 → 查询日志）。

---

## Version History | 版本历史

### v1.1.0 (2026-02-24) - Enhanced

**New Commands | 新增命令：**
- `status` - Service status (version, protection, ports) | 服务状态（版本、保护、端口）
- `dns-info` - DNS configuration details | DNS 配置详情
- `filter-rules` - Filter rules and lists | 过滤规则和列表
- `querylog [n]` - Recent DNS queries | 最近 DNS 查询
- `clients` - Configured clients | 已配置的客户端
- `tls-status` - TLS/encryption status | TLS/加密状态

**Improvements | 改进：**
- Bilingual documentation (Chinese/English) | 中英文双语文档
- Better error handling | 更好的错误处理
- Enhanced output formatting | 增强的输出格式

### v1.0.0 (2026-02-24) - Initial

**Features | 功能：**
- stats/top-clients/top-blocked/health commands | 支持 stats/top-clients/top-blocked/health 命令
- Multi-instance configuration support | 多实例配置支持
- ES Module implementation | ES Module 实现

---

## Author | 作者

**Leo Li (@foxleoly)**  
License: MIT
