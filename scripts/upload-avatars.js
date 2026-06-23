const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Manually parse .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const s3Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});
const bucketName = env.R2_BUCKET_NAME || 'duotech';

const avtDir = 'C:\\Users\\Kim Tai\\Downloads\\avt';

async function uploadAll() {
  try {
    if (!fs.existsSync(avtDir)) {
      console.error(`Directory ${avtDir} does not exist.`);
      return;
    }

    const files = fs.readdirSync(avtDir);
    console.log(`Found ${files.length} avatar files in ${avtDir}`);
    
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = path.join(avtDir, fileName);
      const fileStream = fs.readFileSync(filePath);
      
      const ext = path.extname(fileName).toLowerCase().substring(1) || 'jpg';
      const key = `uploads/avt-${Date.now()}-${i}.${ext}`;
      
      console.log(`Uploading ${fileName} to R2 with key: ${key}...`);
      
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileStream,
          ContentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
        })
      );
      
      const fileUrl = `/api/uploads?key=${encodeURIComponent(key)}`;
      urls.push(fileUrl);
    }
    
    console.log('\n--- UPLOADED AVATAR URLS ---');
    console.log(JSON.stringify(urls, null, 2));
    
    // Save results to scripts/uploaded-urls.json
    fs.writeFileSync(path.join(__dirname, 'uploaded-urls.json'), JSON.stringify(urls, null, 2));
    console.log('Saved URLs to scripts/uploaded-urls.json');
  } catch (error) {
    console.error('Error uploading avatars:', error);
  }
}

uploadAll();
