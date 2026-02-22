/* eslint-disable */
import React, { useEffect, useState, useRef, useCallback } from 'react'
import imageCompression from 'browser-image-compression'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

// New component for on-demand image blob loading
function LazyImg({ img, auth, objectUrlsRef, gridSize }) {
    const [blobUrl, setBlobUrl] = useState(img._objectUrl || null)
    const [loading, setLoading] = useState(!img._objectUrl)
    const [observed, setObserved] = useState(false)
    const imgRef = useRef(null)

    useEffect(() => {
        if (!imgRef.current || blobUrl || observed) return

        // Delay starting observation to allow layout to stabilize
        const timer = setTimeout(() => {
            if (!imgRef.current) return
            const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    setObserved(true)
                    observer.disconnect()
                }
            }, { rootMargin: '100px' }) // Reduced from 200px

            observer.observe(imgRef.current)
        }, 100)

        return () => clearTimeout(timer)
    }, [blobUrl, observed, img.id])

    useEffect(() => {
        if (!observed || blobUrl) return

        let active = true
        async function fetchBlob() {
            try {
                setLoading(true)
                const resp = await fetch(`/api/images?id=${encodeURIComponent(img.id)}`, { headers: { Authorization: auth }, cache: 'no-store' })
                if (!resp.ok) throw new Error('Fetch failed')
                const blob = await resp.blob()
                if (!active) return
                const url = URL.createObjectURL(blob)
                objectUrlsRef.current.add(url)
                setBlobUrl(url)
            } catch (err) {
            } finally {
                if (active) setLoading(false)
            }
        }
        fetchBlob()
        return () => { active = false }
    }, [observed, img.id, auth, objectUrlsRef, blobUrl])

    return (
        <div ref={imgRef} className={`relative bg-gray-100 dark:bg-gray-900 overflow-hidden ${gridSize === 'lg' ? 'h-64' : gridSize === 'md' ? 'h-48' : 'h-32'}`}>
            {blobUrl ? (
                <img
                    src={blobUrl}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                    {loading && (
                        <div className="w-8 h-8 border-2 border-gray-300 dark:border-white/10 border-t-purple-500 rounded-full animate-spin mb-2" />
                    )}
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{loading ? 'Loading...' : 'Waiting...'}</span>
                </div>
            )}
        </div>
    )
}

// helper: normalize box for canvas operations
async function normalizeBox(box, imgW, imgH) {
    if (!box) return null
    let x, y, w, h
    if (Array.isArray(box) && box.length >= 4) {
        [x, y, w, h] = box
    } else if (typeof box === 'object') {
        if (box.xmin != null && box.xmax != null && box.ymin != null && box.ymax != null) {
            x = Number(box.xmin)
            y = Number(box.ymin)
            w = Number(box.xmax) - Number(box.xmin)
            h = Number(box.ymax) - Number(box.ymin)
        } else {
            x = box.x ?? box.left ?? box[0]
            y = box.y ?? box.top ?? box[1]
            w = box.width ?? box.w ?? box[2]
            h = box.height ?? box.h ?? box[3]
            if ((x == null || y == null) && (box.cx != null && box.cy != null && (box.w != null || box.width != null))) {
                const bw = box.w ?? box.width
                const bh = box.h ?? box.height
                x = Number(box.cx) - Number(bw) / 2
                y = Number(box.cy) - Number(bh) / 2
                w = Number(bw)
                h = Number(bh)
            }
        }
    }
    if (x == null || y == null || w == null || h == null) return null
    if (x <= 1 && y <= 1 && w <= 1 && h <= 1) {
        x = Math.round(x * imgW)
        y = Math.round(y * imgH)
        w = Math.round(w * imgW)
        h = Math.round(h * imgH)
    } else {
        x = Math.round(x)
        y = Math.round(y)
        w = Math.round(w)
        h = Math.round(h)
    }
    x = Math.max(0, Math.min(x, imgW - 1))
    y = Math.max(0, Math.min(y, imgH - 1))
    w = Math.max(1, Math.min(w, imgW - x))
    h = Math.max(1, Math.min(h, imgH - y))
    return { x, y, w, h }
}

async function createCroppedUrlFromBlob(blob, box) {
    try {
        const bitmap = await createImageBitmap(blob)
        const normalized = await normalizeBox(box, bitmap.width, bitmap.height)
        if (!normalized) return URL.createObjectURL(blob)
        const PAD_SCALE = 1.4
        const cx = normalized.x + normalized.w / 2
        const cy = normalized.y + normalized.h / 2
        let newW = Math.round(normalized.w * PAD_SCALE)
        let newH = Math.round(normalized.h * PAD_SCALE)
        let newX = Math.round(cx - newW / 2)
        let newY = Math.round(cy - newH / 2)
        newX = Math.max(0, Math.min(newX, bitmap.width - 1))
        newY = Math.max(0, Math.min(newY, bitmap.height - 1))
        if (newX + newW > bitmap.width) newW = bitmap.width - newX
        if (newY + newH > bitmap.height) newH = bitmap.height - newY
        const canvas = document.createElement('canvas')
        canvas.width = newW
        canvas.height = newH
        const ctx = canvas.getContext('2d')
        ctx.drawImage(bitmap, newX, newY, newW, newH, 0, 0, newW, newH)
        const croppedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'))
        if (!croppedBlob) return URL.createObjectURL(blob)
        return URL.createObjectURL(croppedBlob)
    } catch (e) {
        console.warn('Failed to crop thumbnail', e)
        return URL.createObjectURL(blob)
    }
}

