class Stacks < Formula
  desc "Meet Buddy. The Stacks runtime."
  homepage "https://github.com/stacksjs/stacks"
  version "0.75.431"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-arm64.zip"
      sha256 "fd29e8b44f1cef86ff2eead7e966f30b6f16b4e21d5f3fd2505f64f242eafdfc"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-x64.zip"
      sha256 "3e9d914dfc0cd6af01add5b1a848f404de36b982cd169c0b1541a3cf7a78fa75"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-arm64.zip"
      sha256 "7ea697b6e69d41a41ca4f787ecbc801c46f96ea802f5d59a90c0ea644395017e"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-x64.zip"
      sha256 "8c3ef819decba4d691f5b1773057e27be9dd96e3d6b46b1440da021eec67da99"
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
