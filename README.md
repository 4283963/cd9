# 地下矿道三维掘进数字孪生系统

专为矿山安全量身定制的地下矿道三维掘进数字孪生系统，实现盾构机掘进过程的实时可视化监控。

## 项目架构

```
cd9/
├── frontend/          # 前端 3D 可视化系统 (Three.js + TypeScript + Vite)
│   ├── src/
│   │   ├── core/      # 3D 渲染核心模块 (场景管理、颜色映射)
│   │   ├── objects/   # 3D 对象 (隧道、盾构机、岩层、地下水)
│   │   ├── math/      # 数学坐标转换模块
│   │   ├── services/  # 数据对接服务 (WebSocket、API、数据管理)
│   │   ├── types/     # TypeScript 类型定义
│   │   ├── utils/     # 工具函数与 Mock 数据
│   │   ├── App.ts     # 应用主类
│   │   ├── main.ts    # 入口文件
│   │   └── style.css  # 界面样式
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/           # 后端服务 (Node.js + TypeScript + Express)
│   ├── src/
│   │   ├── controllers/  # API 控制器
│   │   ├── models/       # 数据模型 (TypeORM 实体)
│   │   ├── services/     # 业务逻辑层
│   │   ├── routes/       # 路由定义
│   │   ├── websocket/    # WebSocket 服务
│   │   ├── mock/         # 模拟数据生成器
│   │   ├── utils/        # 工具函数 (坐标转换等)
│   │   ├── database.ts   # 数据库连接管理
│   │   └── index.ts      # 入口文件
│   ├── .env
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

## 功能特性

- **三维矿道模型**: 基于 Three.js 的全三维地下矿道可视化，支持圆形/马蹄形断面
- **盾构机实时定位**: 动态显示盾构机当前掘进位置，刀盘旋转动画
- **岩层分布可视化**: 多层地质结构展示，不同岩层使用不同颜色和材质
- **地下水分布模拟**: 地下水层半透明渲染，水位动态效果，水压力颜色映射
- **应力数据实时渲染**: 围岩应力数据通过颜色变化直观展示 (蓝→绿→黄→红)
- **WebSocket 实时通信**: 传感器数据实时推送，自动重连机制
- **坐标转换系统**: 工程坐标与三维世界坐标相互转换
- **模拟数据模式**: 内置 Mock 数据生成器，无需真实传感器即可演示
- **内存数据库**: 默认使用 SQLite 内存模式，无需安装 MySQL 即可运行

## 快速开始

### 环境要求

- Node.js >= 16
- npm 或 yarn

### 后端启动

```bash
cd backend
npm install
npm run dev
```

后端服务将运行在 `http://localhost:3001`

WebSocket 地址: `ws://localhost:3001`

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端开发服务器将运行在 `http://localhost:5173` (或 5174 等，如果 5173 被占用)

### 访问系统

打开浏览器访问前端地址 (如 `http://localhost:5173`) 即可查看数字孪生系统。

**默认使用 Mock 数据模式**，可直接体验动态掘进效果。

如需连接真实后端，修改 `frontend/src/App.ts` 中 `DataManager` 的第三个参数为 `false`:

```typescript
this.dataManager = new DataManager(
  'ws://localhost:3001',
  'http://localhost:3001',
  false  // 设置为 false 连接后端
)
```

## 技术栈

### 前端
- **Three.js** - WebGL 3D 渲染引擎
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **WebSocket** - 实时数据通信
- **OrbitControls** - 相机轨道控制

### 后端
- **Node.js + TypeScript** - 服务端运行时
- **Express** - Web 框架
- **WebSocket (ws)** - 实时推送
- **TypeORM** - ORM 框架
- **SQLite / MySQL** - 数据持久化 (默认内存模式)
- **CORS** - 跨域支持

## 核心模块详解

### 前端核心模块

#### 1. 3D 渲染核心 (`src/core/`)
- **SceneManager**: 场景管理，包含相机、渲染器、光照、控制器
- **ColorMapper**: 应力颜色映射，支持蓝→绿→黄→红渐变色阶

#### 2. 3D 对象 (`src/objects/`)
- **Tunnel**: 矿道隧道，支持圆形和马蹄形断面，分段式渲染，应力着色
- **TBM**: 盾构机模型，包含刀盘、盾体、尾部，刀盘旋转动画
- **RockLayers**: 多层岩层可视化，半透明效果，网格辅助线
- **GroundWater**: 地下水分布，动态水面波纹，水压力颜色映射

#### 3. 数学坐标转换 (`src/math/`)
- **CoordinateTransformer**: 工程坐标与世界坐标相互转换
- 支持平移、旋转、缩放变换
- 提供向量和距离转换工具

