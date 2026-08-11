const { put } = require('@vercel/blob');

const isConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Uploads an image buffer (from multer's memoryStorage) to Vercel Blob and
 * returns its public URL. Works the same in local dev and in production as
 * long as BLOB_READ_WRITE_TOKEN is set — there is no local-disk fallback, so
 * behavior stays identical between environments.
 */
async function uploadImage(file, folder) {
  if (!isConfigured) {
    throw new Error('Image uploads are not configured — set BLOB_READ_WRITE_TOKEN in .env (Vercel dashboard → Storage → Blob).');
  }
  const ext = (file.originalname.match(/\.[^.]+$/) || [''])[0].toLowerCase();
  const filename = `${folder}/${folder}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  const blob = await put(filename, file.buffer, {
    access: 'public',
    contentType: file.mimetype,
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
  return blob.url;
}

module.exports = { isConfigured, uploadImage };
