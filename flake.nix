{
    description = "AniLog development shell";

    inputs = {
        nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    };

    outputs =
        { self, nixpkgs }:
        let
            systems = [
                "x86_64-linux"
                "aarch64-linux"
            ];
            forAllSystems =
                f:
                nixpkgs.lib.genAttrs systems (
                    system:
                    f {
                        pkgs = import nixpkgs { inherit system; };
                    }
                );
        in
        {
            devShells = forAllSystems (
                { pkgs }:
                {
                    default = pkgs.mkShell {
                        packages = with pkgs; [
                            bun
                            nodejs_22
                            rustup
                            pkg-config
                            gcc
                            clang
                            curl
                            wget
                            file
                            openssl
                            webkitgtk_4_1
                            glib
                            gtk3
                            libsoup_3
                            libayatana-appindicator
                            librsvg
                            xdotool
                        ];

                        LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
                            pkgs.webkitgtk_4_1
                            pkgs.glib
                            pkgs.gtk3
                            pkgs.libsoup_3
                            pkgs.libayatana-appindicator
                            pkgs.librsvg
                            pkgs.openssl
                        ];

                        shellHook = ''
                            export OPENSSL_DIR="${pkgs.openssl.dev}"
                            export OPENSSL_LIB_DIR="${pkgs.openssl.out}/lib"
                            export OPENSSL_INCLUDE_DIR="${pkgs.openssl.dev}/include"

                            echo "AniLog dev shell ready."
                        '';
                    };
                }
            );
        };
}
