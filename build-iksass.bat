@echo off
title IKSASS AUTO BUILD
cd /d "%~dp0"

echo ============================================
echo        IKSASS AUTO BUILD SYSTEM
echo ============================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] Python tidak ditemukan di PATH.
  echo Install Python 3 dan centang "Add Python to PATH".
  pause
  exit /b 1
)

echo Pilih mode build:
echo   [1] QUICK  - berita + news-index + pages-index (paling cepat)
echo   [2] FULL   - build_all + validate_site (paling lengkap)
echo.
set /p MODE="Masukkan pilihan (1/2) lalu Enter: "

if "%MODE%"=="1" goto QUICK
if "%MODE%"=="2" goto FULL

echo.
echo [ERROR] Pilihan tidak valid. Masukkan 1 atau 2.
pause
exit /b 1

:QUICK
echo.
echo [QUICK] Generate berita...
python tools\berita_generator.py
if errorlevel 1 (
  echo [ERROR] berita_generator gagal.
  pause
  exit /b 1
)

echo.
echo [QUICK] Build news-index...
python tools\build_news_index.py
if errorlevel 1 (
  echo [ERROR] build_news_index gagal.
  pause
  exit /b 1
)

echo.
echo [QUICK] Build pages index (search)...
python tools\build_pages_index.py
if errorlevel 1 (
  echo [ERROR] build_pages_index gagal.
  pause
  exit /b 1
)

echo.
echo ============================================
echo DONE: QUICK build selesai.
echo (Catatan: validate_site tidak dijalankan di mode QUICK)
echo ============================================
pause
exit /b 0

:FULL
echo.
echo [FULL] Build semua (generate berita, build news-index, galeri, pages index)...
python tools\build_all.py
if errorlevel 1 (
  echo [ERROR] build_all gagal.
  pause
  exit /b 1
)

echo.
echo [FULL] Validasi site...
python tools\validate_site.py
if errorlevel 1 (
  echo [ERROR] validate_site menemukan masalah. Lihat output di atas.
  pause
  exit /b 1
)

echo.
echo ============================================
echo DONE: FULL build selesai.
echo ============================================
pause
exit /b 0