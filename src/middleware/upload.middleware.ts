import multer from 'multer';
import path from 'path';

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|avif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const upload = multer({
  storage: storage,  // Changed from diskStorage to memoryStorage
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: fileFilter,
});

const resumeFileFilter = (_req: any, file: any, cb: any) => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const allowedExtensions = /pdf|doc|docx/;
  const extensionValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (allowedMimeTypes.includes(file.mimetype) && extensionValid) {
    return cb(null, true);
  }

  cb(new Error('Only PDF, DOC, and DOCX resume files are allowed!'));
};

export const resumeUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: resumeFileFilter,
});
