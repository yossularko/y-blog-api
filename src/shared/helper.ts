import { Request } from 'express';
import folderPath from 'src/utils/folderPath';

export class Helper {
  static customFileName(
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void,
  ) {
    const { originalname } = file;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extFile = originalname.substring(
      originalname.lastIndexOf('.') + 1,
      originalname.length,
    );

    const originalName = originalname.split('.')[0];
    callback(null, originalName + '-' + uniqueSuffix + '.' + extFile);
  }

  static destinationPath(
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void,
  ) {
    callback(null, `./public/${folderPath}`);
  }
}
