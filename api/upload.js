import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';

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

    // нормалізуємо до масиву
    const fileArray = Array.isArray(files.file) ? files.file : (files.file ? [files.file] : []);

    if (!fileArray.length) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      // 🔹 завантажуємо лише один файл за раз, щоб уникнути 413
      const file = fileArray[0];
      const result = await cloudinary.uploader.upload(file.filepath, {
        folder: 'uploads',
      });

      return res.status(200).json({ url: result.secure_url });
    } catch (uploadError) {
      console.error('Cloudinary error:', uploadError);
      return res.status(500).json({ error: 'Upload failed' });
    }
  });
}
