import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = 'stacksjs/dtsx'
export const platforms = ['darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64']
const sdkStep = 'Verify normally packed public SDK consumers'
const ciJobs = ['Build workspace libraries', 'test', 'lint', 'typecheck', ...['macos-latest', 'ubuntu-latest', 'windows-latest'].map(os => `Source path identity (${os})`)]
function completed(value) { assert.equal(value.status, 'completed'); assert.equal(value.conclusion, 'success') }
function step(job, name) { const found = job.steps.filter(item => item.name === name); assert.equal(found.length, 1, `Missing unique qualification step: ${name}`); completed(found[0]) }

/** Validate actual workflow evidence before downloading or proposing a formula. */
export function qualifyRelease({ release, commit, ci, benchmark, releaser }) {
  assert.match(release.tag_name, /^v\d+\.\d+\.\d+$/)
  assert.equal(release.draft, false)
  assert.equal(release.prerelease, false)
  assert(release.published_at)
  assert.match(commit, /^[a-f0-9]{40}$/)
  for (const run of [ci, benchmark, releaser]) { completed(run); assert.equal(run.head_sha, commit, 'Qualification must belong to the released source commit') }
  for (const name of ciJobs) {
    const jobs = ci.jobs.filter(job => job.name === name)
    assert.equal(jobs.length, 1, `Missing unique CI job: ${name}`)
    completed(jobs[0])
  }
  step(ci.jobs.find(job => job.name === 'Build workspace libraries'), sdkStep)
  const unit = ci.jobs.find(job => job.name === 'test')
  for (const name of ['Unit Test', 'Run Zig Unit Tests', 'Run Zig Fixture Tests']) step(unit, name)
  assert(benchmark.jobs.length > 0)
  for (const job of benchmark.jobs) completed(job)
  const releaseJobs = releaser.jobs.filter(job => job.name === 'release')
  assert.equal(releaseJobs.length, 1)
  completed(releaseJobs[0])
  step(releaseJobs[0], sdkStep)
  step(releaseJobs[0], 'Verify Pantry GitHub Release')
  for (const name of ['checksums.txt', ...platforms.map(platform => `zig-dtsx-${platform}.zip`)]) {
    const assets = release.assets.filter(asset => asset.name === name)
    assert.equal(assets.length, 1, `Missing unique asset: ${name}`)
    assert.match(assets[0].digest, /^sha256:[a-f0-9]{64}$/)
    assert.equal(assets[0].browser_download_url, `https://github.com/${repository}/releases/download/${release.tag_name}/${name}`)
    assert(assets[0].size > 0 && assets[0].size <= 16 * 1024 * 1024)
  }
}

export function assertUpgrade(tag, previous) {
  assert.match(tag, /^v\d+\.\d+\.\d+$/)
  if (previous === undefined) return
  const versions = [...previous.matchAll(/^\s*version "(\d+\.\d+\.\d+)"$/gm)]
  const urls = [...previous.matchAll(/^\s*url "https:\/\/github\.com\/stacksjs\/dtsx\/releases\/download\/v(\d+\.\d+\.\d+)\/zig-dtsx-(darwin-arm64|darwin-x64|linux-arm64|linux-x64)\.zip"$/gm)]
  assert(versions.length <= 1, 'Existing formula must not declare multiple versions')
  if (urls.length > 0) {
    assert.equal(urls.length, platforms.length, 'All native platforms must have pinned URLs')
    assert.equal(new Set(urls.map(match => match[2])).size, platforms.length, 'Each native platform must appear once')
  }
  const stable = new Set([...versions.map(match => match[1]), ...urls.map(match => match[1])])
  assert.equal(stable.size, 1, 'Existing formula must have one consistent stable version')
  assert(versions.length === 1 || urls.length === platforms.length)
  const requested = tag.slice(1).split('.').map(BigInt)
  const installed = [...stable][0].split('.').map(BigInt)
  const index = requested.findIndex((part, i) => part !== installed[i])
  assert(index >= 0 && requested[index] > installed[index], 'Formula delivery must advance its current version')
}

export function checksumFor(checksums, asset) {
  const matches = checksums.trim().split(/\r?\n/).map(line => line.trim().split(/\s+/)).filter(fields => fields[1]?.replace(/^\*/, '') === asset)
  assert.equal(matches.length, 1, `Missing unique checksum: ${asset}`)
  assert.equal(matches[0].length, 2)
  assert.match(matches[0][0], /^[a-fA-F0-9]{64}$/)
  return matches[0][0].toLowerCase()
}

export function verifyArchitecture(bytes, platform) {
  assert(platforms.includes(platform))
  assert(bytes.length >= 64, 'Truncated executable header')
  if (platform.startsWith('linux-')) {
    assert.deepEqual([...bytes.subarray(0, 6)], [0x7f, 0x45, 0x4c, 0x46, 2, 1], 'Expected a 64-bit little-endian ELF')
    assert([2, 3].includes(bytes.readUInt16LE(16)), 'Expected an executable or PIE')
    assert.equal(bytes.readUInt16LE(18), platform.endsWith('arm64') ? 183 : 62)
  } else {
    assert.equal(bytes.readUInt32LE(0), 0xfeedfacf, 'Expected a 64-bit Mach-O')
    assert.equal(bytes.readUInt32LE(4), platform.endsWith('arm64') ? 0x0100000c : 0x01000007)
    assert.equal(bytes.readUInt32LE(12), 2, 'Expected a Mach-O executable')
  }
}

