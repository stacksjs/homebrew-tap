class Stacks < Formula
  desc "Meet Buddy. The Stacks runtime."
  homepage "https://github.com/stacksjs/stacks"
  version "0.72.24"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-arm64.zip"
      sha256 "f59ff9ad73dbd011bfa0750ccd10654500c22b50e9317be08ecdb69ce8975ac7"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-x64.zip"
      sha256 "b04e12cdd5df6b2804d97179959db2d8ba81e64528ca59d05a89b86dbfdd2516"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-arm64.zip"
      sha256 "c89cb04057b3b34b51bdcd5932a54b6ab2f2c51c83e6f3d5429edf070b7d089b"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-x64.zip"
      sha256 "7e4b3024def37d41a302eb477eb3566ca800258805d44a61c573ccb9d9261de8"
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
