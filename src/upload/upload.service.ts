import { Injectable } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";
import * as streamifier from "streamifier";

@Injectable()
export class UploadService {
  /**
   * Sube una imagen a Cloudinary
   * @param file - Archivo a subir
   * @param folder - Carpeta en Cloudinary (ej: 'categories', 'products')
   * @returns URL de la imagen subida
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = "pop2go",
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "auto",
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param imageUrl - URL de la imagen a eliminar
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extraer el public_id de la URL
      const parts = imageUrl.split("/");
      const filename = parts[parts.length - 1];
      const publicId = filename.split(".")[0];
      const folder = parts[parts.length - 2];

      await cloudinary.uploader.destroy(`${folder}/${publicId}`);
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
      // No lanzamos error para no bloquear otras operaciones
    }
  }
}
