{ pkgs, ... }:

{

  	programs.anime-game-launcher.enable = true; # genshin
    programs.honkers-railway-launcher.enable = true; # hsr
  	programs.sleepy-launcher.enable = true; # zzz

  	# Включаем GameMode
  	programs.gamemode.enable = true;

  	# Включаем Steam
  	programs.steam = {
    	enable = true;
    	remotePlay.openFirewall = true;
    	dedicatedServer.openFirewall = true;
  	};

  	# Снимаем системные ограничения на количество открытых файлов и квоты памяти
  	security.pam.loginLimits = [
    	{ domain = "*"; type = "-"; item = "nofile"; value = "524288"; }
    	{ domain = "*"; type = "-"; item = "memlock"; value = "unlimited"; }
  	];

  	# Включаем zRam
  	zramSwap = {
    	enable = true;
    	algorithm = "zstd";
    	memoryPercent = 50;  # Swap
  	};

  	# Настройки для ядра
  	boot.kernel.sysctl = {
    	"vm.max_map_count" = 2147483642;
    	"vm.swappiness" = 100;
    	"vm.vfs_cache_pressure" = 500;
    	"vm.dirty_background_ratio" = 5;
    	"vm.dirty_ratio" = 10;
  	};
}