import { Router, Request, Response } from 'express';
import cloudinary from '../utils/cloudinary.js';
import { clientJwtAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/uploads/image - Upload image to Cloudinary
router.post('/image', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided',
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: 'fidscript',
      resource_type: 'auto',
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
    });
  }
});

// DELETE /api/uploads/image/:publicId - Delete image from Cloudinary
router.delete('/image/:publicId', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;

    const result = await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image',
    });
  }
});

export default router;