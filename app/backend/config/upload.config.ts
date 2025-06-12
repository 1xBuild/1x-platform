export const uploadConfig = {
  TEMP_DIR: 'temp-upload',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB for file uploads
  MAX_JSON_SIZE: '5mb', // 5MB for JSON payloads
} as const;
