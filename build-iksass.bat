@echo off
title IKSASS AUTO BUILD
cd /d "%~dp0"

echo ============================================
echo        IKSASS AUTO BUILD SYSTEM
echo ============================================

python --version >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] Python tidak ditemukan di PATH.
  echo Install Python 3 dan centang "Add Python to PATH".
  pause
  exit /b 1
)

echo.
echo [1/2] Build semua (generate berita, build news-index, galeri, pages index)...
python tools\build_all.py
if errorlevel 1 (
  echo [ERROR] build_all gagal.
  pause
  exit /b 1
)

echo.
echo [2/2] Validasi site...
python tools\validate_site.py
if errorlevel 1 (
  echo [ERROR] validate_site menemukan masalah. Lihat output di atas.
  pause
  exit /b 1
)

echo.
echo ============================================
echo DONE: Build selesai.
echo ============================================
pause