// New component for on-demand person face thumbnail loading and cropping
function LazyPersonThumb({ person, auth, objectUrlsRef }) {
    const [thumbUrl, setThumbUrl] = useState(person._thumbUrl || null)
    const [loading, setLoading] = useState(!person._thumbUrl && person.thumbnail_image_id)
    const [observed, setObserved] = useState(false)
    const thumbRef = useRef(null)

    useEffect(() => {
        if (!thumbRef.current || thumbUrl || observed || !person.thumbnail_image_id) return

        const timer = setTimeout(() => {
            if (!thumbRef.current) return
            const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    setObserved(true)
                    observer.disconnect()
                }
            }, { rootMargin: '50px' })
            observer.observe(thumbRef.current)
        }, 100)

        return () => clearTimeout(timer)
    }, [thumbUrl, observed, person.thumbnail_image_id, person.id])

    useEffect(() => {
        if (!observed || thumbUrl || !person.thumbnail_image_id) return
        let active = true
        async function fetchThumb() {
            try {
                setLoading(true)
                const r = await fetch(`/api/images?id=${encodeURIComponent(person.thumbnail_image_id)}`, { headers: { Authorization: auth }, cache: 'no-store' })
                if (!r.ok) return
                const blob = await r.blob()
                if (!active) return
                let url
                if (person.thumbnail_box) {
                    url = await createCroppedUrlFromBlob(blob, person.thumbnail_box)
                } else {
                    url = URL.createObjectURL(blob)
                }
                objectUrlsRef.current.add(url)
                setThumbUrl(url)
            } catch (e) {
                console.warn('Failed to fetch person thumb', person.id, e)
            } finally {
                if (active) setLoading(false)
            }
        }
        fetchThumb()
        return () => { active = false }
    }, [observed, person.thumbnail_image_id, person.thumbnail_box, auth, objectUrlsRef, thumbUrl])

    return (
        <div ref={thumbRef} className="h-11 w-11 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-sm">
            {thumbUrl ? (
                <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
            ) : (
                <div className="flex items-center justify-center text-[10px] text-gray-500">
                    {loading ? '...' : '?'}
                </div>
            )}
        </div>
    )
}

