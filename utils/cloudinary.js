import fs from "fs";
import path from "path";
import axios from "axios";
import cloudinary from "cloudinary";

cloudinary.config({
  cloud_name: process.env.cloudinary_cloud_name,
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
});

function canUseAccountCenterStorage(companyId) {
  return Boolean(
    companyId &&
      process.env.ACCOUNT_CENTER_API_URL &&
      (process.env.COMPANY_STORAGE_API_KEY || process.env.CRON_JOB_API_KEY),
  );
}

function fileToDataUri(filePath) {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };
  const mimeType = mimeMap[ext] || "application/octet-stream";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function uploadViaAccountCenter({ companyId, userId, fileInput, folderPath }) {
  const baseURL = String(process.env.ACCOUNT_CENTER_API_URL || "").replace(
    /\/$/,
    "",
  );
  const apiKey =
    process.env.COMPANY_STORAGE_API_KEY || process.env.CRON_JOB_API_KEY;

  let image = fileInput;
  if (fs.existsSync(fileInput)) {
    image = fileToDataUri(fileInput);
  }

  const response = await axios.post(
    `${baseURL}/internal/company-storage/upload`,
    {
      companyId,
      userId: userId || null,
      image,
      folderPath,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      timeout: 120000,
    },
  );

  return response.data?.image || response.data?.url;
}

export const uploadImage = async (filePath, folderPath = "pawning", meta = {}) => {
  const companyId = meta.companyId;

  if (canUseAccountCenterStorage(companyId)) {
    try {
      const url = await uploadViaAccountCenter({
        companyId,
        userId: meta.userId,
        fileInput: filePath,
        folderPath: folderPath || "pawning/misc",
      });
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return url;
    } catch (error) {
      console.error(
        "Account Center storage upload failed, falling back to Cloudinary:",
        error?.response?.data || error.message,
      );
    }
  }

  try {
    const options = {};
    if (folderPath) options.folder = folderPath;
    const result = await cloudinary.v2.uploader.upload(filePath, options);
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Image upload failed");
  }
};

export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw new Error("Image deletion failed");
  }
};
