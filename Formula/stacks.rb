class Stacks < Formula
  desc "Meet Buddy. The Stacks runtime."
  homepage "https://github.com/stacksjs/stacks"
  version "0.75.403"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-arm64.zip"
      sha256 "35e958a71f5716b682fada1011b8471693d565e3876558a5031ee2e849565c56"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-x64.zip"
      sha256 "e0bcd4223fe107bfc00e94031da005ca9517ea8c382f39e74c281cb81fd4d63b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-arm64.zip"
      sha256 "21136b8193507d370590bf49c5a01392f628caa15b8c5e17184388446d41411b"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-x64.zip"
      sha256 "4a6812c2d03bb2e4221441fb7cee081eafe18318d7b33916591980b361d3a7c4"
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
