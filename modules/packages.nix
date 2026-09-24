{ pkgs, serpantinum, inputs, ... }:

{
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
    	btop
    	cava
    	kdePackages.qtwebsockets
    	kdePackages.qtstyleplugin-kvantum
    	obsidian
    	obs-studio
    	sublime4
    	kdePackages.kdenlive
    	pkgs.yandex-music
    	pkgs.godot
    	pkgs.blender
    	pkgs.jetbrains.pycharm
    	lutris
    	temurin-bin
    	pkgs.onlyoffice-desktopeditors
    	pkgs.nvtopPackages.nvidia
    	oh-my-posh
    	pkgs.thunar
    	pkgs.tumbler
    	nwg-look
    	pkgs.sweet
    	figlet
    	pkgs.nuclear
    	gnome-calculator
    	glib
    	gsettings-desktop-schemas
    	baobab
    	foliate
    	lavat
    	cmatrix
    	nwg-dock-hyprland
    	zed-editor
    	inputs.zen-browser.packages.${pkgs.system}.default
    	pkgs.pandoc
    	telegram-desktop

    	quickshell
    	qt6.qtdeclarative
  		qt6.qt5compat
  		qt6.qtsvg
  		qt6.qtpositioning
  		qt6.qtwebengine
  		kdePackages.kirigami
  		kdePackages.syntax-highlighting
  		heroic

  		papirus-icon-theme

    	#python3 с модулем websockets
    	(python3.withPackages (ps: with ps; [
      		websockets
    	]))


    	caelestia-shell

    	serpantinum.packages.${pkgs.stdenv.hostPlatform.system}.default
  	];

  	programs.serpantinum.enable = true;

  	fonts.packages = with pkgs; [
  		nerd-fonts.jetbrains-mono
  		nerd-fonts.fira-code
  		nerd-fonts.hack
  		nerd-fonts.iosevka
  		material-symbols
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
    	__GL_SHADER_DISK_CACHE = "1";
  		__GL_SHADER_DISK_CACHE_SKIP_CLEANUP = "1";
  		__GL_SHADER_DISK_CACHE_SIZE = "10737418240"; # 10 Гб
  		__GL_SHADER_DISK_CACHE_PATH = "/home/YOUR_USER/.cache/nv_shaders";
  		DXVK_STATE_CACHE_PATH = "/home/YOUR_USER/.cache/dxvk";	
  	};
}