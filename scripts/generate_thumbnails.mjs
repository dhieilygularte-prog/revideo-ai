import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const galleryDir = path.resolve('public/scenarios/gallery');
const thumbsDir = path.join(galleryDir, 'thumbnails');

if (!fs.existsSync(thumbsDir)) {
  fs.mkdirSync(thumbsDir, { recursive: true });
}

const files = fs.readdirSync(galleryDir)
  .filter(f => f.endsWith('.png'))
  .sort((a, b) => parseInt(a) - parseInt(b));

console.log(`Found ${files.length} images. Processing thumbnails...`);

const scenarios = [];

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const num = i + 1; // 1 to 22
  const inputPath = path.join(galleryDir, file);
  const baseName = path.parse(file).name;
  const thumbName = `${baseName}.webp`;
  const thumbPath = path.join(thumbsDir, thumbName);

  // Generate 400px wide webp thumbnail
  await sharp(inputPath)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  const meta = await sharp(inputPath).metadata();

  scenarios.push({
    id: `cenario_${baseName}`,
    file: file,
    number: num,
    title: `Cenário ${num}`,
    thumbUrl: `/scenarios/gallery/thumbnails/${thumbName}`,
    fullUrl: `/scenarios/gallery/${file}`,
    width: meta.width,
    height: meta.height,
  });
}

console.log('Finished processing thumbnails. Total scenarios:', scenarios.length);

const outTs = `export interface AnaMariaScenarioItem {
  id: string;
  file: string;
  number: number;
  title: string;
  thumbUrl: string;
  fullUrl: string;
}

export const SCENARIO_GALLERY_ITEMS: AnaMariaScenarioItem[] = ${JSON.stringify(scenarios.map(s => ({
  id: s.id,
  file: s.file,
  number: s.number,
  title: s.title,
  thumbUrl: s.thumbUrl,
  fullUrl: s.fullUrl,
})), null, 2)};
`;

fs.writeFileSync(
  path.resolve('src/anamaria/scenarioGalleryData.ts'),
  outTs,
  'utf8'
);
console.log('Saved scenarioGalleryData.ts successfully!');
