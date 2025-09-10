const express = require("express");
const router = express.Router();
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");


const storage = multer.memoryStorage();
const upload = multer({ storage });


function streamUpload(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}


router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await streamUpload(req.file.buffer, {
      resource_type: "auto",
      folder: "findr_uploads",
      original_filename: req.file.originalname,
      use_filename: true,
      unique_filename: true,
    });

    res.json({
      message: "Upload successful",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed", error });
  }
});

module.exports = router;
