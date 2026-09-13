{ config, pkgs, ... }:

{
  	# --- НАСТРОЙКИ ЗВУКА И AUDIO ---
	security.rtkit.enable = true;
	services.pulseaudio.enable = false;
	services.pipewire = {
    	enable = true;
    	alsa.enable = true;
    	alsa.support32Bit = true;
    	pulse.enable = true;
    	jack.enable = true;
  	};

  	 # --- НАСТРОЙКИ ВИДЕОКАРТЫ NVIDIA ---
	boot.kernelParams = [ 
    	"scsi_mod.use_blk_mq=1"
    	"elevator=bfq"
    	"nvidia.NVreg_PreserveVideoMemoryAllocations=1" 
    	"nvidia.NVreg_DeviceFileBufferSizeMB=32"
    ];
    services.xserver.videoDrivers = [ "nvidia" ];

    hardware.nvidia = {
    	modesetting.enable = true;
    
    	powerManagement.enable = true;
    	powerManagement.finegrained = false;
    
    	open = true;
    	nvidiaSettings = true;
    	package = config.boot.kernelPackages.nvidiaPackages.stable;
  	};

	hardware.graphics = {
  		enable = true;
  		enable32Bit = true;
  		extraPackages = with pkgs; [
    		nvidia-vaapi-driver
  		];
  	};
}