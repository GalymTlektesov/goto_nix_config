{ pkgs, ... }:

{
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
    	packages = with pkgs; [kdePackages.kate];
  	};

  	users.defaultUserShell = pkgs.zsh;

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

}