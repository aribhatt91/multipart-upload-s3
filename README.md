# Multipart Upload using S3

The purpose of this app is to demonstrate multipart upload following industry best practices.

The Multi-part Ulpload App has the following features
- Upload large files securely to S3 storage in chunks
- Upload multiple files at a time
- Pause and Resume file uploads
- Pause file uploads on Network drop and resume on network restoraion.
 
## Architecture Diagram
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
