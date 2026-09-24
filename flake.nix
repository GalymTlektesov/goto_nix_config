{
  description = "Моя конфигурация NixOS на Flakes";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
    
    # Добавляем репозиторий AAGL как официальный input нашего флейка
    aagl = {
      url = "github:ezKEa/aagl-gtk-on-nix";
      inputs.nixpkgs.follows = "nixpkgs"; # Чтобы он использовал те же пакеты, что и система
    };

    gslapper = {
      url = "github:Nomadcxx/gSlapper";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    caelestia-shell = {
      url = "github:caelestia-dots/shell";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    zen-browser = {
      url = "github:youwen5/zen-browser-flake";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nix-cachyos-kernel = {
      url = "github:xddxdd/nix-cachyos-kernel/release";
    };

    serpantinum.url = "github:ilyamiro/serpantinum";
  };

  outputs = { self, nixpkgs, aagl, gslapper, caelestia-shell, 
    serpantinum, nix-cachyos-kernel, ... }@inputs: {
    nixosConfigurations = {
      nixos = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        specialArgs = { inherit serpantinum; inherit inputs; };
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix
          ./modules/packages.nix
          # Подключаем модуль AAGL прямо здесь, на уровне флейка
          aagl.nixosModules.default
          serpantinum.nixosModules.default

          ({ pkgs, ... }: {
            nixpkgs.overlays = [
              nix-cachyos-kernel.overlays.pinned
              
              (final: prev: {
                gslapper = gslapper.packages.${pkgs.system}.default;
                caelestia-shell = caelestia-shell.packages.${prev.system}.with-cli;
              })
            ];
          })
        ];
      };
    };
  };
}