import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertUpgrade, checksumFor, platforms, qualifyRelease, renderFormula, verifyArchitecture } from './prepare-dtsx.mjs'
const good = { status: 'completed', conclusion: 'success' }
const commit = 'a'.repeat(40)
const sdk = 'Verify normally packed public SDK consumers'
function fixture() {
  const job = (name, steps = []) => ({ ...good, name, steps: steps.map(name => ({ ...good, name })) })
  const run = jobs => ({ ...good, head_sha: commit, jobs })
  return {
    commit,
    release: { tag_name: 'v1.2.3', draft: false, prerelease: false, published_at: '2026-11-07T00:00:00Z', assets: ['checksums.txt', ...platforms.map(platform => `zig-dtsx-${platform}.zip`)].map(name => ({ name, digest: `sha256:${'a'.repeat(64)}`, size: 100, browser_download_url: `https://github.com/stacksjs/dtsx/releases/download/v1.2.3/${name}` })) },
    ci: run([job('Build workspace libraries', [sdk]), job('test', ['Unit Test', 'Run Zig Unit Tests', 'Run Zig Fixture Tests']), job('lint'), job('typecheck'), ...['macos-latest', 'ubuntu-latest', 'windows-latest'].map(os => job(`Source path identity (${os})`))]),
    benchmark: run([job('benchmark')]),
    releaser: run([job('release', [sdk, 'Verify Pantry GitHub Release'])]),
  }
}
test('accepts complete synthetic qualification evidence', () => assert.doesNotThrow(() => qualifyRelease(fixture())))
for (const [name, mutate] of [
  ['old releases without an SDK gate', e => { e.ci.jobs[0].steps = [] }],
  ['SDK failure', e => { e.ci.jobs[0].steps[0].conclusion = 'failure' }],
  ['unrelated source commits', e => { e.releaser.head_sha = 'b'.repeat(40) }],
  ['skipped native fixtures', e => { e.ci.jobs[1].steps[2].conclusion = 'skipped' }],
  ['missing checksums', e => { e.release.assets.shift() }],
  ['duplicate native assets', e => { e.release.assets.push(e.release.assets[1]) }],
  ['foreign asset URLs', e => { e.release.assets[1].browser_download_url = 'https://example.com/binary.zip' }],
  ['drafts', e => { e.release.draft = true }],
  ['failed benchmarks', e => { e.benchmark.conclusion = 'failure' }],
]) test(`rejects ${name}`, () => { const e = fixture(); mutate(e); assert.throws(() => qualifyRelease(e)) })
test('requires exactly one complete checksum line', () => {
  const sha = 'a'.repeat(64), name = 'zig-dtsx-linux-x64.zip'
  assert.equal(checksumFor(`${sha}  ${name}\n`, name), sha)
  for (const text of ['', `${sha} ${name}\n${sha} ${name}`, `short ${name}`, `${sha} ${name} extra`]) assert.throws(() => checksumFor(text, name))
})
test('rejects wrong architecture or library payloads', () => {
  for (const platform of platforms) {
    const bytes = Buffer.alloc(64)
    if (platform.startsWith('linux')) { bytes.set([0x7f, 0x45, 0x4c, 0x46, 2, 1]); bytes.writeUInt16LE(2, 16); bytes.writeUInt16LE(platform.endsWith('arm64') ? 183 : 62, 18) }
    else { bytes.writeUInt32LE(0xfeedfacf); bytes.writeUInt32LE(platform.endsWith('arm64') ? 0x0100000c : 0x01000007, 4); bytes.writeUInt32LE(2, 12) }
    assert.doesNotThrow(() => verifyArchitecture(bytes, platform))
    assert.throws(() => verifyArchitecture(bytes, platform.replace(/arm64|x64$/, platform.endsWith('arm64') ? 'x64' : 'arm64')))
    if (platform.startsWith('darwin')) { bytes.writeUInt32LE(6, 12); assert.throws(() => verifyArchitecture(bytes, platform)) }
  }
})
test('renders a native CLI formula with stdin and project contracts', () => {
  const formula = renderFormula('v1.2.3', Object.fromEntries(platforms.map(platform => [platform, 'a'.repeat(64)])))
  assert.match(formula, /bin.install "zig-dtsx"/)
  assert.match(formula, /pipe_output/)
  assert.match(formula, /--project/)
  assert.match(formula, /\| undefined/)
  assert.doesNotMatch(formula, /^\s*version "/m, 'Homebrew derives the stable version from the immutable release URLs')
  for (const platform of platforms) assert(formula.includes(`url "https://github.com/stacksjs/dtsx/releases/download/v1.2.3/zig-dtsx-${platform}.zip"`))
  assert.doesNotMatch(formula, /depends_on "bun"|install_symlink/)
  assert.throws(() => renderFormula('v1.2.3"; unsafe', {}))
})

 test('refuses duplicate or downgraded deliveries', () => {
  assert.doesNotThrow(() => assertUpgrade('v1.2.3', undefined))
  assert.doesNotThrow(() => assertUpgrade('v1.2.4', '  version "1.2.3"'))
  for (const tag of ['v1.2.3', 'v1.2.2', 'v0.99.99']) assert.throws(() => assertUpgrade(tag, '  version "1.2.3"'))
  assert.throws(() => assertUpgrade('v1.2.4', 'version "1.2.3"\nversion "1.0.0"'))
 })

test('upgrade protection reads all pinned native URLs without an explicit version', () => {
  const formula = platforms.map(platform => `  url "https://github.com/stacksjs/dtsx/releases/download/v1.2.3/zig-dtsx-${platform}.zip"`).join('\n')
  assert.doesNotThrow(() => assertUpgrade('v1.2.4', formula))
  for (const tag of ['v1.2.3', 'v1.2.2', 'v0.99.99']) assert.throws(() => assertUpgrade(tag, formula))
  assert.throws(() => assertUpgrade('v1.2.4', formula.replace('v1.2.3', 'v1.1.3')))
  assert.throws(() => assertUpgrade('v1.2.4', formula.split('\n').slice(1).join('\n')))
  assert.throws(() => assertUpgrade('v1.2.4', `${formula}\n  version "1.1.3"`))
})
