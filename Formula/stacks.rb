class Stacks < Formula
  desc "Meet Buddy. The Stacks runtime."
  homepage "https://github.com/stacksjs/stacks"
  version "0.74.27"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-arm64.zip"
      sha256 "bfbe6a35c0b09efa424750b08c5e9b9282cdf06effbc87614dc87cbe436ce132"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-x64.zip"
      sha256 "f7d2cc2e68deaa265ab96f04b4050b9b08f4928f9f4b82d157e71594a451e01b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-arm64.zip"
      sha256 "6cbc2465c360bf4276e8f6f60d669859a1dc98da66e9fe1f9f47c660ee7a861a"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-x64.zip"
      sha256 "419eeec9b26fdef556ff3013648cbaa2c8e5bd51d64ca754ce090b6d43244d52"
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
