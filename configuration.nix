# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running ‘nixos-help’).

{ config, pkgs, ... }:

{
    imports =
    [
        ./hardware-configuration.nix
        ./hyprland.nix
        ./modules/packages.nix
        ./modules/gaming.nix
        ./modules/hardware.nix
        ./modules/system.nix
    ];

    # Bootloader.
    boot.loader.systemd-boot.enable = true;
    boot.loader.efi.canTouchEfiVariables = true;
    # boot.initrd.supportedFilesystems = [ "vfat" "btrfs" ]; # Оставляем только самое нужное для старта
    boot.initrd.compressor = "gzip -9";# сжатие 
    boot.initrd.includeDefaultModules = false;
    boot.initrd.kernelModules = [ "nvme" "btrfs" "vfat" "hid" "usbhid" ];

    # Переключаем систему на оптимизированное ядро
    #boot.kernelPackages = pkgs.linuxPackages_xanmod;
    boot.kernelPackages = pkgs.linuxPackages_zen;

    # Install firefox.
    programs.firefox.enable = true;

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

    # Версия состояния системы. Не менять.
    system.stateVersion = "26.05";
    #Включаем flakes
    nix.settings.experimental-features = [ "nix-command" "flakes" ];
}
