import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Get,
  Param,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadFileDto, UploadFilesDto } from './dto/upload-file.dto';


// Increase to 15MB and add compression
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

@ApiTags('Uploads')
@Controller('uploads')
@ApiBearerAuth() // Add Swagger authentication documentation
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('single')
  @ApiOperation({ summary: 'Upload single image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully (auto-compressed if > 10MB)',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }), // 15MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|webp)' }), // Added webp support
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadSingle(file);
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadFilesDto,
    description: 'List of image files to upload',
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    type: [UploadResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FilesInterceptor('files', 10)) // Make sure field name matches 'files'
  async uploadMultiple(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png|webp)' }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    return this.uploadsService.uploadMultiple(files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all uploads' })
  @ApiResponse({
    status: 200,
    description: 'Returns all uploaded files',
    type: [UploadResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll() {
    return this.uploadsService.findAll();
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get upload by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns file details',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findById(@Param('id') id: string) {
    return this.uploadsService.findById(id);
  }

  @Delete('id/:id')
  @ApiOperation({ summary: 'Delete upload by ID' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeById(@Param('id') id: string) {
    return this.uploadsService.removeById(id);
  }

  @Patch('id/:id')
  @ApiOperation({ summary: 'Update upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @ApiResponse({
    status: 200,
    description: 'File updated successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }), // 15MB
          new FileTypeValidator({ fileType: '.(jpg|jpeg|png)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadsService.update(id, file);
  }
}
