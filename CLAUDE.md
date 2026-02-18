# Vlog 项目说明

## 部署信息

- **线上地址**：https://janetyujun97-pixel.github.io/myblog/
- **GitHub 仓库**：https://github.com/janetyujun97-pixel/myblog
- **部署方式**：GitHub Pages（main 分支根目录）

## 更新博客

在本地修改文件后，执行以下命令推送到线上：

```bash
cd /Users/primo/claude/myvlog
git add .
git commit -m "描述本次改动"
git push
```

推送后约 1 分钟，网站自动更新。

## 项目结构

```
myvlog/
├── index.html       首页（文章列表）
├── post.html        文章详情页
├── admin.html       写文章 / 管理后台
├── css/
│   └── style.css    完整设计系统（亮/暗双主题）
└── js/
    ├── data.js      数据层（localStorage）
    ├── app.js       首页逻辑
    ├── post.js      详情页逻辑
    └── admin.js     后台逻辑
```

## 注意事项

- 文章数据保存在浏览器 **localStorage** 中，换设备或清除浏览器数据后会丢失
- 图片以 Base64 编码存储，上传大量图片会撑大 localStorage，建议使用外链图片 URL
