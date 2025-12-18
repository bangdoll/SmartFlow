---
description: 完成修改後自動部署到 Vercel
---

# 自動部署流程

當完成程式碼修改後，自動執行以下步驟將變更推送到雲端 (Vercel)：

// turbo-all
1. 暫存所有變更：
```bash
git add -A
```

2. 提交變更（使用適當的 commit message）：
```bash
git commit -m "<type>: <description>"
```
- type 可選: feat, fix, chore, docs, refactor, style, perf, test

3. 推送到遠端倉庫：
```bash
git push
```

4. Vercel 會自動偵測 push 並開始部署。

**注意**: 如果有未完成的變更或需要用戶確認的內容，應先完成後再執行此流程。
