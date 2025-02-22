import { PNGCollectionEncoder, PngImage } from '@nouns/sdk';
import { promises as fs } from 'fs';
import path from 'path';
import { readPngImage } from './utils';

const DESTINATION = path.join(__dirname, '../src/image-data.json');

const encode = async () => {
  const encoder = new PNGCollectionEncoder();

  const partfolders = ['1-bodies', '2-accessories', '3-heads', '4-glasses'];
  for (const folder of partfolders) {
    console.log('1------------------')
    const folderpath = path.join(__dirname, '../images/v0', folder);
    console.log(`folderpath: ${folderpath}`)
    const files = await fs.readdir(folderpath);
    for (const file of files) {
      console.log(`file: ${file}`)
      const image = await readPngImage(path.join(folderpath, file));
      console.log('starting------------------')
      encoder.encodeImage(file.replace(/\.png$/, ''), image, folder.replace(/^\d-/, ''));
      console.log('finished ------------------')
    }
  }
  await fs.writeFile(
    DESTINATION,
    JSON.stringify(
      {
        bgcolors: ['d5d7e1', 'e1d7d5'],
        ...encoder.data,
      },
      null,
      2,
    ),
  );
};

encode();
