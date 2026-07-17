# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running ‘nixos-help’).

{ config, pkgs, ... }:

{
  imports =
    [
      ./hardware-configuration.nix
      ./hyprland.nix
    ];

  # для кодека в OBS
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

  # Переключаем систему на оптимизированное игровое ядро Zen
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

  i18n.supportedLocales = [
    "en_US.UTF-8/UTF-8"
    "ru_RU.UTF-8/UTF-8"
  ];

  i18n.extraLocaleSettings = {
    LC_CTYPE = "ru_RU.UTF-8"; 
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
    layout = "us,ru";
    options = "grp:win_space_toggle";
    variant = "";
  };

  console.useXkbConfig = true;

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

  # Список программ для ВСЕХ пользователей системы
  environment.systemPackages = with pkgs; [
    vesktop 
    krita 
    fastfetch
    git
    brightnessctl
    evtest
    vlc
    ffmpeg-full
    cmatrix
    btop
    hollywood
    cava
    kdePackages.qtwebsockets
    kdePackages.qtstyleplugin-kvantum
    obsidian 
    foliate
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
    oh-my-posh

    #python3 с модулем websockets
    (python3.withPackages (ps: with ps; [
      websockets
    ]))
  ];

  #Kvantum для Qt
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

  programs.anime-game-launcher.enable = true; # genshin
  programs.honkers-railway-launcher.enable = true; # hsr
  programs.sleepy-launcher.enable = true; # zzz

  # Включаем GameMode
  programs.gamemode.enable = true;

  # Снимаем системные ограничения на количество открытых файлов и квоты памяти
  security.pam.loginLimits = [
    { domain = "*"; type = "-"; item = "nofile"; value = "524288"; }
    { domain = "*"; type = "-"; item = "memlock"; value = "unlimited"; }
  ];

  # Включаем подушку безопасности через zRam
  zramSwap = {
    enable = true;
    algorithm = "zstd";
    memoryPercent = 50;  # Swap
  };

  # Настройки для Zen
  boot.kernel.sysctl = {
    "vm.max_map_count" = 2147483642;
    "vm.swappiness" = 100;
    "vm.vfs_cache_pressure" = 500;
  };


  # Включаем Steam
  programs.steam = {
    enable = true;
    remotePlay.openFirewall = true;
    dedicatedServer.openFirewall = true;
  };


  # Настраеваем ZSH
  programs.zsh = {
    enable = true;
    enableCompletion = true;
    autosuggestions.enable = true;
    syntaxHighlighting.enable = true;

    # автоматизируем команды
    shellAliases = {
      rebuild = "sudo nixos-rebuild switch --flake '/etc/nixos/#nixos'";
      nixrebuild = "cd /etc/nixos && git add . && sudo nixos-rebuild switch --flake '.#nixos' && cd -";
    };

    # Oh My Zsh
    ohMyZsh = {
      enable = true;
      plugins = [ "git" "sudo" ];
    };

    # То что будет работать при запуске терминала
    interactiveShellInit = ''
      eval "$(oh-my-posh init zsh --config ${pkgs.oh-my-posh}/share/oh-my-posh/themes/clean-detailed.omp.json)"
      ${pkgs.fastfetch}/bin/fastfetch
    '';
  };

  # Шрифты для терминала
  fonts.packages = [
    pkgs.fira-code
    pkgs.fira-code-symbols
    pkgs.nerd-fonts.fira-code
  ];

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
  

  # локальный север для домашней страницы tartarus-startpage
  systemd.services.tartarus-startpage = {
  description = "Local Python server for Tartarus Startpage";
  after = [ "network.target" ];
  wantedBy = [ "multi-user.target" ];

  serviceConfig = {
    ExecStart = "${pkgs.python3}/bin/python3 -m http.server 8080 --bind 127.0.0.1";
    WorkingDirectory = "/home/goto/tartarus-startpage";
    Restart = "always";
    User = "goto";
  };
};

  # --- НАСТРОЙКИ ВИДЕОКАРТЫ NVIDIA ---
  boot.kernelParams = [ 
    "nvidia.NVreg_PreserveVideoMemoryAllocations=1" 
    "nvidia.NVreg_DeviceFileBufferSizeMB=32"
  ];
  services.xserver.videoDrivers = [ "nvidia" ];

  hardware.nvidia = {
    modesetting.enable = true;
    
    powerManagement.enable = true; # Позволит сохранять VRAM, чтобы после спящего режима, видеокарта работала корректно
    powerManagement.finegrained = false;
    
    open = false;
    nvidiaSettings = true;
    package = config.boot.kernelPackages.nvidiaPackages.stable;
  };

  # Интеграция драйверов Nvidia в аппаратное ускорение программ
  hardware.graphics.enable = true;
  hardware.graphics.enable32Bit = true;


  # Версия состояния системы. Не менять.
  system.stateVersion = "26.05";

  #Включаем flakes
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
}
