## Nexus 是什麼？

Nexus 是我自主設計並實作的企業級 Angular UI 元件庫，完整架構從 Figma 設計端一路串到前端發佈。

核心解決的問題有兩個：一是跨專案重複造輪子，二是設計跟開發的規格對不上。

---

## Figma → 前端：四層怎麼串的？

**整條鏈路：Figma › JSON › CSS Variables › Angular Components › Projects**

**第一層：Figma 定義 Design Token**
在 Figma 用 Variables 定義 Color、Spacing、Typography、Radius。
命名規則跟前端 CSS 變數直接對齊——
Figma 叫 `color/brand/primary`，CSS 就是 `--color-brand-primary`。
用 OKLCH 色彩空間，比傳統 HEX 更貼近肉眼判讀、也更好做 dark mode。

**第二層：Figma 輸出 JSON → AI Agent 解析**
Figma 把 Variables 匯出成 JSON，AI Agent 讀取 node-id 解析結構，
建立標準化 Token 模型（5 主題 × light/dark × 語意角色），
同時負責把 React（Radix UI）的元件邏輯轉換成 Angular（CDK）的語言。

**第三層：CSS Variables + Angular Component 生成**
Agent 依規範生成 CSS 變數和元件，樣式邏輯用 CVA（class-variance-authority）管理 Variants，
確保設計端的按鈕有幾種樣式，前端就對應幾個 prop 選項，兩邊語言統一。

**第四層：CLI 發佈，開發端直接用**
元件打包成 JSON 放到 GitLab Pages 作為靜態 API，
開發者只要：
```
npx @nexus/cli add button
```
元件源碼直接複製進專案，不是 npm 依賴，開發者完全掌控源碼，沒有版本鎖定問題。

---

## Figma 交接的實際方式

開發者在 Figma 看到設計後，透過 NEXUS MCP Server 直接 inspect 設計文件，
MCP 回傳對應的 Nexus 元件清單，開發者再用 CLI 安裝，直接拼裝頁面。

設計師交付時，我們要求標註：
- 使用哪個元件（對應元件庫名稱）
- 傳哪些 props（例如 `variant="outline" size="sm"`）
- 有沒有客製化

這樣開發端收到後，大多情況直接套元件、傳 props，不需要重新切版。

---

## 品質保證機制

每個元件進 main 前都要過三關：
- **ESLint**：語法規範
- **TypeScript**：型別完整性
- **Semgrep**：資安弱掃

CI/CD 自動執行，有問題直接阻擋合併。

---

## 目前成果

- 59+ 生產級元件
- 5 種顏色主題（含 light / dark）
- 60% 元件已由 AI 自動優化生成
- CLI 安裝單一複雜元件 < 5 秒
