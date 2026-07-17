class Stacks < Formula
  desc "Meet Buddy. The Stacks runtime."
  homepage "https://github.com/stacksjs/stacks"
  version "0.70.113"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-arm64.zip"
      sha256 "1a8b672ec9c645bb93aaa5b634d102a8b77d8260bb1e3c8eb05eef8e5cacae57"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-x64.zip"
      sha256 "3716df1da150170a19d5ce710f9dd6b61a56e9d29fad590d10424ed00916f461"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-arm64.zip"
      sha256 "8254d2e4cbb66a3aa4d93b8defc8dcd56a30edae9765c0672c7264475c0acc70"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-x64.zip"
      sha256 "c6e7aec0a13a8e61d7dacb7e923665e7c12e8a1317c0202024c3c82d0d1393ff"
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