export default function EventDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const [images, setImages] = useState([])
    const [persons, setPersons] = useState([])
    const [selectedPersonIds, setSelectedPersonIds] = useState([])
    const [editingPersonId, setEditingPersonId] = useState(null)
    const [editingName, setEditingName] = useState('')

    // Pagination state
    const [totalImages, setTotalImages] = useState(0)
    const [totalPersons, setTotalPersons] = useState(0)
    const [processedImages, setProcessedImages] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [loadingBatch, setLoadingBatch] = useState(false)
    const isLoadingBatchRef = useRef(false)
    const imagesCountRef = useRef(0)
    const BATCH_SIZE = 24

    const [eventMeta, setEventMeta] = useState(null)
    const [isOwner, setIsOwner] = useState(false)
    const [isParticipant, setIsParticipant] = useState(false)
    // final owner check: prefer server-provided flag but fall back to event metadata
    const ownerCheck = isOwner || (eventMeta && user && eventMeta.created_by === user?.id)
    const [shareQr, setShareQr] = useState(null)
    const [notice, setNotice] = useState(null)
    const fileRef = useRef()
    const objectUrlsRef = useRef(new Set())
    const navigate = useNavigate()
    const [deletingEvent, setDeletingEvent] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [downloadingSelection, setDownloadingSelection] = useState(false)
    const [selectedImageIds, setSelectedImageIds] = useState([])
    const [showPeopleMenu, setShowPeopleMenu] = useState(false)
    const [zipProgress, setZipProgress] = useState(null)
    const loadMoreRef = useRef(null)

    // Meta-data about persons is loaded here. Thumbnails are loaded on-demand by LazyPersonThumb.

    async function loadPersons() {
        try {
            const resp = await fetch(`/api/persons?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            if (!resp.ok) return setPersons([])
            const d = await resp.json()
            const ps = d.data || []
            setPersons(ps)
        } catch (e) {
            console.warn('Failed to load persons', e)
            setPersons([])
        }
    }

    useEffect(() => {
        if (!id) return
        setLoadingBatch(true)
        fetch(`/api/events?event_id=${id}&limit=${BATCH_SIZE}&offset=0`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            .then(r => r.json())
            .then(async d => {
                const payload = d.data || {}
                const imgs = payload.images || []
                setImages(imgs)
                setEventMeta(payload.event || null)
                setIsOwner(Boolean(payload.isOwner))
                setIsParticipant(Boolean(payload.isParticipant))
                setTotalImages(payload.total_images_count || 0)
                setTotalPersons(payload.total_persons_count || 0)
                setProcessedImages(payload.processed_images_count || 0)
                setHasMore(Boolean(payload.has_more))
                imagesCountRef.current = imgs.length
            })
            .finally(() => setLoadingBatch(false))

        // initial load
        loadPersons()
    }, [id, user])

    async function handleEditPerson(person) {
        setEditingPersonId(person.id)
        setEditingName(person.name || '')
    }

    async function handleSavePersonName(personId) {
        if (!editingName.trim()) return
        try {
            const resp = await fetch('/api/update-person-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
                body: JSON.stringify({ event_id: id, person_id: personId, name: editingName.trim() })
            })
            if (!resp.ok) {
                const txt = await resp.text()
                console.error('Update person name failed', resp.status, txt)
                return
            }
            // refresh persons (use loadPersons to preserve thumbnails)
            try { await loadPersons() } catch (e) { console.warn('Failed to reload persons after rename', e) }
            setEditingPersonId(null)
            setEditingName('')
        } catch (err) {
            console.error('Update person name error', err)
        }
    }

    function handleSelectPerson(personId) {
        setSelectedPersonIds(prev => {
            if (!prev) return [personId]
            if (prev.includes(personId)) return prev.filter(id => id !== personId)
            return [...prev, personId]
        })
    }

    function handleClearSelection() {
        setSelectedPersonIds([])
    }

    async function handleDownloadSelected() {
        // download all currently displayed images (filtered by selection)
        try {
            const token = user?.access_token || null
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const imgsToDownload = (selectedImageIds && selectedImageIds.length > 0)
                ? images.filter(img => selectedImageIds.includes(img.id))
                : (selectedPersonIds && selectedPersonIds.length > 0)
                    ? images.filter(img => Array.isArray(img.person_ids) && img.person_ids.some(pid => selectedPersonIds.includes(pid)))
                    : images
            if (!imgsToDownload || imgsToDownload.length === 0) return
            setDownloadingSelection(true)
            // default to ZIP for "Download Selected"
            await downloadImagesZip(imgsToDownload, headers)
        } catch (err) {
            console.error('Download selection error', err)
        } finally {
            setDownloadingSelection(false)
        }
    }

    async function downloadImagesSeparately(imgArray, headers = {}) {
        const token = user?.access_token || null
        if (!headers || Object.keys(headers).length === 0) {
            headers = token ? { Authorization: `Bearer ${token}` } : {}
        }
        for (const img of imgArray) {
            try {
                const resp = await fetch(`/api/images?id=${encodeURIComponent(img.id)}&download=1`, { headers, cache: 'no-store' })
                if (!resp.ok) {
                    console.error('Download failed', resp.status, await resp.text())
                    continue
                }
                const blob = await resp.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = img.filename || `${img.id}.jpg`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
                await new Promise(r => setTimeout(r, 250))
            } catch (e) {
                console.error('Failed to download image', img.id, e)
            }
        }
    }

    async function downloadImagesZip(imgArray, headers = {}) {
        try {
            const zip = new JSZip()
            const token = user?.access_token || null
            if (!headers || Object.keys(headers).length === 0) {
                headers = token ? { Authorization: `Bearer ${token}` } : {}
            }
            // show progress immediately (fetch phase will map to 0-50%)
            const total = imgArray.length || 1
            let fetched = 0
            setZipProgress(0)
            // yield so UI can render progress bar
            await new Promise(resolve => setTimeout(resolve, 30))

            for (const img of imgArray) {
                try {
                    const resp = await fetch(`/api/images?id=${encodeURIComponent(img.id)}&download=1`, { headers, cache: 'no-store' })
                    if (!resp.ok) {
                        console.error('Download failed', resp.status, await resp.text())
                        // still count as attempted so progress moves
                        fetched += 1
                        setZipProgress(Math.min(50, Math.round((fetched / total) * 50)))
                        continue
                    }
                    const blob = await resp.blob()
                    const filename = img.filename || `${img.id}.jpg`
                    zip.file(filename, blob)
                    fetched += 1
                    // update fetch progress mapped to 0-50%
                    try { setZipProgress(Math.min(50, Math.round((fetched / total) * 50))) } catch (e) { }
                } catch (e) {
                    console.error('Failed to fetch for zip', img.id, e)
                    fetched += 1
                    try { setZipProgress(Math.min(50, Math.round((fetched / total) * 50))) } catch (er) { }
                }
            }

            // start generation phase; map generation percent (0-100) to 50-100
            await new Promise(resolve => setTimeout(resolve, 30))
            const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
                try {
                    const genPercent = Math.round(meta.percent)
                    // map 0..100 => 50..100
                    setZipProgress(50 + Math.round(genPercent / 2))
                } catch (e) { }
            })
            const url = URL.createObjectURL(zipBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = `selection-${id}-${Date.now()}.zip`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            setZipProgress(null)
        } catch (err) {
            console.error('Download ZIP error', err)
        }
    }

    function toggleImageSelection(imageId) {
        setSelectedImageIds(prev => {
            if (!prev) return [imageId]
            if (prev.includes(imageId)) return prev.filter(id => id !== imageId)
            return [...prev, imageId]
        })
    }

    async function handleDeleteSelectedImages() {
        if (!selectedImageIds || selectedImageIds.length === 0) return
        const imgsToDelete = images.filter(img => selectedImageIds.includes(img.id))
        // determine which images user can delete
        const deletable = imgsToDelete.filter(img => isOwner || img.uploaded_by === user?.id)
        const nonDeletableCount = imgsToDelete.length - deletable.length
        if (deletable.length === 0) {
            alert('You do not have permission to delete the selected images.')
            return
        }
        if (!confirm(`Delete ${deletable.length} image(s)? This is permanent.${nonDeletableCount ? ` ${nonDeletableCount} image(s) will be skipped due to permissions.` : ''}`)) return

        setDownloadingSelection(true)
        try {
            const token = user?.access_token || null
            const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
            for (const img of deletable) {
                try {
                    const resp = await fetch('/api/delete-image', { method: 'POST', headers, body: JSON.stringify({ id: img.id }) })
                    if (!resp.ok) {
                        console.error('Delete failed', resp.status, await resp.text())
                        continue
                    }
                    // remove from UI and revoke object URL
                    setImages(prev => prev.filter(i => i.id !== img.id))
                    if (img._objectUrl) {
                        try { URL.revokeObjectURL(img._objectUrl) } catch (e) { }
                        objectUrlsRef.current.delete(img._objectUrl)
                    }
                    // also remove from selectedImageIds
                    setSelectedImageIds(prev => (prev || []).filter(id => id !== img.id))
                } catch (e) {
                    console.error('Failed to delete image', img.id, e)
                }
            }
            if (nonDeletableCount) alert(`${nonDeletableCount} image(s) were not deleted because you lack permissions.`)
        } finally {
            setDownloadingSelection(false)
        }
    }

    async function handleDownloadZip() {
        try {
            const token = user?.access_token || null
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const imgsToDownload = (selectedPersonIds && selectedPersonIds.length > 0
                ? images.filter(img => Array.isArray(img.person_ids) && img.person_ids.some(pid => selectedPersonIds.includes(pid)))
                : images)
            if (!imgsToDownload || imgsToDownload.length === 0) return
            setDownloadingSelection(true)
            const zip = new JSZip()
            // show progress immediately and update during fetch phase (0-50%)
            const total = imgsToDownload.length || 1
            let fetched = 0
            setZipProgress(0)
            await new Promise(resolve => setTimeout(resolve, 30))
            for (const img of imgsToDownload) {
                try {
                    const resp = await fetch(`/api/images?id=${encodeURIComponent(img.id)}&download=1`, { headers, cache: 'no-store' })
                    if (!resp.ok) {
                        console.error('Download failed', resp.status, await resp.text())
                        fetched += 1
                        setZipProgress(Math.min(50, Math.round((fetched / total) * 50)))
                        continue
                    }
                    const blob = await resp.blob()
                    const filename = img.filename || `${img.id}.jpg`
                    zip.file(filename, blob)
                    fetched += 1
                    try { setZipProgress(Math.min(50, Math.round((fetched / total) * 50))) } catch (e) { }
                } catch (e) {
                    console.error('Failed to fetch for zip', img.id, e)
                    fetched += 1
                    try { setZipProgress(Math.min(50, Math.round((fetched / total) * 50))) } catch (er) { }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 30))
            const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
                try {
                    const genPercent = Math.round(meta.percent)
                    setZipProgress(50 + Math.round(genPercent / 2))
                } catch (e) { }
            })
            const url = URL.createObjectURL(zipBlob)
            const a = document.createElement('a')
            a.href = url
            a.download = `selection-${id}-${Date.now()}.zip`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            setZipProgress(null)
        } catch (err) {
            console.error('Download ZIP error', err)
        } finally {
            setDownloadingSelection(false)
        }
    }

    async function handleJoinEvent() {
        if (!user) return
        try {
            console.log(`[EventDetail] handleJoinEvent START at ${new Date().toISOString()}`)
            const resp = await fetch('/api/join-event', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` }, body: JSON.stringify({ event_id: id }) })
            if (!resp.ok) {
                const txt = await resp.text()
                console.error('[EventDetail] JOIN FAILED', resp.status, txt)
                return
            }
            setIsParticipant(true)

            // refresh event data and initial batch of images
            setLoadingBatch(true)
            console.log('[EventDetail] REFRESHING DATA AFTER JOIN')
            fetch(`/api/events?event_id=${id}&limit=${BATCH_SIZE}&offset=0`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
                .then(r => r.json())
                .then(async d => {
                    const payload = d.data || {}
                    const imgs = payload.images || []
                    console.log(`[EventDetail] POST-JOIN FETCH SUCCESS: ${imgs.length} images`)
                    setImages(imgs)
                    setEventMeta(payload.event || null)
                    setIsOwner(Boolean(payload.isOwner))
                    setIsParticipant(Boolean(payload.isParticipant))
                    setTotalImages(payload.total_images_count || 0)
                    setTotalPersons(payload.total_persons_count || 0)
                    setProcessedImages(payload.processed_images_count || 0)
                    setHasMore(Boolean(payload.has_more))
                })
                .finally(() => setLoadingBatch(false))

            // refresh persons
            loadPersons()
        } catch (err) { console.error('[EventDetail] JOIN ERROR', err) }
    }

    async function handleShare() {
        try {
            // request a signed invite token from the server
            const resp = await fetch('/api/create-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
                body: JSON.stringify({ event_id: id })
            })
            if (!resp.ok) {
                console.error('Create invite failed', resp.status, await resp.text())
                return
            }
            const d = await resp.json()
            const token = d.token
            if (!token) return
            const link = `${window.location.origin}/invite/${token}`
            await navigator.clipboard.writeText(link)
            setNotice('Invite link copied to clipboard')
            setTimeout(() => setNotice(null), 3000)
            const data = await QRCode.toDataURL(link)
            setShareQr(data)
        } catch (err) { console.error('Share error', err) }
    }

    async function handleCopyLink() {
        try {
            const resp = await fetch('/api/create-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
                body: JSON.stringify({ event_id: id })
            })
            if (!resp.ok) {
                console.error('Create invite failed', resp.status, await resp.text())
                return
            }
            const d = await resp.json()
            const token = d.token
            if (!token) return
            const link = `${window.location.origin}/invite/${token}`
            await navigator.clipboard.writeText(link)
            console.debug('Invite link copied')
            setNotice('Invite link copied to clipboard')
            setTimeout(() => setNotice(null), 3000)
        } catch (err) { console.error('Copy link error', err) }
    }

    async function handleDownloadQr() {
        try {
            const resp = await fetch('/api/create-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
                body: JSON.stringify({ event_id: id })
            })
            if (!resp.ok) {
                console.error('Create invite failed', resp.status, await resp.text())
                return
            }
            const d = await resp.json()
            const token = d.token
            if (!token) return
            const link = `${window.location.origin}/invite/${token}`
            const dataUrl = await QRCode.toDataURL(link)
            // trigger download
            const a = document.createElement('a')
            a.href = dataUrl
            a.download = `event-${id}-invite-qr.png`
            document.body.appendChild(a)
            a.click()
            a.remove()
            // keep preview available
            setShareQr(dataUrl)
        } catch (err) { console.error('Download QR error', err) }
    }

    // Revoke all created object URLs only on component unmount
    useEffect(() => {
        return () => {
            objectUrlsRef.current.forEach(url => {
                try { URL.revokeObjectURL(url) } catch (e) { }
            })
            objectUrlsRef.current.clear()
        }
    }, [])

    // handleLoadMore MUST be declared before the useEffect that references it.
    // In production builds, Rollup's scope hoisting respects TDZ for const/let,
    // so referencing a const before its initialiser causes a ReferenceError.
    const handleLoadMore = useCallback(async () => {
        if (isLoadingBatchRef.current || !hasMore || !id) return
        isLoadingBatchRef.current = true
        setLoadingBatch(true)
        try {
            // Use current imagesCountRef.current as offset to ensure consistency
            const currentOffset = imagesCountRef.current
            console.log(`[EventDetail] BATCH FETCH START: offset=${currentOffset} limit=${BATCH_SIZE} at ${new Date().toISOString()}`)
            const resp = await fetch(`/api/events?event_id=${id}&limit=${BATCH_SIZE}&offset=${currentOffset}`, {
                headers: { Authorization: `Bearer ${user?.access_token || ''}` }
            })
            if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`)
            const d = await resp.json()
            const payload = d.data || {}
            const newImgs = payload.images || []

            if (newImgs.length > 0) {
                setImages(prev => {
                    // Prevent duplicates just in case
                    const existingIds = new Set(prev.map(i => i.id))
                    const filteredNew = newImgs.filter(i => !existingIds.has(i.id))
                    imagesCountRef.current = prev.length + filteredNew.length
                    return [...prev, ...filteredNew]
                })
            }
            setHasMore(Boolean(payload.has_more))
        } catch (err) {
            console.error('[EventDetail] BATCH FETCH FAILED:', err)
        } finally {
            // Small delay to prevent rapid-fire triggering
            setTimeout(() => {
                isLoadingBatchRef.current = false
                setLoadingBatch(false)
            }, 600)
        }
    }, [hasMore, id, user])

    // IntersectionObserver for infinite scroll — load more images as user scrolls
    useEffect(() => {
        if (!loadMoreRef.current || !hasMore) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    handleLoadMore()
                }
            },
            { rootMargin: '50px' }
        )
        observer.observe(loadMoreRef.current)
        return () => observer.disconnect()
    }, [hasMore, id, user, handleLoadMore])

    async function handleFiles(files) {
        if (!files || !files.length) return

        for (const file of Array.from(files)) {
            // optimistic preview
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            const objectUrl = URL.createObjectURL(file)
            objectUrlsRef.current.add(objectUrl)
            const tempItem = {
                id: tempId,
                filename: file.name,
                uploaded_at: new Date().toISOString(),
                _objectUrl: objectUrl,
                temp: true,
                uploadProgress: 0
            }
            setImages(prev => [tempItem, ...prev])

            // compress image before uploading
            let uploadFile = file
            try {
                const options = { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true }
                uploadFile = await imageCompression(file, options)
            } catch (err) {
                console.warn('Image compression failed, using original file', err)
                uploadFile = file
            }

            // read as base64
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(uploadFile)
            })
            const base64 = dataUrl.split(',')[1]

            // helper: fetch image blob from server and replace temp with server item + object URL
            async function fetchAndReplace(tempId, serverItem) {
                try {
                    const token = user?.access_token || null
                    const headers = token ? { Authorization: `Bearer ${token}` } : {}
                    const resp = await fetch(`/api/images?id=${encodeURIComponent(serverItem.id)}`, { headers, cache: 'no-store' })
                    if (!resp.ok) {
                        // if we can't fetch the blob, still replace with server item
                        setImages(prev => prev.map(it => it.id === tempId ? serverItem : it))
                        return
                    }
                    const blob = await resp.blob()
                    const url = URL.createObjectURL(blob)
                    objectUrlsRef.current.add(url)
                    setImages(prev => prev.map(it => it.id === tempId ? { ...serverItem, _objectUrl: url } : it))
                } catch (e) {
                    console.warn('Failed to fetch server image blob', e)
                    setImages(prev => prev.map(it => it.id === tempId ? serverItem : it))
                }
            }

            // upload with XHR to track progress
            try {
                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest()
                    xhr.open('POST', '/api/upload-image')
                    xhr.setRequestHeader('Content-Type', 'application/json')
                    if (user?.access_token) xhr.setRequestHeader('Authorization', `Bearer ${user.access_token}`)

                    xhr.upload.onprogress = (e) => {
                        if (!e.lengthComputable) return
                        const pct = Math.round((e.loaded / e.total) * 100)
                        setImages(prev => prev.map(it => it.id === tempId ? { ...it, uploadProgress: pct } : it))
                    }

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const resp = JSON.parse(xhr.responseText)
                                if (resp && resp.data) {
                                    // replace temp item with server item and fetch its blob for preview
                                    fetchAndReplace(tempId, resp.data)
                                } else {
                                    // remove temp on bad response
                                    setImages(prev => prev.filter(it => it.id !== tempId))
                                }
                            } catch (e) {
                                console.error('Upload parse error', e)
                                setImages(prev => prev.filter(it => it.id !== tempId))
                            }
                            resolve()
                        } else {
                            console.error('Upload failed', xhr.status, xhr.responseText)
                            setImages(prev => prev.filter(it => it.id !== tempId))
                            reject(new Error('Upload failed'))
                        }
                    }

                    xhr.onerror = () => {
                        console.error('Upload request error')
                        setImages(prev => prev.filter(it => it.id !== tempId))
                        reject(new Error('Network error'))
                    }

                    xhr.send(JSON.stringify({ event_id: id, filename: file.name, content: base64 }))
                })
            } catch (err) {
                console.warn('Upload failed for', file.name, err)
            }

            // refresh persons after each upload attempt
            try {
                await loadPersons()
            } catch (err) { console.warn('Failed to refresh persons', err) }
        }
    }

    function onSelectFiles(e) {
        const files = e.target.files
        handleFiles(files)
    }

    async function downloadImage(img) {
        try {
            const token = user?.access_token || null
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            // Use the index image proxy (same endpoint as preload) to avoid route inconsistencies
            const resp = await fetch(`/api/images?id=${encodeURIComponent(img.id)}&download=1`, { headers, cache: 'no-store' })
            if (!resp.ok) {
                const txt = await resp.text()
                console.error('Download failed', resp.status, txt)
                return
            }
            const blob = await resp.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = img.filename || 'image'
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Download error', err)
        }
    }

    async function handleDeleteImage(img) {
        if (!confirm('Delete this image? This is permanent.')) return
        try {
            const token = user?.access_token || null
            const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
            const resp = await fetch('/api/delete-image', { method: 'POST', headers, body: JSON.stringify({ id: img.id }) })
            if (!resp.ok) {
                const txt = await resp.text()
                console.error('Delete failed', resp.status, txt)
                return
            }
            // remove from UI
            setImages(prev => prev.filter(i => i.id !== img.id))
            // revoke object URL
            if (img._objectUrl) {
                try { URL.revokeObjectURL(img._objectUrl) } catch (e) { }
                objectUrlsRef.current.delete(img._objectUrl)
            }
        } catch (err) {
            console.error('Delete error', err)
        }
    }

    async function handleDeleteEvent() {
        if (!confirm('Delete this event and all its photos? This is permanent.')) return
        try {
            setDeletingEvent(true)
            const token = user?.access_token || null
            const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
            const resp = await fetch('/api/delete-event', { method: 'POST', headers, body: JSON.stringify({ event_id: id }) })
            if (!resp.ok) {
                const txt = await resp.text()
                console.error('Delete event failed', resp.status, txt)
                setDeletingEvent(false)
                return
            }
            // navigate back to events list
            navigate('/photodrop')
        } catch (err) {
            console.error('Delete event error', err)
            setDeletingEvent(false)
        }
    }

    /* ─── State for new features ─── */
    const [lightboxImg, setLightboxImg] = useState(null)
    const [peopleSearch, setPeopleSearch] = useState('')
    const [gridSize, setGridSize] = useState('md') // 'sm' | 'md' | 'lg'

    const filteredPersons = persons.filter(p =>
        (p.name || 'Unnamed').toLowerCase().includes(peopleSearch.toLowerCase())
    )

    const allDisplayImages = selectedPersonIds && selectedPersonIds.length > 0
        ? images.filter(img => Array.isArray(img.person_ids) && img.person_ids.some(pid => selectedPersonIds.includes(pid)))
        : images
    const displayImages = allDisplayImages

    const gridColsClass = {
        sm: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
        md: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
        lg: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    }[gridSize]

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-500">
            {/* ── Toast ── */}
            {notice && (
                <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
                    <div className="flex items-center gap-3 bg-gray-900 dark:bg-gray-800 text-white px-5 py-3 rounded-xl shadow-2xl">
                        <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">{notice}</span>
                    </div>
                </div>
            )}

            {/* ── Lightbox Modal ── */}
            {lightboxImg && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setLightboxImg(null)}
                >
                    <button
                        onClick={() => setLightboxImg(null)}
                        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={lightboxImg._objectUrl || undefined}
                        alt={lightboxImg.filename || 'Photo'}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                        <button
                            onClick={e => { e.stopPropagation(); downloadImage(lightboxImg) }}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </button>
                        <span className="text-white/50 text-xs">{lightboxImg.filename}</span>
                    </div>
                </div>
            )}

            {/* ── Dark Header ── */}
            <header className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.08),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.06),transparent_60%)]" />

                <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 sm:py-10">
                    {/* Back link */}
                    <Link to="/photodrop" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white dark:text-gray-500 dark:hover:text-white mb-5 transition-colors group">
                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to PhotoDrop
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                {ownerCheck && (
                                    <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300">
                                        Owner
                                    </span>
                                )}
                                {!isOwner && isParticipant && (
                                    <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300">
                                        Guest
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                                {eventMeta?.event_name || 'Event'}
                            </h1>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-gray-300">
                                    <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <strong className="text-white">{totalImages}</strong> photos
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-gray-300">
                                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <strong className="text-white">{totalPersons}</strong> people
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-gray-300">
                                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <strong className="text-white">{processedImages}</strong> processed
                                </span>
                                {eventMeta?.event_date && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-sm text-gray-300">
                                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(eventMeta.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {ownerCheck && shareQr && (
                                <img src={shareQr} alt="QR" className="h-28 w-28 rounded-xl border border-white/10 dark:border-white/5 p-1.5 bg-white shadow-lg" />
                            )}
                            {!isOwner && !isParticipant && (
                                <button onClick={handleJoinEvent} className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Join Event
                                </button>
                            )}
                            {ownerCheck && (
                                <>
                                    <button onClick={handleCopyLink} className="inline-flex items-center gap-1.5 bg-white/[0.06] dark:bg-white/5 border border-white/[0.1] dark:border-white/10 hover:bg-white/[0.1] dark:hover:bg-white/10 text-gray-200 dark:text-gray-300 py-2.5 px-4 rounded-xl text-sm font-medium transition-all">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                        Copy Link
                                    </button>
                                    <button onClick={handleDownloadQr} className="inline-flex items-center gap-1.5 bg-white/[0.06] dark:bg-white/5 border border-white/[0.1] dark:border-white/10 hover:bg-white/[0.1] dark:hover:bg-white/10 text-gray-200 dark:text-gray-300 py-2.5 px-4 rounded-xl text-sm font-medium transition-all">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                        QR Code
                                    </button>
                                    <button
                                        disabled={deletingEvent}
                                        onClick={handleDeleteEvent}
                                        className="inline-flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 py-2.5 px-4 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        {deletingEvent ? 'Deleting...' : 'Delete'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Upload Zone ── */}
                <section className="mb-8">
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${dragActive
                            ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-500/10 scale-[1.01]'
                            : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50/50 dark:hover:bg-white/[0.08]'
                            }`}
                        onClick={() => fileRef.current && fileRef.current.click()}
                        onDragOver={e => { e.preventDefault(); setDragActive(true) }}
                        onDragEnter={e => { e.preventDefault(); setDragActive(true) }}
                        onDragLeave={e => { e.preventDefault(); setDragActive(false) }}
                        onDrop={e => { e.preventDefault(); setDragActive(false); const dt = e.dataTransfer; if (dt && dt.files && dt.files.length) handleFiles(dt.files) }}
                    >
                        <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragActive ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-gray-100 dark:bg-white/5'}`}>
                            <svg className={`w-7 h-7 transition-colors ${dragActive ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1">
                            {dragActive ? 'Drop your photos here' : 'Drag & drop photos here'}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">or click to browse. Photos are auto-compressed before upload.</p>
                        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onSelectFiles} className="hidden" />
                    </div>
                </section>

                {/* ── Main Layout: Sidebar + Photos ── */}
                <div className="grid lg:grid-cols-[300px_1fr] gap-8">
                    {/* ── People Sidebar ── */}
                    <aside className="lg:sticky lg:top-4 lg:self-start">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                            {/* Sidebar Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        People
                                    </h2>
                                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{totalPersons}</span>
                                </div>

                                {/* Search */}
                                {persons.length > 3 && (
                                    <div className="relative">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={peopleSearch}
                                            onChange={e => setPeopleSearch(e.target.value)}
                                            placeholder="Search people..."
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                                        />
                                    </div>
                                )}

                                {/* Clear filter */}
                                {selectedPersonIds && selectedPersonIds.length > 0 && (
                                    <button
                                        onClick={handleClearSelection}
                                        className="mt-2 w-full text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 py-1.5 rounded-lg transition-colors"
                                    >
                                        Clear filter ({selectedPersonIds.length} selected)
                                    </button>
                                )}
                            </div>

                            {/* People List */}
                            <div className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50 dark:divide-white/[0.02]">
                                {filteredPersons.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">
                                        {persons.length === 0 ? 'No people detected yet. Upload photos to start.' : 'No matching people.'}
                                    </div>
                                ) : filteredPersons.map(person => (
                                    <div
                                        key={person.id}
                                        className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedPersonIds && selectedPersonIds.includes(person.id) ? 'bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-50 dark:hover:bg-purple-500/10' : ''
                                            }`}
                                        onClick={() => {
                                            if (editingPersonId !== person.id) handleSelectPerson(person.id)
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div className="flex-shrink-0 relative">
                                            <LazyPersonThumb
                                                person={person}
                                                auth={{ Authorization: `Bearer ${user?.access_token || ''}` }}
                                                objectUrlsRef={objectUrlsRef}
                                            />
                                            {selectedPersonIds && selectedPersonIds.includes(person.id) && (
                                                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Name / Edit */}
                                        <div className="flex-1 min-w-0">
                                            {editingPersonId === person.id ? (
                                                <div onClick={e => e.stopPropagation()}>
                                                    <input
                                                        autoFocus
                                                        value={editingName}
                                                        onChange={e => setEditingName(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter') handleSavePersonName(person.id); if (e.key === 'Escape') { setEditingPersonId(null); setEditingName('') } }}
                                                        className="w-full px-2 py-1 border border-purple-300 dark:border-purple-500/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                        placeholder="Person name"
                                                    />
                                                    <div className="mt-1.5 flex gap-1.5">
                                                        <button onClick={() => handleSavePersonName(person.id)} className="px-2 py-0.5 bg-purple-600 text-white rounded text-xs font-semibold">Save</button>
                                                        <button onClick={() => { setEditingPersonId(null); setEditingName('') }} className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded text-xs">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{person.name || 'Unnamed'}</div>
                                                    <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{person.image_count || 0} photos</div>
                                                </>
                                            )}
                                        </div>

                                        {/* Edit button */}
                                        {editingPersonId !== person.id && (
                                            <button
                                                className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                                                style={{ opacity: 1 }}
                                                onClick={e => { e.stopPropagation(); handleEditPerson(person) }}
                                            >
                                                <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* ── Photos Area ── */}
                    <main>
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Photos
                                    <span className="ml-1.5 text-sm font-normal text-gray-400 dark:text-gray-500">
                                        ({displayImages.length}{selectedPersonIds && selectedPersonIds.length > 0 ? ` of ${totalImages}` : ''})
                                    </span>
                                </h2>

                                {/* Grid size toggle */}
                                <div className="hidden sm:flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
                                    {['sm', 'md', 'lg'].map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setGridSize(size)}
                                            className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${gridSize === size ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                        >
                                            {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Download actions */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {selectedImageIds && selectedImageIds.length > 0 && (
                                    <div className="flex items-center gap-2 mr-2">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{selectedImageIds.length} selected</span>
                                        <button onClick={() => setSelectedImageIds([])} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 underline">Clear</button>
                                        <button
                                            disabled={!(images && images.some(i => selectedImageIds.includes(i.id) && (isOwner || i.uploaded_by === user?.id)))}
                                            onClick={handleDeleteSelectedImages}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={handleDownloadSelected}
                                    disabled={downloadingSelection || !((selectedImageIds && selectedImageIds.length) || (selectedPersonIds && selectedPersonIds.length))}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-40 shadow-sm"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    ZIP
                                </button>
                                <button
                                    disabled={downloadingSelection || !((selectedImageIds && selectedImageIds.length) || (selectedPersonIds && selectedPersonIds.length))}
                                    onClick={async () => {
                                        try {
                                            setDownloadingSelection(true)
                                            const imgsToDownload = (selectedImageIds && selectedImageIds.length > 0)
                                                ? images.filter(img => selectedImageIds.includes(img.id))
                                                : (selectedPersonIds && selectedPersonIds.length > 0)
                                                    ? images.filter(img => Array.isArray(img.person_ids) && img.person_ids.some(pid => selectedPersonIds.includes(pid)))
                                                    : images
                                            await downloadImagesSeparately(imgsToDownload)
                                        } finally { setDownloadingSelection(false) }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors disabled:opacity-40 shadow-sm"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Separate
                                </button>
                                <button
                                    disabled={downloadingSelection}
                                    onClick={async () => { try { setDownloadingSelection(true); await downloadImagesZip(images) } finally { setDownloadingSelection(false) } }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg text-xs font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-sm"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download All
                                </button>
                            </div>
                        </div>

                        {/* ZIP Progress */}
                        {downloadingSelection && zipProgress != null && (
                            <div className="mb-5">
                                <div className="w-full bg-gray-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-rose-500 to-purple-600 h-2 rounded-full transition-all duration-300" style={{ width: `${zipProgress}%` }} />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">{zipProgress}% preparing download...</p>
                            </div>
                        )}

                        {/* Photo Grid */}
                        {displayImages.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-1">No photos yet</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Upload photos using the drag & drop area above.</p>
                            </div>
                        ) : (
                            <div className={`grid ${gridColsClass} gap-3`}>
                                {displayImages.map(img => (
                                    <div
                                        key={img.id}
                                        className={`group relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer ${selectedImageIds.includes(img.id) ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                                            }`}
                                        onClick={e => {
                                            const t = e.target
                                            if (!t) return
                                            const tag = t.tagName
                                            if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'A' || (t.closest && t.closest('input,button,a'))) return
                                            // Double-click for lightbox, single for select
                                            toggleImageSelection(img.id)
                                        }}
                                        onDoubleClick={e => {
                                            e.preventDefault()
                                            setLightboxImg(img)
                                        }}
                                    >
                                        <LazyImg
                                            img={img}
                                            auth={`Bearer ${user?.access_token || ''}`}
                                            objectUrlsRef={objectUrlsRef}
                                            gridSize={gridSize}
                                        />

                                        {/* Bottom info bar */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-2.5 pt-8">
                                            <div className="text-[10px] text-white/70 font-medium truncate">
                                                {new Date(img.uploaded_at).toLocaleString()}
                                            </div>
                                        </div>

                                        {/* Hover action buttons */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                                            <button
                                                onClick={e => { e.stopPropagation(); setLightboxImg(img) }}
                                                className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-colors"
                                                title="View full size"
                                            >
                                                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={e => { e.stopPropagation(); downloadImage(img) }}
                                                className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white shadow-sm flex items-center justify-center transition-colors"
                                                title="Download"
                                            >
                                                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={e => { e.stopPropagation(); handleDeleteImage(img) }}
                                                className="w-8 h-8 rounded-lg bg-red-500/90 hover:bg-red-600 shadow-sm flex items-center justify-center transition-colors"
                                                title="Delete"
                                            >
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Checkbox */}
                                        <div className={`absolute top-2 left-2 transition-opacity duration-200 ${selectedImageIds.includes(img.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedImageIds.includes(img.id) ? 'bg-purple-500 border-purple-500' : 'bg-white/80 border-white/80 shadow-sm'
                                                }`}
                                                onClick={e => { e.stopPropagation(); setSelectedImageIds(prev => prev && prev.includes(img.id) ? prev.filter(id => id !== img.id) : [...(prev || []), img.id]) }}
                                            >
                                                {selectedImageIds.includes(img.id) && (
                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>

                                        {/* Upload progress */}
                                        {img.temp && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <div className="text-center">
                                                    <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
                                                    <span className="text-white text-xs font-semibold">{img.uploadProgress || 0}%</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Infinite scroll sentinel + Load More */}
                        {hasMore && (
                            <div className="mt-6 text-center">
                                <div ref={loadMoreRef} className="h-1" />
                                <button
                                    disabled={loadingBatch}
                                    onClick={handleLoadMore}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all shadow-sm disabled:opacity-50"
                                >
                                    {loadingBatch ? (
                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    )}
                                    {loadingBatch ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}
