{
  description = "Fluent Reader - Modern desktop RSS reader";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        # Electron dependencies for Linux
        electronDeps = with pkgs; [
          alsa-lib
          at-spi2-atk
          at-spi2-core
          cairo
          cups
          dbus
          expat
          gdk-pixbuf
          glib
          gtk3
          libdrm
          libnotify
          libsecret
          libuuid
          libxkbcommon
          mesa
          nspr
          nss
          pango
          systemd
          xorg.libX11
          xorg.libxcb
          xorg.libXcomposite
          xorg.libXdamage
          xorg.libXext
          xorg.libXfixes
          xorg.libXrandr
          xorg.libXtst
        ];

        desktopItem = pkgs.makeDesktopItem {
          name = "fluent-reader";
          desktopName = "Fluent Reader";
          comment = "Modern desktop RSS reader";
          exec = "fluent-reader";
          icon = "fluent-reader";
          categories = [ "Network" "News" "Feed" ];
        };

        buildInputs = with pkgs; [
          nodejs_20
          electron
          python3
          pkg-config
          pixman
          cairo
          pango
        ] ++ lib.optionals pkgs.stdenv.isLinux electronDeps;

        nativeBuildInputs = with pkgs; [
          makeWrapper
        ];
      in
      {
        devShells.default = pkgs.mkShell {
          inherit buildInputs nativeBuildInputs;

          shellHook = ''
            echo "Fluent Reader development environment"
            echo "Node.js version: $(node --version)"
            echo "npm version: $(npm --version)"
            echo ""
            echo "Available commands:"
            echo "  npm install        - Install dependencies"
            echo "  npm run build      - Build the project"
            echo "  npm run start      - Build and run the app"
            echo "  npm run electron   - Run electron directly"
            echo ""

            export ELECTRON_SKIP_BINARY_DOWNLOAD=1

            ${pkgs.lib.optionalString pkgs.stdenv.isLinux ''
              export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath electronDeps}:$LD_LIBRARY_PATH"
              export NIXOS_OZONE_WL="1"
            ''}
          '';
        };

        packages.default = pkgs.buildNpmPackage {
          pname = "fluent-reader";
          version = "1.1.4";

          src = ./.;

          # Update with: nix-prefetch -E "with import <nixpkgs> {}; buildNpmPackage.npmDeps"
          npmDepsHash = "sha256-rSVrKbD+cn2epLjaK3GIGjXFyG6j2NACVhOXa5fOzHQ=";

          inherit buildInputs;
          nativeBuildInputs = nativeBuildInputs ++ [ pkgs.nodejs_20 ];

          dontNpmInstall = false;

          ELECTRON_SKIP_BINARY_DOWNLOAD = "1";

          buildPhase = ''
            export HOME=$TMPDIR
            export ELECTRON_SKIP_BINARY_DOWNLOAD=1
            export NODE_OPTIONS=--openssl-legacy-provider
            npx electron-builder install-app-deps || true
            npm run build
          '';

          installPhase = ''
            mkdir -p $out/lib/fluent-reader
            cp -r dist node_modules package.json $out/lib/fluent-reader/

            mkdir -p $out/bin
            makeWrapper ${pkgs.electron}/bin/electron $out/bin/fluent-reader \
              --add-flags $out/lib/fluent-reader/dist/electron.js \
              --set NODE_ENV production \
              ${pkgs.lib.optionalString pkgs.stdenv.isLinux ''
                --prefix LD_LIBRARY_PATH : "${pkgs.lib.makeLibraryPath electronDeps}"
              ''}

            mkdir -p $out/share
            cp -r ${desktopItem}/share/applications $out/share/
            install -Dm444 ${./build/icon.png} \
              $out/share/icons/hicolor/256x256/apps/fluent-reader.png
          '';

          meta = with pkgs.lib; {
            description = "Modern desktop RSS reader";
            homepage = "https://github.com/yang991178/fluent-reader";
            license = licenses.bsd3;
            platforms = platforms.linux ++ platforms.darwin;
          };
        };
      }
    );
}
