import test from 'node:test'
import assert from 'node:assert/strict'
import {
    classifyExtractionError,
    sanitizeArchivePath,
} from '../src/features/file-tools/api/convert-rar-to-zip.js'

test('sanitizeArchivePath strips traversal and invalid characters', () => {
    assert.equal(
        sanitizeArchivePath('../nested/..//unsafe:folder/file?.txt'),
        'nested/unsafe_folder/file_.txt'
    )
})

test('classifyExtractionError rejects password protected archives', () => {
    assert.deepEqual(
        classifyExtractionError({ reason: 'ERAR_MISSING_PASSWORD' }),
        {
            status: 400,
            error: 'Password-protected RAR archives are not supported in this deployment.',
        }
    )
})

test('classifyExtractionError rejects invalid archives', () => {
    assert.deepEqual(
        classifyExtractionError({ reason: 'ERAR_BAD_ARCHIVE' }),
        {
            status: 400,
            error: 'The uploaded file is not a valid RAR archive.',
        }
    )
})

test('classifyExtractionError rejects damaged archives', () => {
    assert.deepEqual(
        classifyExtractionError({ reason: 'ERAR_BAD_DATA' }),
        {
            status: 400,
            error: 'The RAR archive appears to be damaged or incomplete.',
        }
    )
})

test('classifyExtractionError handles upload limit errors', () => {
    assert.deepEqual(
        classifyExtractionError({ code: 1009 }),
        {
            status: 413,
            error: 'The uploaded RAR archive exceeds the maximum allowed size for this deployment.',
        }
    )
})
