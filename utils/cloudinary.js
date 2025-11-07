import cloudinary from "cloudinary";

cloudinary.config({
  cloud_name: process.env.cloudinary_cloud_name,
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
});

export const uploadImage = async (filePath, folderPath = "pawning_system") => {
  try {
    // Allow callers to specify a folder path (e.g. "pawning_system/company_logos/company_1").
    // Keep default for backward-compatibility.
    const options = {};
    if (folderPath) options.folder = folderPath;

    const result = await cloudinary.v2.uploader.upload(filePath, options);
    return result.secure_url; // Return the secure URL of the uploaded image
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Image upload failed");
  }
};

// deleteImage function can be added if needed in the future
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw new Error("Image deletion failed");
  }
};
