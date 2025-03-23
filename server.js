require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { exec } = require("child_process");
const { promisify } = require("util");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;
const execPromise = promisify(exec);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Enable CORS
app.use(cors());

// API route to download and upload YouTube videos
app.get("/download", async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: "No URL provided" });
    }

    // Extract direct MP4 URL using yt-dlp
    const { stdout } = await execPromise(`yt-dlp -f mp4 --get-url "${videoUrl}"`);
    const directVideoUrl = stdout.trim();
    console.log("Direct Video URL:", directVideoUrl);

    // Download video into buffer
    const videoResponse = await axios.get(directVideoUrl, {
      responseType: "arraybuffer",
      timeout: 30000, // 30s timeout
    });

    const videoBuffer = Buffer.from(videoResponse.data);
    console.log("Video downloaded to buffer.");

    // Upload video to Cloudinary
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "video", invalidate: true },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(videoBuffer);
      });

    const uploadResponse = await uploadToCloudinary();
    res.json({ success: true, url: uploadResponse.secure_url });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
