import test from 'node:test'
import assert from 'node:assert/strict'
import { getFileToolsRuntimeStatus } from '../src/features/file-tools/api/file-tools-runtime-status.js'

test('runtime status reports EPUB converter as deployment required when unset', () => {
    const previous = process.env.EPUB_TO_MOBI_BINARY_PATH
    delete process.env.EPUB_TO_MOBI_BINARY_PATH

    try {
        const status = getFileToolsRuntimeStatus()
        assert.equal(status.tools['epub-to-mobi'].available, false)
        assert.equal(status.tools['epub-to-mobi'].status, 'deployment_required')
        assert.equal(status.tools['epub-to-mobi'].runtime, null)
    } finally {
        if (previous !== undefined) {
            process.env.EPUB_TO_MOBI_BINARY_PATH = previous
        }
    }
})

test('runtime status reports RAR tool as limited but available', () => {
    const status = getFileToolsRuntimeStatus()
    assert.equal(status.tools['rar-to-zip'].available, true)
    assert.equal(status.tools['rar-to-zip'].status, 'limited')
    assert.deepEqual(status.tools['rar-to-zip'].limits, [
        'Single-volume RAR only',
        'No password-protected archives',
        'No split or multipart archives',
    ])
})