#### 4. 数据服务 (`src/services/`)
- **WebSocketService**: WebSocket 实时数据接收，自动重连
- **ApiService**: REST API 数据请求
- **DataManager**: 数据状态管理，统一数据分发

### 后端核心模块

#### 1. 控制器 (`src/controllers/`)
- **SensorController**: 传感器数据上传、查询、统计
- **TBMController**: 盾构机状态管理
- **RockLayerController**: 岩层数据管理
- **GroundWaterController**: 地下水数据管理
- **RealtimeDataController**: 聚合后的实时数据接口

#### 2. 服务层 (`src/services/`)
- **SensorService**: 传感器数据处理
- **TBMService**: 盾构机状态管理
- **RealtimeDataService**: 实时数据聚合与格式转换
- **RockLayerService**: 岩层数据服务
- **GroundWaterService**: 地下水数据服务

#### 3. WebSocket 服务 (`src/websocket/`)
- **WebSocketManager**: WebSocket 连接管理，支持广播和单播
- 消息类型: `realtime`, `tbm-status`, `stress-data`, `groundwater`, `rocklayers`

#### 4. 数学坐标转换 (`src/utils/coordinate.ts`)
- `engineeringTo3D()` - 工程坐标转三维坐标
- `threeDToEngineering()` - 三维坐标转工程坐标
- `latLngToCartesian()` - 经纬度转笛卡尔坐标
- 向量运算工具

#### 5. 模拟数据生成器 (`src/mock/`)
- 模拟 20+ 个传感器实时数据
- 模拟盾构机掘进过程 (位置、速度、姿态实时变化)
- 初始化 7 层岩层数据
- 初始化 50 个地下水监测点
- 可配置数据生成频率 (默认 1000ms)

## API 接口

### 实时数据接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/realtime` | 获取完整实时数据 |
| GET | `/api/realtime/tbm` | 获取盾构机实时状态 |
| GET | `/api/realtime/stress` | 获取应力数据 |
| GET | `/api/realtime/rocklayers` | 获取岩层数据 |
| GET | `/api/realtime/groundwater` | 获取地下水数据 |

### 传感器数据接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/sensor` | 上传传感器数据 (支持单条/批量) |
| GET | `/api/sensor/latest` | 获取最新传感器数据 |
| GET | `/api/sensor/history` | 查询历史数据 |
| GET | `/api/sensor/stats` | 数据统计 |

### 盾构机接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tbm/status` | 获取当前状态 |
| PUT | `/api/tbm/status` | 更新状态 |
| GET | `/api/tbm/history` | 历史状态 |
| GET | `/api/tbm/stats` | 统计数据 |

## 配置说明

### 后端环境变量 (`backend/.env`)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 3001 | 服务端口 |
| `FRONTEND_URL` | http://localhost:5173 | 前端地址 (CORS) |
| `DB_MODE` | memory | 数据库模式: `memory`, `sqlite`, `mysql` |
| `MOCK_ENABLED` | true | 是否启用模拟数据 |
| `MOCK_INTERVAL` | 1000 | 模拟数据生成间隔 (ms) |

### MySQL 配置 (可选)

如需使用 MySQL 数据库，修改 `.env`:

```env
DB_MODE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=tunnel_digital_twin
```

## 界面说明

- **左上角**: 掘进状态面板 (里程、速度、刀盘转速、推力)
- **右上角**: 应力监测面板 (最大/最小/平均应力 + 色阶图例)
- **左下角**: 盾构机位置面板 (坐标、俯仰角、偏航角)
- **右下角**: 水文地质面板 (水位、水压、岩层类型、硬度)
- **右侧**: 视图控制面板 (盾构视角/侧面/俯视、岩层开关、地下水开关)
- **底部**: 状态栏 (连接状态、系统时间、FPS)

## 坐标系说明

系统采用统一的右手坐标系：
- **X 轴**: 横向 (左右方向，向右为正)
- **Y 轴**: 竖向 (上下方向，向上为正，地下为负值)
- **Z 轴**: 掘进方向 (沿隧道向前为正)

盾构机刀盘朝向 +Z 方向。

## 开发说明

### 项目结构设计原则
- 前后端完全独立，通过 REST API 和 WebSocket 通信
- 模块化设计，各模块职责单一
- TypeScript 类型安全
- 支持 Mock 模式，便于开发和演示

### 扩展建议
- 接入真实传感器数据源
- 添加更多地质灾害预警模型
- 增加历史数据回放功能
- 添加 VR/AR 支持
- 接入更多监测设备 (变形监测、气体监测等)
