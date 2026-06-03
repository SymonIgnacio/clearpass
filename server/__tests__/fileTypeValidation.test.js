const {
  detectFileType,
  validateUploadedFile,
} = require('../utils/fileTypeValidation');

const pdfBuffer = Buffer.from('%PDF-1.4\n');
const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const gifBuffer = Buffer.from('GIF89a');

describe('file type validation', () => {
  test('detects PDF and image signatures', () => {
    expect(detectFileType({ buffer: pdfBuffer })).toBe('pdf');
    expect(detectFileType({ buffer: pngBuffer })).toBe('png');
    expect(detectFileType({ buffer: jpegBuffer })).toBe('jpeg');
    expect(detectFileType({ buffer: gifBuffer })).toBe('gif');
  });

  test('accepts valid PDF and image uploads', () => {
    expect(validateUploadedFile({
      buffer: pdfBuffer,
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
    })).toMatchObject({ valid: true, detectedType: 'pdf' });

    expect(validateUploadedFile({
      buffer: pngBuffer,
      originalname: 'seal.png',
      mimetype: 'image/png',
    })).toMatchObject({ valid: true, detectedType: 'png' });
  });

  test('rejects spoofed extension and MIME combinations', () => {
    expect(validateUploadedFile({
      buffer: pngBuffer,
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
    })).toMatchObject({
      valid: false,
      error: 'Uploaded file extension does not match its content',
    });

    expect(validateUploadedFile({
      buffer: pdfBuffer,
      originalname: 'document.pdf',
      mimetype: 'image/png',
    })).toMatchObject({
      valid: false,
      error: 'Uploaded file MIME type does not match its content',
    });
  });

  test('rejects unknown file content', () => {
    expect(validateUploadedFile({
      buffer: Buffer.from('not a real image or pdf'),
      originalname: 'image.png',
      mimetype: 'image/png',
    })).toMatchObject({
      valid: false,
      error: 'Uploaded file content is not an allowed file type',
    });
  });

  test('rejects path-like filenames', () => {
    expect(validateUploadedFile({
      buffer: pdfBuffer,
      originalname: '../document.pdf',
      mimetype: 'application/pdf',
    })).toMatchObject({
      valid: false,
      error: 'Uploaded filename must not include path segments',
    });
  });

  test('rejects oversized files when a validator size limit is provided', () => {
    expect(validateUploadedFile({
      buffer: pdfBuffer,
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 6,
    }, ['pdf'], { maxSizeBytes: 5 })).toMatchObject({
      valid: false,
      error: 'Uploaded file exceeds the allowed size',
    });
  });
});
