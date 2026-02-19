import React, { useEffect, useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

// NOTE: face-api models must be loaded by the client; this component will attempt to load them from /models
// See README for model hosting instructions.

export default function EventDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const [images, setImages] = useState([])
    const [persons, setPersons] = useState([])
    const fileRef = useRef()
    const objectUrlsRef = useRef(new Set())

    useEffect(() => {
        if (!user) return
        fetch(`/api/events?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            .then(r => r.json())
            .then(async d => {
                const imgs = d.data || []
                setImages(imgs)
                preloadImageUrls(imgs)
            })

        // load persons
        fetch(`/api/persons?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            .then(r => r.json())
            .then(d => setPersons(d.data || []))
    }, [id, user])

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
                const resp = await fetch(`/api/images/${img.id}`, { headers: { Authorization: auth } })
                if (!resp.ok) return img
                const contentType = resp.headers.get('Content-Type')
                const blob = await resp.blob()
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

            // run face detection in browser if available
            if (window.faceapi) {
                try {
                    const img = await faceImageFromBlob(file)
                    const detections = await window.faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors()
                    const descriptors = detections.map(d => Array.from(d.descriptor))
                    if (descriptors.length) {
                        await fetch('/api/process-faces', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
                            body: JSON.stringify({ image_id: upload.data.id, event_id: id, descriptors })
                        })
                        // refresh persons
                        const p = await fetch(`/api/persons?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } }).then(r => r.json())
                        setPersons(p.data || [])
                    }
                } catch (err) { console.warn('Face detection failed', err) }
            }
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
            const resp = await fetch(`/api/images/${img.id}?download=1`, { headers })
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

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Event</h1>

            <div className="mb-6">
                <label className="block mb-2 font-medium">Upload images</label>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onSelectFiles} />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <h2 className="font-semibold mb-2">All Photos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {images.map(img => (
                            <div key={img.id} className="border rounded overflow-hidden">
                                <img src={img._objectUrl || undefined} alt="uploaded" className="w-full h-40 object-cover" loading="lazy" />
                                <div className="p-2 text-xs text-gray-600">{new Date(img.uploaded_at).toLocaleString()}</div>
                                <div className="p-2">
                                    <button onClick={() => downloadImage(img)} className="text-sm text-blue-600">Download</button>
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


