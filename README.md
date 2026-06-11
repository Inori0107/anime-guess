# 動漫猜謎（anime-guess）

Nuxt 4 多人即時搶答遊戲：猜歌、猜角色、猜台詞。支援 WebSocket 同步房間狀態。

## 前置需求

- Node.js 22+
- [Supabase](https://supabase.com) 專案（Postgres 題庫）
- [Render](https://render.com) 帳號（部署用）

## 快速開始

```bash
npm install
cp .env.example .env    # 填入 Supabase Session pooler URI
npm run db:import       # 建立資料表並匯入種子題目
npm run dev
```

`DATABASE_URL` 為**必填**。題庫一律存 Supabase Postgres；`server/data/questions/*.json` 僅作種子資料，供 `db:import` 使用。

## 環境變數

| 變數 | 必填 | 說明 |
|------|:----:|------|
| `DATABASE_URL` | ✓ | Supabase **Session pooler** URI |
| `NUXT_PUBLIC_WS_BASE` | | WebSocket 基底 URL，前後端分離時才需設定 |
| `PORT` | | 伺服器埠，預設 `3000` |

### Supabase 連線

1. Supabase → **Connect** → **Session pooler** → 複製 URI
2. 若 Direct connection 顯示 IPv4 不相容，**務必使用 Session pooler**
3. 密碼為建立專案時的 **Database password**

## 題庫管理

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/question-bank/add` | 新增題目（每 IP 每分鐘 10 次） |
| GET | `/api/question-bank/list` | 題庫列表與統計 |

| 頁面 | 說明 |
|------|------|
| `/host/create` | 新增題目 |
| `/host/bank` | 瀏覽題庫 |

```bash
npm run db:import   # 重新匯入種子題目（已存在者略過）
```

## Render 部署

### Blueprint（推薦）

1. Push 到 GitHub
2. Render → **New** → **Blueprint** → 選 repo
3. 設定環境變數 `DATABASE_URL`
4. 確認 **Instances = 1**

### 手動建立

| 設定項 | 值 |
|--------|-----|
| Runtime | Docker |
| Dockerfile | `./Dockerfile` |
| Health Check | `/api/health` |
| Instances | **1** |

環境變數只需 `DATABASE_URL`。

### 單一實例（必須）

房間狀態與 WebSocket 存在伺服器記憶體：

- 只能跑 **1 個 instance**
- 多實例會導致房間找不到、同步失效
- 重啟後進行中遊戲會中斷

## 專案結構

```
app/                 # Vue 前端
server/              # Nitro API、WebSocket、題庫
  db/schema.mjs      # 資料表定義（db-init 與 db:import 共用）
  data/questions/    # 種子題目（僅供匯入）
shared/              # 型別與常數
scripts/             # db:import 腳本
```

## 安全備註

題庫 API 無登入保護，已加 rate limit。請勿公開 `/host/create` 連結，`.env` 勿 commit。
