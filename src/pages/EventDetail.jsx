import React, { useEffect, useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import QRCode from 'qrcode'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export default function EventDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const [images, setImages] = useState([])
    const [persons, setPersons] = useState([])
    const [eventMeta, setEventMeta] = useState(null)
    const [isOwner, setIsOwner] = useState(false)
    const [isParticipant, setIsParticipant] = useState(false)
    const [shareQr, setShareQr] = useState(null)
    const fileRef = useRef()
    const objectUrlsRef = useRef(new Set())
    const navigate = useNavigate()
    const [deletingEvent, setDeletingEvent] = useState(false)

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

        // load persons
        fetch(`/api/persons?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            .then(r => r.json())
            .then(d => setPersons(d.data || []))
    }, [id, user])

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
                const contentType = resp.headers.get('Content-Type')
                let blob = await resp.blob()
                // If blob is empty (possible 304 or other cache behaviour), retry once forcing no-cache
                if (blob.size === 0) {
                    console.warn('[preload] empty blob for', img.id, 'retrying')
                    const r2 = await fetch(`/api/images/${img.id}`, { headers: { Authorization: auth }, cache: 'reload' })
                    if (r2.ok) {
                        blob = await r2.blob()
                    }
                }
                console.debug('[preload] image', img.id, 'content-type=', contentType, 'blob-size=', blob.size)
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
            // compress image before uploading to avoid large requests
            let uploadFile = file
            try {
                const options = { maxSizeMB: 1.5, maxWidthOrHeight: 1920, useWebWorker: true }
                uploadFile = await imageCompression(file, options)
            } catch (err) {
                console.warn('Image compression failed, using original file', err)
            }

            // read as base64
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(uploadFile)
            })
            const base64 = dataUrl.split(',')[1]

            let upload
            try {
                const resp = await fetch('/api/upload-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
                    body: JSON.stringify({ event_id: id, filename: file.name, content: base64 })
                })
                if (!resp.ok) {
                    const text = await resp.text()
                    console.error('Upload failed:', resp.status, text)
                    continue
                }
                upload = await resp.json()
            } catch (err) {
                console.error('Upload request error', err)
                continue
            }

            if (!upload?.data) { console.error('Upload failed', upload); continue }
            setImages(prev => [upload.data, ...prev])

            // Request server-side face detection (Hugging Face) for this image
            try {
                await fetch('/api/process-faces', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
                    body: JSON.stringify({ image_id: upload.data.id, event_id: id })
                })
                // refresh persons (server may process synchronously or shortly after)
                const p = await fetch(`/api/persons?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } }).then(r => r.json())
                setPersons(p.data || [])
            } catch (err) { console.warn('Register/process faces failed', err) }
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
            console.debug('[download] status=', resp.status, 'content-type=', resp.headers.get('Content-Type'), 'size=', blob.size)
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
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Event</h1>

            <div className="mb-4 flex items-center space-x-3">
                {eventMeta && <div className="font-medium">{eventMeta.event_name}</div>}
                {!isOwner && !isParticipant && (
                    <button onClick={handleJoinEvent} className="px-3 py-1 bg-blue-600 text-white rounded">Join Event</button>
                )}
                {isOwner && (
                    <>
                        <button onClick={handleCopyLink} className="px-3 py-1 bg-blue-600 text-white rounded">Copy Link</button>
                        <button onClick={handleDownloadQr} className="px-3 py-1 bg-green-600 text-white rounded">Download QR</button>
                        <button disabled={deletingEvent} onClick={handleDeleteEvent} className="px-3 py-1 bg-red-600 text-white rounded">{deletingEvent ? 'Deleting...' : 'Delete Event'}</button>
                    </>
                )}
                {shareQr && (
                    <img src={shareQr} alt="QR" className="h-28 w-28 border p-1" />
                )}
            </div>

            <div className="mb-6">
                <label className="block mb-2 font-medium">Upload images</label>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onSelectFiles} />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <h2 className="font-semibold mb-2">All Photos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {images.map(img => (
                            <div key={img.id} data-image-id={img.id} className="border rounded overflow-hidden">
                                <img src={img._objectUrl || undefined} alt="uploaded" className="w-full h-40 object-cover" loading="lazy" />
                                <div className="p-2 text-xs text-gray-600">{new Date(img.uploaded_at).toLocaleString()}</div>
                                <div className="p-2">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => downloadImage(img)} className="text-sm text-blue-600">Download</button>
                                        {img.uploaded_by === user?.id && (
                                            <button onClick={() => handleDeleteImage(img)} className="text-sm text-red-600">Delete</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="font-semibold mb-2">People</h2>
                    <div className="space-y-3">
                        {persons.map(p => (
                            <div key={p.id} className="p-2 border rounded">
                                <div className="font-medium">{p.label}</div>
                                <div className="text-sm text-gray-600">Photos: {/* count can be fetched via API later */}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

async function faceImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = URL.createObjectURL(blob)
    })
}


