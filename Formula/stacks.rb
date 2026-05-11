class Stacks < Formula
  desc "Meet Buddy. The Stacks runtime."
  homepage "https://github.com/stacksjs/stacks"
  version "0.70.37"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-arm64"
      sha256 "0484196cfc60dbc2b9f8e135fdfc7dcd996f6d80075679f9981652a2507a0a84"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-darwin-x64"
      sha256 "cad0e001a57e3ddb200b60fb704786caaa58fd22813d977902c2b61f10a04999"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-arm64"
      sha256 "a307e33a7bf97930587fce08e693af55d2fbc3a47e4d610f10a3a793862731c6"
    else
      url "https://github.com/stacksjs/stacks/releases/download/v#{version}/buddy-linux-x64"
      sha256 "04ff4adbb530cba80a18222152b897c30812a84010fb1fcb7f01dff5aee78c34"
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