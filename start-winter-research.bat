@echo off
chcp 65001 >nul
title Winter Research Dashboard
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-winter-research.ps1"
