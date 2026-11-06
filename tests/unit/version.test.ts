import { describe, expect, it } from 'vitest'
import { version } from '../../src/index.ts'

describe('version', () => {
  it('matches the package version', async () => {
    const pkg = (await import('../../package.json', { with: { type: 'json' } })).default
    expect(version).toBe(pkg.version)
  })
})
