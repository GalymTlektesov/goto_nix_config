{
  description = "Моя конфигурация NixOS на Flakes";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
    
    # Добавляем репозиторий AAGL как официальный input нашего флейка
    aagl = {
      url = "github:ezKEa/aagl-gtk-on-nix";
      inputs.nixpkgs.follows = "nixpkgs"; # Чтобы он использовал те же пакеты, что и система
    };
  };

  outputs = { self, nixpkgs, aagl, ... }@inputs: {
    nixosConfigurations = {
      nixos = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix
          # Подключаем модуль AAGL прямо здесь, на уровне флейка
          aagl.nixosModules.default
        ];
      };
    };
  };
}