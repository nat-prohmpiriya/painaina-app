# Watermark Remover Tool

## Overview

A simple web tool to remove AI-generated watermarks (Gemini, ChatGPT, Midjourney, etc.) from images.

## Problem Statement

AI image generators add small watermarks at the bottom corner of images. Users need a quick way to remove these watermarks for personal use.

## Target Watermarks

| Source | Position | Style |
|--------|----------|-------|
| Gemini | Bottom right | White text, small |
| ChatGPT/DALL-E | Bottom right | Colored signature |
| Midjourney | Bottom right | Small logo |

---

## Tech Stack

### Frontend
- **SvelteKit** - Fast, lightweight UI
- **TailwindCSS** - Styling

### Backend
- **Python (FastAPI)** - API server
- **OpenCV (cv2)** - Image processing
- **Pillow** - Image manipulation

### No AI Required
- Uses OpenCV `inpaint` algorithm (not machine learning)
- Fast processing
- Works offline

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│    SvelteKit    │  HTTP   │  Python FastAPI │
│    Frontend     │ ◄─────► │    Backend      │
└─────────────────┘         └─────────────────┘
        │                           │
   - Upload UI                 - OpenCV inpaint
   - Preview                   - Pillow crop
   - Download                  - Image processing
```

---

## Features

### MVP (Phase 1)

- [ ] Upload image (drag & drop, file picker)
- [ ] Preview original image
- [ ] Auto-detect watermark region (bottom corner)
- [ ] Remove watermark (crop method)
- [ ] Remove watermark (inpaint method)
- [ ] Preview result (before/after comparison)
- [ ] Download processed image
- [ ] Adjust crop size slider

### Phase 2 (Enhancement)

- [ ] Batch processing (multiple images)
- [ ] Custom region selection (manual mask)
- [ ] Multiple watermark presets (Gemini, ChatGPT, etc.)
- [ ] History/undo functionality
- [ ] Image format options (JPG, PNG, WebP)
- [ ] Quality settings

### Phase 3 (Advanced)

- [ ] Browser extension (right-click to remove)
- [ ] PWA support (offline use)
- [ ] API for external integrations

---

## API Endpoints

### POST /api/remove-watermark

Remove watermark from uploaded image.

**Request:**
```
Content-Type: multipart/form-data

file: <image file>
method: "crop" | "inpaint"
crop_height: number (optional, default: 30)
position: "bottom-right" | "bottom-left" | "bottom" (optional)
```

**Response:**
```json
{
  "success": true,
  "image": "<base64 encoded image>",
  "filename": "processed_image.jpg"
}
```

### POST /api/preview

Preview watermark detection without removing.

**Request:**
```
Content-Type: multipart/form-data

file: <image file>
```

**Response:**
```json
{
  "success": true,
  "detected_region": {
    "x": 500,
    "y": 700,
    "width": 150,
    "height": 40
  },
  "preview": "<base64 preview with highlighted region>"
}
```

---

## Core Algorithm

### Method 1: Crop (Simple)

```python
from PIL import Image

def crop_watermark(image_path, crop_height=30):
    img = Image.open(image_path)
    width, height = img.size
    cropped = img.crop((0, 0, width, height - crop_height))
    return cropped
```

### Method 2: Inpaint (Better Quality)

```python
import cv2
import numpy as np

def inpaint_watermark(image_path, region):
    image = cv2.imread(image_path)
    h, w = image.shape[:2]

    # Create mask for watermark region
    mask = np.zeros((h, w), dtype=np.uint8)
    x, y, rw, rh = region
    mask[y:y+rh, x:x+rw] = 255

    # Inpaint using Telea algorithm
    result = cv2.inpaint(image, mask, 3, cv2.INPAINT_TELEA)
    return result
```

---

## UI Components (Svelte)

```
src/
├── routes/
│   └── +page.svelte          # Main page
├── lib/
│   ├── components/
│   │   ├── ImageUploader.svelte
│   │   ├── ImagePreview.svelte
│   │   ├── BeforeAfter.svelte
│   │   ├── ToolPanel.svelte
│   │   └── CropSlider.svelte
│   └── api.ts                # API calls
└── app.css
```

---

## File Structure

```
watermark-remover/
├── frontend/                  # SvelteKit
│   ├── src/
│   ├── static/
│   ├── package.json
│   └── svelte.config.js
├── backend/                   # Python FastAPI
│   ├── main.py
│   ├── services/
│   │   └── image_processor.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Dependencies

### Frontend (package.json)
```json
{
  "dependencies": {
    "@sveltejs/kit": "^2.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

### Backend (requirements.txt)
```
fastapi==0.109.0
uvicorn==0.27.0
python-multipart==0.0.6
opencv-python==4.9.0
Pillow==10.2.0
```

---

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Deployment Options

| Option | Pros | Cons |
|--------|------|------|
| Docker Compose | Easy local setup | Need Docker |
| Vercel + Railway | Free tier available | Cold starts |
| VPS (DigitalOcean) | Full control | Monthly cost |

---

## Privacy Considerations

- Images are processed on server temporarily
- No images are stored permanently
- Option: Client-side processing with WebAssembly (future)

---

## Timeline Estimate

| Phase | Scope |
|-------|-------|
| Phase 1 | MVP - Basic crop & inpaint |
| Phase 2 | Enhanced features |
| Phase 3 | Extensions & API |

---

## Notes

- Start with crop method (simplest, works well)
- Add inpaint for better quality results
- Keep UI minimal and focused
- No AI/ML needed for this use case
