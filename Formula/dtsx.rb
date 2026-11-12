class Dtsx < Formula
  desc "Generate TypeScript declarations with the native DTSX CLI"
  homepage "https://github.com/stacksjs/dtsx"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/dtsx/releases/download/v0.11.52/zig-dtsx-darwin-arm64.zip"
      sha256 "76b1e7a07efa1649e0835529dd353f3b083c9f99583c89e03a89bd215133db2b"
    else
      url "https://github.com/stacksjs/dtsx/releases/download/v0.11.52/zig-dtsx-darwin-x64.zip"
      sha256 "be944248c491bc088ac326e2d1dcbef71f22954ae3b5433d7290ded27ce615c7"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/dtsx/releases/download/v0.11.52/zig-dtsx-linux-arm64.zip"
      sha256 "f01d78f32531b79009c3328864004615f69c442ed16c8b76250c88615403ab5f"
    else
      url "https://github.com/stacksjs/dtsx/releases/download/v0.11.52/zig-dtsx-linux-x64.zip"
      sha256 "a9b3f1ff295c3f31bf8a0aa00cfa0300c0cadfbed41bc3b4cf2c2fc91ad3b55a"
    end
  end

  def install
    bin.install "zig-dtsx"
  end

  test do
    output = pipe_output("#{bin}/zig-dtsx", "export const answer = 42;", 0)
    assert_match "export declare const answer: 42;", output
    (testpath/"src/nested").mkpath
    (testpath/"src/nested/index.ts").write "export function sum(first: number = 1, last: number): number { return first + last }"
    system bin/"zig-dtsx", "--project", testpath/"src", "--outdir", testpath/"types"
    declaration = (testpath/"types/nested/index.d.ts").read
    assert_match "sum(first:", declaration
    assert_match "| undefined", declaration
    assert_match "last: number", declaration
  end
end
