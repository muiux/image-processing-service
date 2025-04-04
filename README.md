# 🎯 Image Processing Service

A NestJS-based image processing microservice designed for CMS integration on our casino platform. This service handles image uploads, converts them to WebP, generates type-specific image variations (e.g., for games and promotions), and provides cropping functionality.

---

## 🚀 Features

- ✅ Image upload and auto-conversion to WebP
- ✅ Type-specific image processing (Game, Promotion)
- ✅ Thumbnail and resized versions generation
- ✅ Cropping endpoint with custom dimensions
- ✅ Configurable image types and sizes
- ✅ Optimized for high traffic (rate limiting enabled)
- ✅ Supports large uploads via `multer`
- ✅ Runs locally or in Docker

---

## ⚙️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/)
- **Language**: TypeScript
- **Image Processing**: [Sharp](https://github.com/lovell/sharp)
- **File Uploads**: [Multer](https://github.com/expressjs/multer)
- **Rate Limiting**: [nestjs-rate-limiter](https://www.npmjs.com/package/nestjs-rate-limiter)

---

## 📌 Notes

Before running the image service, there are a few important points to consider:

In the requirements, it was specified that uploaded images should be converted to WebP format, followed by generating variations (e.g., thumbnails, resize), and then returning both the original and variation files. Additionally, it was mentioned that the variations should be named like `[original-filename]-thumbnail`.

Initially, to avoid naming conflicts when uploading files with identical names, we added a timestamp or UUID to the filenames. However, since you've defined a specific naming convention for variation files (e.g., `[original-filename]-thumbnail`), I decided to follow that rule. As a result, the solution I implemented involves:

1. Adding a UUID to the uploaded image to prevent conflicts during the upload process (handled by `multer`).
2. Converting the uploaded image into WebP format.
3. Removing the UUID from the image name to adhere to the required format for variations (e.g., `[original-filename]-thumbnail`).
4. Deleting the original uploaded file after processing.

While this solution meets the requirements, I recognize a potential issue from a user’s perspective. If users upload different images with the same filename, the output files might be overwritten due to the naming convention. This could lead to unexpected behavior where previously generated variations are replaced.

To address this concern, I recommend adding a UUID (or a timestamp, but a UUID is a better option) to both name of the original and variation output files. This would ensure uniqueness and prevent any unintended overwrites of image files.

---

## Image Processing Service Setup

### 1. Setup Without Docker

Follow these steps to set up the service without Docker:

1. Clone the repository:

```
git clone git@github.com:muiux/image-processing-service.git
```

2. Navigate to the project directory:

```
cd ./image-processing-service/image-processing-service
```

3. Install dependencies:

```
npm install
```

4. Create a `.env` file and copy the content from the `.env.example` file into your `.env` file:

```
cp .env.example .env
```

5. Start the service in development mode:

```
npm run start:dev
```

The service will be running one port 3000.

### 2. Setup With Docker

Follow these steps to set up the service using Docker:

1. Clone the repository:

```
git clone git@github.com:muiux/image-processing-service.git
```

2. Navigate to the project directory:

```
cd image-processing-service
```

3. Build and start the service using Docker Compose:

```
docker compose up --build
```

The service will be running one port 4000.

---

## 🧪 Endpoints

### 1. `POST /images/upload`

**Description**: Accepts image uploads and processes based on type.

**Form Data Parameters**:

- `file`: Image file
- `imageType`: `game` or `promotion`

**Processing Logic**:

- All images are converted to WebP if not already.
- Game Images:
  - Original (WebP)
  - Thumbnail (184x256)
- Promotion Images:
  - Original (WebP)
  - Resized (361x240)

Returns processed files in the response like below.

```
{
    "original": "http://localhost:3000/images\\uploads\\Large Banner.webp",
    "variation": "http://localhost:3000/images\\processed\\Large Banner-thumbnail.webp"
}
```

### 2. `POST /images/crop`

**Description**: Crops the uploaded image based on coordinates and dimensions.

**Form Data Parameters**:

- `file`: Image file
- `cropOptions`: JSON string

```json
{
  "x": 10,
  "y": 20,
  "width": 200,
  "height": 150,
  "outputFormat": "webp" // optional
}
```

**Example Response**

Returns the cropped image in the requested format as a stream.

---

## ⚡ Performance & Scalability

- 🔒 Rate Limiting: Prevent abuse during high traffic.
- 📂 Multer: Efficient handling of large file uploads.
- 🧩 Extending the Service
  - Update `imageConfig.ts` with the new type and variations.
  - Update any validation or business logic in the upload handler.
