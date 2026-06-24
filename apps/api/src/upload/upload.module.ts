import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileService } from './file.service';

@Global()
@Module({
  providers: [CloudinaryService, FileService],
  exports: [CloudinaryService, FileService],
})
export class UploadModule {}
