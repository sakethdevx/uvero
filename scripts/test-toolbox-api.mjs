import test from 'node:test'
import assert from 'node:assert/strict'
import {
    classifyTransformImageError,
    normalizeOutputFormat,
} from '../src/services/toolbox/api/transform-image.js'
import {
    classifyTransformAudioError,
    normalizeAudioFormat,
} from '../src/services/toolbox/api/transform-audio.js'
import {
    classifyTransformVideoError,
    normalizeVideoFormat,
} from '../src/services/toolbox/api/transform-video.js'

test('normalizeOutputFormat maps jpg to jpeg and rejects unsupported formats', () => {
    assert.equal(normalizeOutputFormat('jpg'), 'jpeg')
    assert.throws(
        () => normalizeOutputFormat('bmp'),
        (error) => error?.code === 'UNSUPPORTED_IMAGE_FORMAT'
    )
})

test('classifyTransformImageError maps upload limits and invalid buffers', () => {
    assert.deepEqual(
        classifyTransformImageError({ code: 1009 }),
        {
            status: 413,
            error: 'The uploaded image exceeds the maximum allowed size for this deployment.',
            code: 'FILE_TOO_LARGE',
        }
    )

    assert.deepEqual(
        classifyTransformImageError(new Error('Input buffer contains unsupported image format')),
        {
            status: 400,
            error: 'The uploaded image file could not be processed.',
            code: 'INVALID_FILE',
        }
    )
})

test('normalizeAudioFormat maps aliases and classifyTransformAudioError returns stable codes', () => {
    assert.equal(normalizeAudioFormat('mpeg'), 'mp3')
    assert.equal(normalizeAudioFormat('wave'), 'wav')
    assert.throws(
        () => normalizeAudioFormat('aac'),
        (error) => error?.code === 'UNSUPPORTED_AUDIO_FORMAT'
    )

    const runtimeMissing = classifyTransformAudioError({ code: 'ENOENT' })
    assert.equal(runtimeMissing.code, 'RUNTIME_NOT_FOUND')
    assert.equal(runtimeMissing.status, 503)

    const invalidFile = classifyTransformAudioError(new Error('Invalid data found when processing input'))
    assert.equal(invalidFile.code, 'INVALID_FILE')
    assert.equal(invalidFile.status, 400)
})

test('normalizeVideoFormat validates formats and classifyTransformVideoError returns stable codes', () => {
    assert.equal(normalizeVideoFormat('mp4'), 'mp4')
    assert.equal(normalizeVideoFormat('gif'), 'gif')
    assert.throws(
        () => normalizeVideoFormat('flv'),
        (error) => error?.code === 'UNSUPPORTED_VIDEO_FORMAT'
    )

    const runtimeMissing = classifyTransformVideoError({ code: 'ENOENT' })
    assert.equal(runtimeMissing.code, 'RUNTIME_NOT_FOUND')
    assert.equal(runtimeMissing.status, 503)

    const invalidFile = classifyTransformVideoError(new Error('could not find codec parameters'))
    assert.equal(invalidFile.code, 'INVALID_FILE')
    assert.equal(invalidFile.status, 400)
})
