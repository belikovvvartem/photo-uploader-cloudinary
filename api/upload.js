import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Form parsing error' });
      return;
    }

    const file = files.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      const result = await cloudinary.uploader.upload(file[0].filepath, {
        folder: 'uploads',
      });
      res.status(200).json({ url: result.secure_url });
    } catch (error) {
      console.error('Cloudinary error:', error);
      res.status(500).json({ error: 'Upload to Cloudinary failed' });
    }
  });
}