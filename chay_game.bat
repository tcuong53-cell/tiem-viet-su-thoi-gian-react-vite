@echo off
chcp 65001 >nul
title Tiệm Việt Sử Thời Gian - Launcher
color 0E

echo ===================================================
echo         TIỆM VIỆT SỬ THỜI GIAN - LAUNCHER
echo ===================================================
echo.

:: 1. Kiem tra node_modules
echo [1/3] Kiểm tra thư viện (node_modules)...
if not exist "node_modules\" (
    echo [HỆ THỐNG] Không tìm thấy thư mục node_modules. Đang chạy npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [LỖI] Cài đặt thư viện thất bại! Vui lòng cài đặt NodeJS trước.
        pause
        exit /b
    )
) else (
    echo [HỆ THỐNG] Các thư viện đã được cài đặt sẵn.
)
echo.

:: 2. Mo trinh duyet web truoc
echo [2/3] Mở trò chơi trong trình duyệt...
start http://127.0.0.1:5173
echo.

:: 3. Khoi chay Vite Dev Server
echo [3/3] Khởi chạy máy chủ Vite Dev Server...
echo [HỆ THỐNG] Nhấn Ctrl+C để dừng trò chơi.
echo.
call npm run dev
