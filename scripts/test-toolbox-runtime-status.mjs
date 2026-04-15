import test from 'node:test'
import assert from 'node:assert/strict'
import { getToolboxRuntimeStatus } from '../src/features/toolbox/api/toolbox-runtime-status.js'
import {
    createRuntimeVerificationFailure,
    normalizeToolRuntimeStatus,
} from '../src/features/toolbox/core/toolRuntimeStatus.js'
import { RUNTIME_VERIFIED_TOOL_IDS } from '../src/features/toolbox/core/toolMetadata.js'

test('runtime status reports EPUB converter as deployment required when unset', () => {
    const previous = process.env.EPUB_TO_MOBI_BINARY_PATH
    delete process.env.EPUB_TO_MOBI_BINARY_PATH

    try {
        const status = getToolboxRuntimeStatus()
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
    const status = getToolboxRuntimeStatus()
    assert.equal(status.tools['rar-to-zip'].available, true)
    assert.equal(status.tools['rar-to-zip'].status, 'limited')
    assert.deepEqual(status.tools['rar-to-zip'].limits, [
        'Single-volume RAR only',
        'No password-protected archives',
        'No split or multipart archives',
    ])
})

test('runtime status exposes media runtime entries for online audio and video tools', () => {
    const status = getToolboxRuntimeStatus()

    for (const toolId of RUNTIME_VERIFIED_TOOL_IDS) {
        assert.ok(status.tools[toolId], `Missing runtime status for ${toolId}`)
        assert.equal(typeof status.tools[toolId].available, 'boolean')
        assert.equal(typeof status.tools[toolId].status, 'string')
        assert.equal(typeof status.tools[toolId].note, 'string')
    }
})

test('normalizeToolRuntimeStatus fills in shared note and limits when runtime payload is partial', () => {
    const status = normalizeToolRuntimeStatus('epub-to-mobi', {
        available: true,
        status: 'ready',
        runtime: 'ebook-convert',
    })

    assert.equal(status.available, true)
    assert.equal(status.status, 'ready')
    assert.equal(status.runtime, 'ebook-convert')
    assert.equal(status.note, 'Requires a configured server-side MOBI conversion runtime on this deployment.')
    assert.deepEqual(status.limits, [
        'Online mode only',
        'Requires KindleGen or ebook-convert on the server',
    ])
})

test('createRuntimeVerificationFailure returns a fail-closed deployment status', () => {
    const status = createRuntimeVerificationFailure('epub-to-mobi')

    assert.equal(status.available, false)
    assert.equal(status.status, 'deployment_required')
    assert.equal(status.runtime, null)
    assert.equal(status.note, 'Unable to verify the server-side runtime on this deployment right now.')
})
