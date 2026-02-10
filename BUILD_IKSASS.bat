@echo off
title IKSASS - Build All

echo =======================================
echo   IKSASS ONE CLICK BUILD
echo =======================================
echo.

REM pastikan dijalankan dari folder project
cd /d "%~dp0"

if not exist tools\build_all.py (
  echo [ERROR] tools\build_all.py tidak ditemukan.
  echo Pastikan file ini berada di folder utama project IKSASS.
  pause
  exit /b 1
)

echo Menjalankan build_all.py ...
echo.

python tools\build_all.py

echo.
echo =======================================
echo   SELESAI
echo =======================================
echo.
pause