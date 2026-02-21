# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 部署

- **线上地址**：https://janetyujun97-pixel.github.io/myblog/
- **GitHub 仓库**：https://github.com/janetyujun97-pixel/myblog
- **部署方式**：GitHub Pages（main 分支根目录，push 后约 1 分钟自动更新）

```bash
git add .
git commit -m "描述本次改动"
git push
```

## 架构概览

纯静态站点，无构建工具，直接用浏览器运行。数据层接入 **Supabase**（PostgreSQL + Storage）。

```
index.html   首页（文章列表 + 搜索）
post.html    文章详情页
admin.html   写文章 / 管理后台
css/style.css    完整设计系统，含亮/暗双主题（CSS 变量切换）
js/data.js       数据层，唯一与 Supabase 交互的文件
js/app.js        首页逻辑
js/post.js       详情页逻辑
js/admin.js      后台逻辑
```

## 数据层（js/data.js）

所有 DB 操作均为 **async**，调用方必须 await。`DB` 对象暴露以下方法：

| 方法 | 说明 |
|------|------|
| `getPosts()` | 按日期降序返回所有文章 |
| `getPost(id)` | 按 id 返回单篇文章 |
| `createPost(data)` | 创建文章，支持传入 `date` 字段（seed 用） |
| `updatePost(id, data)` | 部分更新文章（只传需要改的字段） |
| `deletePost(id)` | 删除文章 |
| `incrementViews(id)` | 调用 `increment_views` RPC +1 阅读量 |
| `searchPosts(query, category)` | 客户端过滤（fetch all → filter） |
| `getCategories()` | 按 id 升序返回分类名数组 |
| `addCategory(name)` | 新增分类（去重） |
| `deleteCategory(name)` | 删除分类 |
| `uploadImage(file)` | 上传图片到 Storage `images` bucket，返回公开 URL |
| `seed()` | 首次运行时写入示例数据（通过 count 查询判断是否已有数据） |

**列名映射**：JS 对象用驼峰（`coverImage`、`videoUrl`），Supabase 表用下划线（`cover_image`、`video_url`），`_rowToPost()` 负责转换。

## Supabase 配置

凭据在 `js/data.js` 顶部。Supabase 需要的表结构和 RPC 见 `js/data.js` 顶部注释块（SQL 建表语句），包括：
- `categories` 表（id, name）
- `posts` 表（id, title, content, excerpt, category, tags[], cover_image, images[], video_url, featured, date, views）
- `increment_views(post_id)` RPC
- RLS 策略（匿名读写）
- Storage `images` bucket（公开）

## 关键约定

- **所有页面初始化**：包裹在 `async function init()` 或 async IIFE 中，均调用 `DB.seed()`
- **主题**（亮/暗）：用 `localStorage` 存 `vlog_theme`，每个 JS 文件顶部都有相同的主题初始化 IIFE
- **图片**：存储为 Supabase Storage 公开 URL；封面图也支持填外链 URL
- **视频**：支持 YouTube、Bilibili 和直链 mp4，`getVideoEmbed()` 在 `post.js` 中处理
- **搜索**：在客户端做，`searchPosts` 先 fetch 全部再过滤
- **admin.html** 中 `deleteCategory` / `deletePost` / `loadPostForEdit` 通过 HTML `onclick` 内联调用，必须保持全局可访问
- **编辑入口**：`post.html` 顶部有"编辑文章"按钮，链接到 `admin.html?edit={id}`；admin 初始化时检查 `?edit=` 参数并自动加载
