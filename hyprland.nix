{ pkgs, ... }:

{
  # Включаем сам Hyprland
  programs.hyprland = {
    enable = true;
    xwayland.enable = true; # Для поддержки старых игр и приложений без Wayland
  };

  # Переменные окружения, специфичные ТОЛЬКО для Hyprland и Wayland (чтобы Nvidia не лагала)
  environment.sessionVariables = {
    # Заставляем прослойку WLROOTS (на ней работает Hyprland) дружить с Nvidia
    WLR_NO_HARDWARE_CURSORS = "1";
    # Указываем подсказки для Qt/Gtk приложений, чтобы они запускались в режиме Wayland
    NIXOS_OZONE_HWACCEL = "1";
    MOZ_ENABLE_WAYLAND = "1"; # Для Firefox
  };

  # Пакеты, которые нужны только в Hyprland (утилиты для скриншотов, панельки и т.д.)
  # Пока оставим этот список минимальным, чтобы ты мог зайти в систему
  environment.systemPackages = with pkgs; [
    kitty # Родной терминал для Hyprland, чтобы нажать Super+Q и сразу настроить всё
    wofi  # Легкое меню запуска приложений (аналог KRunner в KDE)
    waybar
    font-awesome # Отличные иконки специально дляWaybar
    grim  # <-- ДЛЯ СКРИНШОТОВ
    slurp # <-- ДЛЯ ВЫБОРА ОБЛАСТИ МЫШКОЙ
    wl-clipboard
  ];
}
