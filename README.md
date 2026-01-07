# Multipart Upload using S3

The purpose of this app is to demonstrate multipart upload following industry best practices.

It takes care of real life scenarios like loss of connectivity, closing browser etc.
 
## Architecture
                Browser (Client)
                │
                │ 1️⃣ POST /initiate
                ▼
                Backend (Node)
                │
                │ → CreateMultipartUpload (S3)
                │ ← uploadId
                │
                ▼
    ----------→ Browser
    |           │
    |           │ 2️⃣ POST /get-part-url (for part 1)
    |           ▼
    |           Backend
    |           │
    |           │ → generate presigned URL (UploadPart)
    |           │ ← signed URL
repeat for      │
all parts       ▼
    |           Browser
    |           │
    |           │ 3️⃣ PUT chunk → S3 (NOT backend)
    |           ▼
    |           S3
    |           │
    |           │ ← ETag
    |           ▼
    ------------Browser
                │
                │ 
                ▼
                Browser
                │
                │ 4️⃣ POST /complete (send ETags)
                ▼
                Backend
                │
                │ → CompleteMultipartUpload
                ▼
                S3
