import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm({ multiples: true, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Error parsing the form' });
    }

    // Normalize to array
    const fileArray = Array.isArray(files.file) ? files.file : (files.file ? [files.file] : []);

    if (!fileArray.length) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // If single file was sent, return single url for easier client handling
      if (fileArray.length === 1) {
        const file = fileArray[0];
        const result = await cloudinary.uploader.upload(file.filepath, { folder: 'uploads' });
        return res.status(200).json({ url: result.secure_url });
      }

      // If multiple (legacy), upload up to 10 and return array
      const urls = [];
      for (const file of fileArray.slice(0, 10)) {
        const result = await cloudinary.uploader.upload(file.filepath, { folder: 'uploads' });
        urls.push(result.secure_url);
      }

      return res.status(200).json({ urls });
    } catch (uploadError) {
      console.error('Cloudinary error:', uploadError);
      return res.status(500).json({ error: 'Upload failed' });
    }
  });
}
