export const S3_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.S3_BUCKET || ""
};

export const DB_CONFIG = {
  table: process.env.DB_TABLE || "",
  region: process.env.AWS_REGION || 'us-east-1',
};
