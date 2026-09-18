import axios from 'axios';

// Kept in this file and under the old export name to avoid changing every
// controller at once. The implementation now delegates storage to the
// separate PHP upload server.
const getUploadConfig = () => {
  const uploadUrl = process.env.REMOTE_UPLOAD_URL?.trim();
  const uploadKey = process.env.REMOTE_UPLOAD_KEY?.trim();

  if (!uploadUrl || !uploadKey) {
    throw new Error(
      'Remote upload is not configured. Set REMOTE_UPLOAD_URL and REMOTE_UPLOAD_KEY.',
    );
  }

  return {
    uploadUrl,
    uploadKey,
    timeout: Number(process.env.REMOTE_UPLOAD_TIMEOUT_MS || 30_000),
  };
};

export const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder: string
): Promise<string> => {
  if (!file?.buffer || file.buffer.length === 0) {
    throw new Error('Upload file is empty');
  }

  const config = getUploadConfig();
  const form = new FormData();
  const blob = new Blob([file.buffer], {
    type: file.mimetype || 'application/octet-stream',
  });

  form.append('folder', folder);
  form.append('file', blob, file.originalname || 'upload');

  try {
    const response = await axios.post(config.uploadUrl, form, {
      headers: {
        'X-Upload-Key': config.uploadKey,
      },
      timeout: config.timeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: () => true,
    });

    const responseData = response.data as {
      success?: boolean;
      url?: string;
      message?: string;
    };

    if (response.status < 200 || response.status >= 300 || !responseData?.success || !responseData.url) {
      throw new Error(
        responseData?.message || `Remote upload failed with status ${response.status}`,
      );
    }

    return responseData.url;
  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Remote upload failed';
    throw new Error(`Remote upload failed: ${message}`);
  }
};
