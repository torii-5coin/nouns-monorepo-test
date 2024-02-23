import { promises as fs } from 'fs';
import { palette } from '../src/image-data.json';
import { ColorArray, Color } from "./lib/color";

/**
 * ドットエディタEDGEに読み込むためにテキスト出力するプログラム
 *
 * ref: https://qiita.com/www-tacos/items/994320b3394a21b90ef1
 */

const exportPalette = async (path: string) => {
  const colorElements = palette
      .filter(p => p!=='')
      .map(p => new Color('#' + p))

  const sortedColors = new ColorArray(...colorElements)
      .sortDefault(10, true)
      .reverse()

  const output = sortedColors.map(p => {
    return `${p.rgb.r}, ${p.rgb.g}, ${p.rgb.b},`
  })
  await fs.writeFile(path, output.join("\n"))
}

const outputFile = process.argv[2]
console.log(`outputFile: ${outputFile}`)
exportPalette(outputFile).then(() => {
  console.log('Finished')
})
