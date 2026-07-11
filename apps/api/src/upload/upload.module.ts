import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { ActivityModule } from '../activity/activity.module';

@Global()
@Module({
  imports: [ActivityModule],
  controllers: [FileController],
  providers: [CloudinaryService, FileService],
  exports: [CloudinaryService, FileService],
})
export class UploadModule {}
