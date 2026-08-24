{ pkgs, ... }:

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
    	pkgs.docker
    	pkgs.jetbrains.pycharm
    	pkgs.vscode
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
    	gslapper

    	#python3 с модулем websockets
    	(python3.withPackages (ps: with ps; [
      		websockets
    	]))
  	];

  	fonts.packages = with pkgs; [
  		nerd-fonts.jetbrains-mono
  		nerd-fonts.fira-code
  		nerd-fonts.hack
  		nerd-fonts.iosevka
	];


  	#Kvantum для Qt
  	qt = {
    	enable = true;
    	style = "kvantum";
  	};

  	services.flatpak.enable = true;
  	virtualisation.waydroid.enable = true;

  	environment.sessionVariables = {
    	QML2_IMPORT_PATH = [
      		"${pkgs.kdePackages.qtwebsockets}/lib/qt-6/qml"
      		"${pkgs.kdePackages.qtwebsockets}/share/qt-6/qml"
    	];
	};
}