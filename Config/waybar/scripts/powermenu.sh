#!/usr/bin/env bash

chosen=$(echo -e "img:system-shutdown-symbolic Выключение\nimg:system-reboot-symbolic Перезапуск\nimg:system-suspend-symbolic Спящий режим" | wofi --dmenu)

case "$chosen" in
    *"Выключение"*)
        systemctl poweroff
        ;;
    *"Перезапуск"*)
        systemctl reboot
        ;;
    *"Спящий режим"*)
        systemctl suspend
        ;;
esac