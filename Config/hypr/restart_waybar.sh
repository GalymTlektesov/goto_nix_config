#!/usr/bin/env bash

# Жестко убиваем все запущенные панели
pkill -9 waybar

# Небольшая пауза, чтобы процессы точно освободили порты и память
sleep 0.2

# Запускаем верхнюю панель в фоне
waybar >/dev/null 2>&1 &

# Запускаем левую панель (док) в фоне
waybar -c ~/.config/waybar/config-launcher.jsonc >/dev/null 2>&1 &

sleep 0.5

ags run >/dev/null 2>&1 &