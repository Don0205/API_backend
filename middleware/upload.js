const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/'); // Destination directory for file uploads
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // File naming strategy (timestamp + original filename)
    }
});

const upload = multer({ storage: storage });

module.exports = upload;