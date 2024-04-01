import AWS from 'aws-sdk';
import express, { Request, Response } from 'express';
import multer from 'multer';

const upload = multer();

const app = express();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }

  const file = req.file;

  const params: AWS.S3.PutObjectRequest = {
    Bucket: process.env.AWS_S3_BUCKET_NAME || '', 
    Key: file.originalname,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3.upload(params).promise();
    res.status(200).send('File uploaded to S3 successfully!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading file to S3');
  }
});

