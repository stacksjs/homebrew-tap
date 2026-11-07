# Homebrew Tap

This repo is managed & automated via the main Stacks codebase.

DTSX delivery is prepared by the **Qualify and deliver DTSX** workflow. Dispatch it
with a stable DTSX release tag after that exact source commit passes CI, the
packed public SDK consumers, benchmarks, and release verification. The workflow
checks the four native archive digests and architectures, then installs and tests
the candidate using real Homebrew on Linux and macOS before committing
`Formula/dtsx.rb` and its qualification receipt.

The formula installs `zig-dtsx`. It exercises stdin declaration generation and a
nested project build, including a default before a required parameter. It does
not require the Bun-based JavaScript CLI. Native functional qualification covers
the runner architectures; all four published archives receive digest, layout,
and executable-header validation.

No DTSX formula is published until a qualifying release exists. Existing release
v0.11.31 is intentionally ineligible. Related work:
[Homebrew delivery](https://github.com/stacksjs/dtsx/issues/23),
[Pantry native delivery](https://github.com/stacksjs/dtsx/issues/24), and
[public SDK qualification](https://github.com/stacksjs/dtsx/issues/3138).

Run the source contract tests with `node --test scripts/prepare-dtsx.test.mjs`.
