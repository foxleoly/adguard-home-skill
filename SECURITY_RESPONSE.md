# Security Audit Response

本文档回应 AdGuard Home Skill 的安全审查意见。

---

## 🔍 审查意见回应

### 1. Unicode 控制字符检测 ⚠️

**审查意见：**
> SKILL.md flagged unicode control chars (documentation), which can be used to hide or obfuscate content

**回应：** ✅ **误报 - 已彻底检查**

使用 Python 脚本深度检查了所有文档文件：

```bash
# 检查的字符包括：
- U+200B: Zero Width Space
- U+200C: Zero Width Non-Joiner
- U+200D: Zero Width Joiner
- U+200E/U+200F: LTR/RTL Marks
- U+202A-U+202E: Directional Formatting
- U+2060-U+2064: Invisible characters
- U+FEFF: BOM
- U+00A0: Non-Breaking Space
- ASCII 控制字符 (< 0x20, 除 \t\n\r)
```

**检查结果：**
```
✅ SKILL.md - CLEAN
✅ SKILL.en.md - CLEAN
✅ README.md - CLEAN
```

**结论：** 扫描工具误报了 UTF-8 编码的中文字符。所有文档文件均无隐藏控制字符。

---

### 2. 元数据不一致 ⚠️

**审查意见：**
> package lists a GitHub homepage/repository in clawhub.json but top-level registry metadata said 'Homepage: none' and 'Source: unknown'

**回应：** ✅ **已修复 (v1.2.5)**

**clawhub.json 配置：**
```json
{
  "homepage": "https://github.com/foxleoly/adguard-home-skill",
  "repository": "https://github.com/foxleoly/adguard-home-skill",
  "metadata": {
    "clawdbot": {
      "primaryEnv": "ADGUARD_URL"
    }
  },
  "requires": {
    "env": ["ADGUARD_URL", "ADGUARD_USERNAME", "ADGUARD_PASSWORD"]
  }
}
```

**修复内容 (v1.2.5)：**
- ✅ 设置 `primaryEnv: "ADGUARD_URL"`
- ✅ `requires.env` 正确声明三个必需环境变量
- ✅ `homepage` 和 `repository` 指向 GitHub 仓库

**已发布：** adguard-home@1.2.5 (k97escvhx3fj20ye6yw7kcn5gs81trv3)

---

### 3. 代码安全性 ✅

**审查意见：**
> index.js only makes HTTP requests to the configured AdGuard instance and do not attempt to read unrelated system files or external endpoints

**回应：** ✅ **安全 - 已验证**

**代码审查结果：**

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 网络调用 | ✅ 安全 | 只连接用户配置的 `ADGUARD_URL` |
| 文件读取 | ✅ 安全 | 不读取任何系统文件 |
| 命令执行 | ✅ 安全 | 无 `execSync`/`child_process` 调用 |
| 硬编码端点 | ✅ 安全 | 无外部 API 调用 |
| 输入验证 | ✅ 安全 | 实例名、命令、URL、参数都有验证 |
| 命令白名单 | ✅ 安全 | 只允许 10 个预定义命令 |

**代码位置：** `index.js` (13.5KB, 完整开源)

---

### 4. 凭证处理 ✅

**审查意见：**
> SKILL.md and README instruct the user to export ADGUARD_URL, ADGUARD_USERNAME and ADGUARD_PASSWORD or use 1Password CLI

**回应：** ✅ **安全最佳实践**

**推荐方式：**
1. **环境变量**（推荐）
   ```bash
   export ADGUARD_URL="http://..."
   export ADGUARD_USERNAME="admin"
   export ADGUARD_PASSWORD="..."
   ```

2. **1Password CLI**（最安全）
   ```bash
   export ADGUARD_PASSWORD=$(op read "op://vault/AdGuard/password")
   ```

**已移除的不安全方式：**
- ❌ `adguard-instances.json` 文件配置（v1.2.2 移除）
- ❌ 代码中不再支持读取任何凭证文件

**额外建议：**
- 在 AdGuard Home 中创建只读账户（如果支持）
- 不要在全局 CI/容器中放置凭证

---

## 📊 安全检查总结

| 检查项 | 状态 | 版本 |
|--------|------|------|
| Unicode 控制字符 | ✅ 误报，文件干净 | - |
| 元数据一致性 | ✅ 已修复 | v1.2.5 |
| 代码安全性 | ✅ 安全 | v1.2.3+ |
| 凭证处理 | ✅ 安全 | v1.2.2+ |
| 网络隔离 | ✅ 只连接配置 URL | v1.2.0+ |
| 输入验证 | ✅ 完整 | v1.2.0+ |
| 来源验证 | ✅ GitHub 公开 | - |

---

## 🔗 验证链接

- **GitHub Repository:** https://github.com/foxleoly/adguard-home-skill
- **ClawHub Skill:** adguard-home@1.2.5
- **作者:** Leo Li (@foxleoly)

---

## 📝 测试建议

审查者建议在隔离环境测试：

```bash
# 1. 在容器/VM 中安装
docker run --rm -it node:18 bash

# 2. 复制 skill 代码
cp -r adguard-home /skills/

# 3. 设置环境变量
export ADGUARD_URL="http://your-test-adguard:1080"
export ADGUARD_USERNAME="readonly"
export ADGUARD_PASSWORD="..."

# 4. 监控网络
tcpdump -i any -n host your-test-adguard

# 5. 运行命令
node /skills/adguard-home/index.js stats

# 6. 验证只连接到配置的 URL
netstat -tn | grep ESTABLISHED
```

---

**最后更新:** 2026-02-25  
**版本:** v1.2.5  
**状态:** ✅ All security concerns addressed
