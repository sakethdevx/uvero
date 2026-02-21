import React, { useEffect, useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import QRCode from 'qrcode'
import JSZip from 'jszip'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function EventDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const [images, setImages] = useState([])
    const [persons, setPersons] = useState([])
    const [selectedPersonIds, setSelectedPersonIds] = useState([])
    const [editingPersonId, setEditingPersonId] = useState(null)
    const [editingName, setEditingName] = useState('')
    // computed stats
    const totalImages = images ? images.length : 0
    const totalPersons = persons ? persons.length : 0
    const processedImages = images ? images.filter(i => i.processed).length : 0
    const [eventMeta, setEventMeta] = useState(null)
    const [isOwner, setIsOwner] = useState(false)
    const [isParticipant, setIsParticipant] = useState(false)
    const [shareQr, setShareQr] = useState(null)
    const fileRef = useRef()
    const objectUrlsRef = useRef(new Set())
    const navigate = useNavigate()
    const [deletingEvent, setDeletingEvent] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [downloadingSelection, setDownloadingSelection] = useState(false)
    const [selectedImageIds, setSelectedImageIds] = useState([])
    const [showPeopleMenu, setShowPeopleMenu] = useState(false)
    const [zipProgress, setZipProgress] = useState(null)

    useEffect(() => {
        if (!user) return
        fetch(`/api/events?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            .then(r => r.json())
            .then(async d => {
                const payload = d.data || {}
                const imgs = payload.images || []
                setImages(imgs)
                preloadImageUrls(imgs)
                setEventMeta(payload.event || null)
                setIsOwner(Boolean(payload.isOwner))
                setIsParticipant(Boolean(payload.isParticipant))
            })

        // load persons (with optional thumbnail_image_id)
        fetch(`/api/persons?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            .then(r => r.json())
            .then(async d => {
                const ps = d.data || []
                // For each person with thumbnail_image_id, fetch blob and create object URL
                const auth = { Authorization: `Bearer ${user?.access_token || ''}` }

                function normalizeBox(box, imgW, imgH) {
                    if (!box) return null
                    let x, y, w, h
                    if (Array.isArray(box) && box.length >= 4) {
                        [x, y, w, h] = box
                    } else if (typeof box === 'object') {
                        // handle xmin/xmax/ymin/ymax
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
                            // center-based boxes (cx,cy,w,h)
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
                    // if values look normalized (0..1), convert to pixels
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
                    // clamp
                    x = Math.max(0, Math.min(x, imgW - 1))
                    y = Math.max(0, Math.min(y, imgH - 1))
                    w = Math.max(1, Math.min(w, imgW - x))
                    h = Math.max(1, Math.min(h, imgH - y))
                    return { x, y, w, h }
                }

                async function createCroppedUrlFromBlob(blob, box) {
                    try {
                        const bitmap = await createImageBitmap(blob)
                        const normalized = normalizeBox(box, bitmap.width, bitmap.height)
                        if (!normalized) {
                            const url = URL.createObjectURL(blob)
                            return url
                        }
                        // Add padding to reduce zoom (scale >1 increases crop area)
                        const PAD_SCALE = 1.4 // 40% padding around face
                        const cx = normalized.x + normalized.w / 2
                        const cy = normalized.y + normalized.h / 2
                        let newW = Math.round(normalized.w * PAD_SCALE)
                        let newH = Math.round(normalized.h * PAD_SCALE)
                        let newX = Math.round(cx - newW / 2)
                        let newY = Math.round(cy - newH / 2)
                        // clamp to image bounds
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
                        const url = URL.createObjectURL(croppedBlob)
                        return url
                    } catch (e) {
                        console.warn('Failed to crop thumbnail', e)
                        return URL.createObjectURL(blob)
                    }
                }

                await Promise.all(ps.map(async (p) => {
                    if (p.thumbnail_image_id) {
                        try {
                            const resp = await fetch(`/api/images?id=${encodeURIComponent(p.thumbnail_image_id)}`, { headers: auth, cache: 'no-store' })
                            if (!resp.ok) return
                            const blob = await resp.blob()
                            let url
                            if (p.thumbnail_box) {
                                url = await createCroppedUrlFromBlob(blob, p.thumbnail_box)
                            } else {
                                url = URL.createObjectURL(blob)
                            }
                            p._thumbUrl = url
                            objectUrlsRef.current.add(url)
                        } catch (e) {
                            console.warn('Failed to fetch person thumbnail', p.id, e)
                        }
                    }
                }))
                setPersons(ps)
            })
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
            // refresh persons
            const d = await fetch(`/api/persons?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } }).then(r => r.json())
            setPersons(d.data || [])
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
            const imgsToDownload = (selectedPersonIds && selectedPersonIds.length > 0
                ? images.filter(img => Array.isArray(img.person_ids) && img.person_ids.some(pid => selectedPersonIds.includes(pid)))
                : images)
            if (!imgsToDownload || imgsToDownload.length === 0) return
            setDownloadingSelection(true)
            await downloadImagesSeparately(imgsToDownload, headers)
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
            for (const img of imgArray) {
                try {
                    const resp = await fetch(`/api/images?id=${encodeURIComponent(img.id)}&download=1`, { headers, cache: 'no-store' })
                    if (!resp.ok) {
                        console.error('Download failed', resp.status, await resp.text())
                        continue
                    }
                    const blob = await resp.blob()
                    const filename = img.filename || `${img.id}.jpg`
                    zip.file(filename, blob)
                } catch (e) {
                    console.error('Failed to fetch for zip', img.id, e)
                }
            }
            setZipProgress(0)
            // allow a short delay so React can render the progress UI before heavy work
            await new Promise(resolve => setTimeout(resolve, 60))
            const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
                try { setZipProgress(Math.round(meta.percent)) } catch (e) { }
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
            for (const img of imgsToDownload) {
                try {
                    const resp = await fetch(`/api/images?id=${encodeURIComponent(img.id)}&download=1`, { headers, cache: 'no-store' })
                    if (!resp.ok) {
                        console.error('Download failed', resp.status, await resp.text())
                        continue
                    }
                    const blob = await resp.blob()
                    const filename = img.filename || `${img.id}.jpg`
                    zip.file(filename, blob)
                } catch (e) {
                    console.error('Failed to fetch for zip', img.id, e)
                }
            }
            setZipProgress(0)
            await new Promise(resolve => setTimeout(resolve, 60))
            const zipBlob = await zip.generateAsync({ type: 'blob' }, (meta) => {
                try { setZipProgress(Math.round(meta.percent)) } catch (e) { }
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
            const resp = await fetch('/api/join-event', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.access_token}` }, body: JSON.stringify({ event_id: id }) })
            if (!resp.ok) {
                const txt = await resp.text()
                console.error('Join failed', resp.status, txt)
                return
            }
            setIsParticipant(true)
            // refresh images
            const r = await fetch(`/api/events?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } }).then(r => r.json())
            const imgs = (r.data && r.data.images) || []
            setImages(imgs)
            preloadImageUrls(imgs)
        } catch (err) { console.error('Join error', err) }
    }

    async function handleShare() {
        try {
            const link = `${window.location.origin}/events/${id}`
            await navigator.clipboard.writeText(link)
            const data = await QRCode.toDataURL(link)
            setShareQr(data)
        } catch (err) { console.error('Share error', err) }
    }

    async function handleCopyLink() {
        try {
            const link = `${window.location.origin}/events/${id}`
            await navigator.clipboard.writeText(link)
            console.debug('Event link copied')
        } catch (err) { console.error('Copy link error', err) }
    }

    async function handleDownloadQr() {
        try {
            const link = `${window.location.origin}/events/${id}`
            const dataUrl = await QRCode.toDataURL(link)
            // trigger download
            const a = document.createElement('a')
            a.href = dataUrl
            a.download = `event-${id}-qr.png`
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

    async function preloadImageUrls(imgs) {
        if (!imgs || !imgs.length || !user) return
        const auth = `Bearer ${user?.access_token || ''}`
        const results = await Promise.all(imgs.map(async (img) => {
            try {
                const resp = await fetch(`/api/images?id=${encodeURIComponent(img.id)}`, { headers: { Authorization: auth }, cache: 'no-store' })
                console.debug('[preload] image', img.id, 'status=', resp.status)
                if (!resp.ok) return img
                let blob = await resp.blob()
                // If blob is empty (possible 304 or other cache behaviour), retry once forcing no-cache
                if (blob.size === 0) {
                    console.warn('[preload] empty blob for', img.id, 'retrying')
                    const r2 = await fetch(`/api/images/${img.id}`, { headers: { Authorization: auth }, cache: 'reload' })
                    if (r2.ok) {
                        blob = await r2.blob()
                    }
                }
                const url = URL.createObjectURL(blob)
                objectUrlsRef.current.add(url)
                return { ...img, _objectUrl: url }
            } catch (err) {
                console.warn('Failed to preload image', img.id, err)
                return img
            }
        }))
        setImages(results)
    }

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
                const p = await fetch(`/api/persons?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } }).then(r => r.json())
                setPersons(p.data || [])
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
            navigate('/events')
        } catch (err) {
            console.error('Delete event error', err)
            setDeletingEvent(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-semibold leading-tight">{eventMeta?.event_name || 'Event'}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">Images: <strong className="ml-2">{totalImages}</strong></span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">People: <strong className="ml-2">{totalPersons}</strong></span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">Processed: <strong className="ml-2">{processedImages}</strong></span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {shareQr && <img src={shareQr} alt="QR" className="h-16 w-16 rounded border p-1 bg-white" />}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isOwner && !isParticipant && (
                            <button onClick={handleJoinEvent} className="px-3 py-2 bg-blue-600 text-white rounded-md">Join Event</button>
                        )}
                        <button onClick={handleCopyLink} className="px-3 py-2 bg-gray-50 border rounded-md">Copy Link</button>
                        <button onClick={handleDownloadQr} className="px-3 py-2 bg-gray-50 border rounded-md">QR</button>
                        {isOwner && <button disabled={deletingEvent} onClick={handleDeleteEvent} className="px-3 py-2 bg-red-600 text-white rounded-md">{deletingEvent ? 'Deleting...' : 'Delete'}</button>}
                    </div>
                </div>
            </header>

            <section className="mb-6">
                <label className="block mb-2 font-medium">Upload images</label>
                <div
                    className={`border-dashed border-2 rounded-lg p-6 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                    onClick={() => fileRef.current && fileRef.current.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragEnter={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false) }}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); const dt = e.dataTransfer; if (dt && dt.files && dt.files.length) handleFiles(dt.files) }}
                >
                    <div className="text-sm text-gray-600">Drag & drop images here, or click to select files</div>
                    <div className="text-xs text-gray-400 mt-2">You can upload multiple images. Images will be compressed before upload.</div>
                    <input ref={fileRef} type="file" accept="image/*" multiple onChange={onSelectFiles} className="hidden" />
                </div>
            </section>

            <div className="grid md:grid-cols-3 gap-6">
                <aside className="md:col-span-1">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold">People</h2>
                        <div className="text-sm text-gray-500">{totalPersons} total</div>
                    </div>
                    <div className="space-y-3">
                        {persons.map(person => (
                            <div key={person.id} className={`flex items-center gap-3 p-3 rounded-lg shadow-sm ${selectedPersonIds && selectedPersonIds.includes(person.id) ? 'ring-2 ring-blue-300 bg-blue-50' : 'bg-white'}`}>
                                <div className="flex-shrink-0">
                                    {person._thumbUrl ? (
                                        <img src={person._thumbUrl} alt="face" className="h-12 w-12 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">?</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <button onClick={() => handleSelectPerson(person.id)} className="text-left w-full">
                                        <div className="flex items-center justify-between">
                                            <div className="truncate font-medium text-gray-800">{person.name || 'Unnamed'}</div>
                                            <div className="text-xs text-gray-500">{person.image_count || 0}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate mt-1">{person.latest_filename || ''}</div>
                                    </button>
                                </div>
                                <div>
                                    {editingPersonId === person.id ? (
                                        <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={() => handleSavePersonName(person.id)}>Save</button>
                                    ) : (
                                        <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => handleEditPerson(person)}>Edit</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="md:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold">Photos</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={handleDownloadSelected} disabled={downloadingSelection || !(selectedImageIds && selectedImageIds.length)} className="px-3 py-1 bg-gray-50 border rounded disabled:opacity-50">Download Selected</button>
                            <button disabled={downloadingSelection} onClick={async () => { try { setDownloadingSelection(true); await downloadImagesZip(images) } finally { setDownloadingSelection(false) } }} className="px-3 py-1 bg-gray-50 border rounded">Download All</button>
                        </div>
                    </div>

                    {downloadingSelection && zipProgress != null && (
                        <div className="mb-4">
                            <div className="w-full bg-gray-200 h-2 rounded">
                                <div className="bg-blue-600 h-2 rounded" style={{ width: `${zipProgress}%` }} />
                            </div>
                            <div className="text-xs text-gray-600 mt-1">{zipProgress}% preparing ZIP...</div>
                        </div>
                    )}

                    {selectedImageIds && selectedImageIds.length > 0 && (
                        <div className="mb-4 flex items-center gap-2">
                            <div className="text-sm text-gray-700">{selectedImageIds.length} selected</div>
                            <button onClick={() => setSelectedImageIds([])} className="px-2 py-1 bg-gray-100 rounded">Clear</button>
                            <button disabled={!(images && images.some(i => selectedImageIds.includes(i.id) && (isOwner || i.uploaded_by === user?.id)))} onClick={handleDeleteSelectedImages} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {(selectedPersonIds && selectedPersonIds.length > 0 ? images.filter(img => Array.isArray(img.person_ids) && img.person_ids.some(pid => selectedPersonIds.includes(pid))) : images).map(img => (
                            <div key={img.id} className={`relative overflow-hidden rounded-lg bg-gray-50 shadow-sm group ${selectedImageIds.includes(img.id) ? 'ring-2 ring-blue-400' : ''}`}>
                                <button className="absolute inset-0 focus:outline-none" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleImageSelection(img.id) }} aria-pressed={selectedImageIds.includes(img.id)} />
                                <img src={img._objectUrl || undefined} alt={img.filename || 'image'} className="w-full h-48 object-cover" loading="lazy" />
                                <div className="p-2 text-xs text-gray-600">{new Date(img.uploaded_at).toLocaleString()}</div>
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-end justify-end p-2">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); downloadImage(img) }} className="px-2 py-1 bg-white rounded">Download</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(img) }} className="px-2 py-1 bg-red-600 text-white rounded">Delete</button>
                                    </div>
                                </div>
                                {img.temp && (
                                    <div className="absolute left-2 top-2 bg-white/80 px-2 py-1 rounded text-xs">Uploading {img.uploadProgress || 0}%</div>
                                )}
                                <div className="absolute top-2 left-2">
                                    <input type="checkbox" checked={selectedImageIds.includes(img.id)} onChange={(e) => { e.stopPropagation(); setSelectedImageIds(prev => prev && prev.includes(img.id) ? prev.filter(id => id !== img.id) : [...(prev || []), img.id]) }} className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    )
}
