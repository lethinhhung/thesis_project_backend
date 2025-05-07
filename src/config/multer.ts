import multer from 'multer';

// Thay đổi sang memory storage
const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // giới hạn 5MB
    },
});

export const documentUpload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // giới hạn 50MB
    },
});
