# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running ‘nixos-help’).

{ config, pkgs, ... }:

{

  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  nixpkgs.overlays = [
    (self: super: {
      obs-studio = super.obs-studio.override { cudaSupport = true; };
    })
  ];

  # Разрешаем сборщику использовать старый openssl ради CUDA в OBS
  nixpkgs.config.permittedInsecurePackages = [
    "openssl-1.1.1w"
  ];

  # Bootloader.
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  # Переключаем систему на оптимизированное игровое ядро Zen (аналог CachyOS)
  boot.kernelPackages = pkgs.linuxPackages_zen;

  networking.hostName = "nixos"; # Имя вашего ПК в сети.

  # Enable networking
  networking.networkmanager.enable = true; # Включает NetworkManager
  networking.extraHosts = ''
  127.0.0.1 goto
'';

  # Set your time zone.
  time.timeZone = "Asia/Almaty";

# Настройки языка и локали
  i18n.defaultLocale = "ru_RU.UTF-8";

  i18n.extraLocaleSettings = {
    LC_ADDRESS = "ru_RU.UTF-8";
    LC_IDENTIFICATION = "ru_RU.UTF-8";
    LC_MEASUREMENT = "ru_RU.UTF-8";
    LC_MONETARY = "ru_RU.UTF-8";
    LC_NAME = "ru_RU.UTF-8";
    LC_NUMERIC = "ru_RU.UTF-8";
    LC_PAPER = "ru_RU.UTF-8";
    LC_TELEPHONE = "ru_RU.UTF-8";
    LC_TIME = "ru_RU.UTF-8";
  };
  services.xserver.enable = true; # Включает графическую подсистему

  # Enable the KDE Plasma Desktop Environment.
  services.displayManager.sddm.enable = true; # Экран приветствия
  services.desktopManager.plasma6.enable = true; # Оболочка KDE Plasma 6

  # Configure keymap in X11
  services.xserver.xkb = {
    layout = "us";
    variant = "";
  };

  # Enable CUPS to print documents.
  services.printing.enable = true;

  # Define a user account.
  users.users."goto" = {
    isNormalUser = true;
    description = "goto";
    extraGroups = [ "networkmanager" "wheel" "input" ];
    packages = with pkgs; [
      kdePackages.kate
    ];
  };

  # Максимальное сжатие initrd для экономии места в /boot
  # boot.initrd.supportedFilesystems = [ "vfat" "btrfs" ]; # Оставляем только самое нужное для старта
  boot.initrd.compressor = "gzip -9";# сжатие 


  boot.initrd.includeDefaultModules = false;
  boot.initrd.kernelModules = [ "nvme" "btrfs" "vfat" "hid" "usbhid" ];

  # Install firefox.
  programs.firefox.enable = true;

  # Allow unfree packages - Разрешить проприетарный софт
  nixpkgs.config = {
    allowUnfree = true;
    
    # Разрешаем сборку Sublime Text
    problems.handlers = {
      sublimetext4.broken = "ignore";
    };
  };

  # Список программ для ВСЕХ пользователей системы (только имена пакетов!)
  environment.systemPackages = with pkgs; [
    vesktop               # Discord-клиент с поддержкой демонстрации экрана на Wayland
    krita                 # Графический редактор
    fastfetch             # Красивый вывод инфо о системе при запуске
    git
    brightnessctl
    evtest
    vlc
    ffmpeg-full                    # Полная версия ffmpeg со всеми кодеками
    cmatrix
    btop
    hollywood
    cava
    kdePackages.qtwebsockets
    kdePackages.qtstyleplugin-kvantum
    obsidian              # База знаний и заметки Markdown
    foliate               # Отличная стильная читалка электронных книг
    obs-studio
    sublime4
    kdePackages.kdenlive
    pkgs.yandex-music
    pkgs.godot
    pkgs.blender
    pkgs.unityhub
    pkgs.docker
    pkgs.jetbrains.pycharm
    pkgs.vscode
    lutris
    temurin-bin
    pkgs.onlyoffice-desktopeditors
    pkgs.nvtopPackages.nvidia

    # Заменяем обычный python3 на версию с модулем websockets
    (python3.withPackages (ps: with ps; [
      websockets
    ]))
    # Сюда можно будет дописать другие программы через пробел, например: mangohud gimp
  ];

  # Говорим системе использовать Kvantum как глобальный стиль для приложений Qt
  qt = {
    enable = true;
    style = "kvantum";
  };

  services.flatpak.enable = true;

  environment.sessionVariables = {
    QML2_IMPORT_PATH = [
      "${pkgs.kdePackages.qtwebsockets}/lib/qt-6/qml"
      "${pkgs.kdePackages.qtwebsockets}/share/qt-6/qml"
    ];
  };

  # геншин
  programs.anime-game-launcher.enable = true;

  # лаунчер для HSR
  programs.honkers-railway-launcher.enable = true;

  # лаунчер для ZZZ (Zenless Zone Zero)
  programs.sleepy-launcher.enable = true;

  # Включаем GameMode для оптимизации процессора
  programs.gamemode.enable = true;

  # Снимаем системные ограничения на количество открытых файлов и квоты памяти
  security.pam.loginLimits = [
    { domain = "*"; type = "-"; item = "nofile"; value = "524288"; }
    { domain = "*"; type = "-"; item = "memlock"; value = "unlimited"; }
  ];

  # Включаем правильную подушку безопасности через zRam
  zramSwap = {
    enable = true;
    algorithm = "zstd"; # Самый быстрый алгоритм сжатия, идеален для Zen ядра
    memoryPercent = 50;  # Позволит сжать фоновый хлам, освободив до 6-8 ГБ чистой ОЗУ для AoE4
  };

  # Инструктируем ядро Zen правильно балансировать память
  boot.kernel.sysctl = {
    "vm.max_map_count" = 2147483642; # Базовое требование Steam
    "vm.swappiness" = 100;            # Агрессивно вычищать Дискорд/Браузер в zRam, отдавая всю ОЗУ игре
    "vm.vfs_cache_pressure" = 500;   # Не давать дисковому кэшу раздуваться во время каток
  };


  # Включаем Steam и открываем нужные ему порты
  programs.steam = {
    enable = true;
    remotePlay.openFirewall = true;
    dedicatedServer.openFirewall = true;
  };

  programs.zsh = {
    enable = true;
    enableCompletion = true;
    autosuggestions.enable = true;
    syntaxHighlighting.enable = true;

    ohMyZsh = {
      enable = true;
      plugins = [ "git" "sudo" ];
      theme = "agnoster"; # <-- Поменяйте "robbyrussell" на "agnoster" (или "ys")
    };

    interactiveShellInit = ''
      ${pkgs.fastfetch}/bin/fastfetch
    '';
  };

  fonts.packages = [
    pkgs.fira-code
    pkgs.fira-code-symbols
    
    # Новый синтаксис для NixOS 25.11 / 26.05
    pkgs.nerd-fonts.fira-code
  ];

  # Указываем системе, что для пользователя goto оболочкой по умолчанию будет Zsh
  users.defaultUserShell = pkgs.zsh;


  # --- НАСТРОЙКИ ЗВУКА И AUDIO ---
  security.rtkit.enable = true;
  services.pulseaudio.enable = false;
  services.pipewire = {
    enable = true;
    alsa.enable = true;
    alsa.support32Bit = true; # Звук в 32-битных играх Steam
    pulse.enable = true;
    jack.enable = true;
  };
  

  # локальный север для домашней страницы firefox
  systemd.services.tartarus-startpage = {
  description = "Local Python server for Tartarus Startpage";
  after = [ "network.target" ];
  wantedBy = [ "multi-user.target" ];

  serviceConfig = {
    # Укажите точный путь к папке с вашим проектом на NixOS
    ExecStart = "${pkgs.python3}/bin/python3 -m http.server 8080 --bind 127.0.0.1";
    WorkingDirectory = "/home/goto/tartarus-startpage";
    Restart = "always";
    User = "goto"; # Ваше имя пользователя в системе
  };
};

  # --- НАСТРОЙКИ ВИДЕОКАРТЫ NVIDIA ---
  boot.kernelParams = [ 
    "nvidia.NVreg_PreserveVideoMemoryAllocations=1" 
    # Ограничивает выделение хост-памяти драйвером Nvidia для буферов OpenGL/Vulkan
    "nvidia.NVreg_DeviceFileBufferSizeMB=32"
  ];
  services.xserver.videoDrivers = [ "nvidia" ];

  hardware.nvidia = {
    modesetting.enable = true; # Обязательно для Wayland
    
    # КРИТИЧЕСКИЙ ХАК ДЛЯ СНА: Включаем сохранение VRAM
    powerManagement.enable = true; # раньше было false
    powerManagement.finegrained = false;
    
    open = false; # С твоей GTX 1650 строго оставляем false
    nvidiaSettings = true;
    package = config.boot.kernelPackages.nvidiaPackages.stable;
  };

  # Интеграция драйверов Nvidia в аппаратное ускорение программ
  hardware.graphics.enable = true;
  hardware.graphics.enable32Bit = true;


  # Версия состояния системы. Не менять.
  system.stateVersion = "26.05";

  nix.settings.experimental-features = [ "nix-command" "flakes" ];
}
