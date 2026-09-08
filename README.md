# 微信课堂签到系统

基于H5的课堂GPS定位签到系统，支持实时签到监控、请假管理和数据导出。

## 功能特性

### 学生端
- 学号姓名登录
- 输入课程码加入班级
- GPS定位签到（100米范围）
- 查看签到记录
- 提交请假申请

### 教师端
- 创建课程，生成课程码
- 实时签到监控
- 请假审批
- 导出CSV签到数据

## 快速开始

### 1. 配置Supabase

1. 访问 [supabase.com](https://supabase.com) 注册账号
2. 创建新项目
3. 在 SQL Editor 中执行 `database/init.sql` 初始化数据库
4. 在 Project Settings 中获取 URL 和 anon key
5. 编辑 `js/config.js`，填入你的 Supabase 配置

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key',
  // ...
};
```

### 2. 配置教室位置

在 `js/config.js` 中修改教室的经纬度坐标：

```javascript
CLASSROOM_LOCATION: {
  lat: 31.2222,  // 纬度
  lng: 121.4581  // 经度
}
```

### 3. 部署

将项目文件部署到任何静态托管服务：

- **Vercel**: `vercel deploy`
- **Netlify**: 拖拽文件夹到 Netlify
- **GitHub Pages**: 推送到 gh-pages 分支

### 4. 公众号配置

1. 登录微信公众平台
2. 在自定义菜单中添加链接，指向部署后的H5页面
3. 或在自动回复中添加链接

## 使用流程

### 学生签到
1. 打开H5页面
2. 选择"学生登录"
3. 输入学号和姓名
4. 输入课程码加入班级
5. 进入签到页面
6. 允许定位权限
7. 在教室100米范围内点击"签到"

### 教师管理
1. 打开H5页面
2. 选择"教师登录"
3. 输入姓名登录
4. 创建课程，获取课程码
5. 将课程码分享给学生
6. 查看实时签到监控
7. 审批请假申请
8. 导出CSV数据

## 技术架构

- **前端**: HTML + CSS + JavaScript
- **后端**: Supabase (PostgreSQL + Realtime + Auth)
- **部署**: 任何静态托管服务

## 文件结构

```
WX签到插件/
├── index.html              # 主入口
├── css/
│   └── style.css          # 样式
├── js/
│   ├── config.js          # 配置
│   ├── supabase.js        # 数据库
│   ├── auth.js            # 认证
│   ├── location.js        # 定位
│   └── api.js             # API封装
├── pages/
│   ├── student/           # 学生端
│   │   ├── login.html
│   │   ├── join.html
│   │   ├── checkin.html
│   │   ├── records.html
│   │   └── leave.html
│   └── teacher/           # 教师端
│       ├── login.html
│       ├── courses.html
│       ├── monitor.html
│       ├── leave.html
│       └── export.html
├── database/
│   └── init.sql           # 数据库初始化
└── README.md
```

## 注意事项

1. 首次使用需要配置Supabase
2. 教室位置坐标需要根据实际情况修改
3. 需要HTTPS环境才能使用定位功能
4. 建议在手机端测试定位签到功能

## 常见问题

**Q: 定位不准确怎么办？**
A: 确保在室外或窗边使用，室内可能影响GPS信号。

**Q: 如何获取教室坐标？**
A: 在教室位置打开地图应用，长按即可查看坐标。

**Q: Supabase免费额度够用吗？**
A: 免费额度支持500MB数据库和50000月活用户，足够实验使用。
