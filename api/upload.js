import { v2 as cloudinary } from 'cloudinary';
import { IncomingForm } from 'formidable';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Error parsing form data' });
      return;
    }
    if (!files.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const file = files.file[0];

    try {
      const result = await cloudinary.uploader.upload(file.filepath, {
        folder: 'uploads',
      });
      res.status(200).json({ url: result.secure_url });
    } catch (error) {
      res.status(500).json({ error: 'Upload failed' });
    }
  });
}