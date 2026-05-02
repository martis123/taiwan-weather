# 每日台灣天氣

可安裝到手機主畫面的台灣天氣 PWA。資料來源為中央氣象署 OpenData。

## 中央氣象署授權碼

這個版本使用中央氣象署 `F-C0032-001` 今明 36 小時天氣預報。第一次使用時，請先到中央氣象署開放資料平台申請 Authorization 授權碼：

```text
https://opendata.cwa.gov.tw/user/authkey
```

取得後在 App 畫面貼上授權碼並按「儲存」。授權碼只會存在目前裝置的瀏覽器 localStorage。

## 本機預覽

如果本機伺服器已啟動，打開：

```text
http://127.0.0.1:5500
```

## 發布到 GitHub Pages

1. 到 GitHub 新增一個 repository，例如 `taiwan-weather`。
2. 在這個資料夾開啟終端機。
3. 依序執行：

```powershell
git init
git add .
git commit -m "Create Taiwan weather PWA"
git branch -M main
git remote add origin https://github.com/你的GitHub帳號/taiwan-weather.git
git push -u origin main
```

4. 到 GitHub repository 頁面，進入 `Settings`。
5. 左側選 `Pages`。
6. `Build and deployment` 的 `Source` 選 `Deploy from a branch`。
7. `Branch` 選 `main`，資料夾選 `/root`，按 `Save`。
8. 等 1 到 3 分鐘，GitHub Pages 會給你公開網址。

## 手機安裝

Android Chrome：打開 GitHub Pages 網址後，按瀏覽器選單，選「安裝應用程式」或「加入主畫面」。

iPhone Safari：打開 GitHub Pages 網址後，按分享按鈕，選「加入主畫面」。
