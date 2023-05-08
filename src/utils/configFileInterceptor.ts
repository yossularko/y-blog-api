import { MulterModuleOptions } from '@nestjs/platform-express';
import { diskStorage, MulterError } from 'multer';
import { Helper } from 'src/shared/helper';
import { fileTypeExt } from './fileTypeRegExp';
import { maxSize } from './maxSize';

export const configFileInterceptor = (field?: string): MulterModuleOptions => ({
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(fileTypeExt)) cb(null, true);
    else {
      cb(new MulterError('LIMIT_UNEXPECTED_FILE', field), false);
    }
  },
  limits: {
    fileSize: maxSize,
  },
  storage: diskStorage({
    destination: Helper.destinationPath,
    filename: Helper.customFileName,
  }),
});
