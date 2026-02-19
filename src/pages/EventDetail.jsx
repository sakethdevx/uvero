import React, { useEffect, useState, useRef } from 'react'
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

    useEffect(() => {
        if (!user) return
        fetch(`/api/events?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            .then(r => r.json())
            .then(d => setImages(d.data || []))

        // load persons
        fetch(`/api/persons?event_id=${id}`, { headers: { Authorization: `Bearer ${user?.access_token || ''}` } })
            .then(r => r.json())
            .then(d => setPersons(d.data || []))
    }, [id, user])

    async function handleFiles(files) {
        if (!files || !files.length) return
        for (const file of Array.from(files)) {
            // read as base64
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(file)
            })
            const base64 = dataUrl.split(',')[1]

            const upload = await fetch('/api/upload-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.access_token || ''}` },
                body: JSON.stringify({ event_id: id, filename: file.name, content: base64 })
            }).then(r => r.json())

            if (!upload.data) { console.error('Upload failed', upload); continue }
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
                                <img src={`/api/images/${img.id}`} alt="uploaded" className="w-full h-40 object-cover" loading="lazy" />
                                <div className="p-2 text-xs text-gray-600">{new Date(img.uploaded_at).toLocaleString()}</div>
                                <div className="p-2">
                                    <a href={`/api/images/${img.id}?download=1`} className="text-sm text-blue-600">Download</a>
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