export function renderFormula(tag, digests) {
  assert.match(tag, /^v\d+\.\d+\.\d+$/)
  for (const platform of platforms) assert.match(digests[platform], /^[a-f0-9]{64}$/)
  return `class Dtsx < Formula
  desc "Generate TypeScript declarations with the native DTSX CLI"
  homepage "https://github.com/stacksjs/dtsx"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/dtsx/releases/download/${tag}/zig-dtsx-darwin-arm64.zip"
      sha256 "${digests['darwin-arm64']}"
    else
      url "https://github.com/stacksjs/dtsx/releases/download/${tag}/zig-dtsx-darwin-x64.zip"
      sha256 "${digests['darwin-x64']}"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/stacksjs/dtsx/releases/download/${tag}/zig-dtsx-linux-arm64.zip"
      sha256 "${digests['linux-arm64']}"
    else
      url "https://github.com/stacksjs/dtsx/releases/download/${tag}/zig-dtsx-linux-x64.zip"
      sha256 "${digests['linux-x64']}"
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
`
}

function gh(...args) { return execFileSync('gh', args, { encoding: 'utf8', timeout: 60_000, maxBuffer: 16 * 1024 * 1024 }) }
function api(path) { return JSON.parse(gh('api', `repos/${repository}/${path}`)) }
function runFor(workflow, commit) {
  const runs = api(`actions/workflows/${workflow}/runs?head_sha=${commit}&per_page=100`).workflow_runs
  assert(runs.length > 0, `No qualification run for ${workflow} at ${commit}`)
  const run = runs.sort((a, b) => b.run_number - a.run_number)[0]
  const pages = JSON.parse(gh('api', '--paginate', '--slurp', `repos/${repository}/actions/runs/${run.id}/jobs?per_page=100`))
  return { ...run, jobs: pages.flatMap(page => page.jobs) }
}
function tagCommit(tag) {
  let object = api(`git/ref/tags/${tag}`).object
  for (let depth = 0; object.type === 'tag' && depth < 4; depth++) object = api(`git/tags/${object.sha}`).object
  assert.equal(object.type, 'commit')
  return object.sha
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function prepare(tag, output) {
  assertUpgrade(tag, existsSync('Formula/dtsx.rb') ? readFileSync('Formula/dtsx.rb', 'utf8') : undefined)
  const release = api(`releases/tags/${tag}`)
  assert.equal(release.tag_name, tag)
  const commit = tagCommit(tag)
  const evidence = { release, commit, ci: runFor('ci.yml', commit), benchmark: runFor('benchmark.yml', commit), releaser: runFor('release.yml', commit) }
  qualifyRelease(evidence)
  const assetDirectory = resolve(output, 'assets')
  mkdirSync(assetDirectory, { recursive: true })
  for (const name of ['checksums.txt', ...platforms.map(platform => `zig-dtsx-${platform}.zip`)]) {
    gh('release', 'download', tag, '--repo', repository, '--pattern', name, '--dir', assetDirectory)
    const bytes = readFileSync(resolve(assetDirectory, name))
    const asset = release.assets.find(item => item.name === name)
    assert.equal(bytes.length, asset.size)
    assert.equal(`sha256:${sha256(bytes)}`, asset.digest)
  }
  const checksums = readFileSync(resolve(assetDirectory, 'checksums.txt'), 'utf8')
  const digests = {}
  for (const platform of platforms) {
    const name = `zig-dtsx-${platform}.zip`
    const archive = resolve(assetDirectory, name)
    const bytes = readFileSync(archive)
    digests[platform] = checksumFor(checksums, name)
    assert.equal(sha256(bytes), digests[platform])
    const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8', timeout: 4000 }).trim().split(/\r?\n/)
    assert.deepEqual(entries, ['zig-dtsx'], 'Each native archive must contain only its intended executable')
    const binary = execFileSync('unzip', ['-p', archive, 'zig-dtsx'], { timeout: 4000, maxBuffer: 64 * 1024 * 1024 })
    verifyArchitecture(binary, platform)
  }
  mkdirSync(resolve(output, 'Formula'), { recursive: true })
  writeFileSync(resolve(output, 'Formula/dtsx.rb'), renderFormula(tag, digests))
  writeFileSync(resolve(output, 'qualification.json'), JSON.stringify({ repository, tag, commit, preparedAt: new Date().toISOString(), workflows: [evidence.ci, evidence.benchmark, evidence.releaser].map(run => ({ id: run.id, attempt: run.run_attempt, url: run.html_url, headSha: run.head_sha })), digests }, null, 2) + '\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  assert.equal(args[0], '--tag')
  assert.equal(args[2], '--out')
  assert.equal(args.length, 4)
  prepare(args[1], args[3])
}
