import multer from 'multer';

// Thay đổi sang memory storage
const storage = multer.memoryStorage();

export const upload = multer({ storage: storage });
