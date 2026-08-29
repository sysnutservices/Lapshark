// The backend's multer file filter only accepts jpeg/jpg/png/gif/webp, and
// even if it didn't, the prebuilt sharp/libvips binary can't decode Apple's
// HEIC (HEVC-coded) files — only royalty-free AVIF shares the .heif
// container. iPhone photos default to HEIC, so every admin image upload
// (product Main Image, Gallery, and the AI Ecommerce Images workflow) needs
// this conversion client-side, before the file ever reaches an <input> file
// picker's result being sent to the server.
import heic2any from 'heic2any';

function looksLikeHeic(file: File): boolean {
    return file.type === 'image/heic' || file.type === 'image/heif' || /\.hei[cf]$/i.test(file.name);
}

// Returns the original file unchanged for anything that isn't HEIC/HEIF —
// callers can pipe every file-input selection through this unconditionally.
export async function ensureUploadableImage(file: File): Promise<File> {
    if (!looksLikeHeic(file)) return file;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const newName = file.name.replace(/\.hei[cf]$/i, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg' });
}
