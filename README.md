# MusicWave Download

MusicWave 是一款 macOS 与 Windows 桌面音乐可视化工具。音乐播放时，波形会根据音量与节奏变化；暂停后自动隐去。

## 支持播放器

- Apple Music
- QQ 音乐
- 网易云音乐
- Spotify

## 下载

打开 GitHub Pages 下载页面，或在 `downloads` 目录获取最新版安装包。

- macOS：MusicWave 1.8
- Windows：MusicWave 1.0 x64

## 发布新版本

1. 上传新的 DMG 或 Windows ZIP。
2. 修改 `version.json` 中对应平台的版本号、下载地址和更新说明。
3. 提交并推送到 GitHub；Cloudflare Pages 会自动重新部署。

页面不会把版本号写死在 HTML 中。`script.js` 会读取 `version.json`，更新下载按钮、版本卡片和更新内容。
