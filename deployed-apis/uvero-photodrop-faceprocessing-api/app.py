import numpy as np
import cv2
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from ultralytics import YOLO
import insightface

from PIL import Image, ImageOps
import pillow_heif
import io

# Enable HEIC/HEIF support
pillow_heif.register_heif_opener()

app = FastAPI()

# ----------------------------
# Load Models (CPU mode)
# ----------------------------

yolo = YOLO("yolov8n.pt")

face_model = insightface.app.FaceAnalysis(name="buffalo_l")
face_model.prepare(ctx_id=-1)


# ----------------------------
# Utility: Normalize embedding
# ----------------------------

def normalize(vec):
    vec = np.array(vec, dtype=np.float32)
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec.tolist()
    return (vec / norm).tolist()


# ----------------------------
# Decode Image (JPEG/PNG/WEBP/HEIC/HEIF)
# ----------------------------

def decode_image(body: bytes):
    # 🔥 Fast path: OpenCV (JPEG/PNG/WebP)
    np_arr = np.frombuffer(body, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if image is not None:
        return image

    # 🔥 Fallback: Pillow (HEIC/HEIF support)
    try:
        image = Image.open(io.BytesIO(body))

        # Auto-rotate based on EXIF
        image = ImageOps.exif_transpose(image)

        image = image.convert("RGB")
        image_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        return image_np

    except Exception:
        return None


# ----------------------------
# Face Processing
# ----------------------------

def process_image_np(image_np):
    results = yolo(image_np)
    faces_output = []

    for r in results:
        boxes = r.boxes

        for box, cls, conf in zip(boxes.xyxy, boxes.cls, boxes.conf):
            if int(cls) != 0:  # YOLO class 0 = person
                continue

            if float(conf) < 0.4:
                continue

            xmin, ymin, xmax, ymax = map(int, box.cpu().numpy())

            h, w, _ = image_np.shape
            xmin = max(0, xmin)
            ymin = max(0, ymin)
            xmax = min(w, xmax)
            ymax = min(h, ymax)

            person_crop = image_np[ymin:ymax, xmin:xmax]
            if person_crop.size == 0:
                continue

            detected_faces = face_model.get(person_crop)

            for face in detected_faces:
                embedding = normalize(face.embedding)

                fxmin, fymin, fxmax, fymax = face.bbox.astype(int)

                faces_output.append({
                    "cx": float((fxmin + fxmax) / 2 + xmin),
                    "cy": float((fymin + fymax) / 2 + ymin),
                    "confidence": float(conf),
                    "box": {
                        "xmin": int(fxmin + xmin),
                        "ymin": int(fymin + ymin),
                        "xmax": int(fxmax + xmin),
                        "ymax": int(fymax + ymin)
                    },
                    "embedding": embedding
                })

    return faces_output


# ----------------------------
# API Endpoint
# ----------------------------

@app.post("/detect")
async def detect(request: Request):
    body = await request.body()

    if not body:
        return JSONResponse(
            {"error": "Empty request body"},
            status_code=400
        )

    image_np = decode_image(body)

    if image_np is None:
        return JSONResponse(
            {"error": "Unsupported or invalid image format"},
            status_code=400
        )

    result = process_image_np(image_np)
    return result


from fastapi import Response

# ----------------------------
# Convert Image To JPEG (For Browser Display)
# ----------------------------

@app.post("/convert")
async def convert(request: Request):
    body = await request.body()

    if not body:
        return JSONResponse(
            {"error": "Empty request body"},
            status_code=400
        )

    image_np = decode_image(body)

    if image_np is None:
        return JSONResponse(
            {"error": "Unsupported or invalid image format"},
            status_code=400
        )

    # Convert BGR -> RGB
    image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(image_rgb)

    buffer = io.BytesIO()
    pil_image.save(buffer, format="JPEG", quality=90)

    return Response(
        content=buffer.getvalue(),
        media_type="image/jpeg"
    )
