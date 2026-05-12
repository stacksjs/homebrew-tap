class Stacks < Formula
  desc "Meet Buddy. The Stacks runtime."
  homepage "https://github.com/stacksjs/stacks"
  version "0.70.43"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-arm64"
      sha256 "d0e3dc44b9da61f2109c1aeac48d43f0bd825b0ef599784433ff0589ece46565"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-x64"
      sha256 "a4b7c67150fb7481bc3dea75cd25bcfd6d535fc8a00698915f6b34c3661d7b16"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-arm64"
      sha256 "9b8009259371dd440e46fcc817f8f6d48fc7ae6730fbe42b1eb76321dd201992"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-x64"
      sha256 "16e6bf468eb98d1640dff80dd0c7c963b0d478ef4d84550d855446623b56f1af"
    end
  end

  def install
    binary_name = Hardware::CPU.arm? ?
      (OS.mac? ? "buddy-darwin-arm64" : "buddy-linux-arm64") :
      (OS.mac? ? "buddy-darwin-x64" : "buddy-linux-x64")

    bin.install binary_name => "stacks"
    bin.install_symlink "stacks" => "stx"
    bin.install_symlink "stacks" => "buddy"
    bin.install_symlink "stacks" => "bud"
  end

  test do
    assert_match "Stacks", shell_output("#{bin}/stacks --version")
  end
end