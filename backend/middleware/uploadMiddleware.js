const multer = require('multer');

const path = require('path');

 // Temporary storage location


// Middleware to handle file upload and rename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Temporary storage location
    },
    filename: (req, file, cb) => {
  
        cb(null, `${Date.now()}-${file.originalname}`); // Use UUID as the filename
    },
});

//file filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG , JPG and PNG are allowed.'), false);
    }
};



const upload = multer({ storage ,fileFilter}); // Adjust the field name as necessary

module.exports = upload; // Adjust the field name as necessary

 