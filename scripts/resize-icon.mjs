import { nativeImage } from 'electron'
import { writeFileSync } from 'fs'

const src = process.argv[2]
const dst = process.argv[3]

if (!src || !dst) {
  console.error('Usage: node resize-icon.mjs <input.png> <output.png>')
  process.exit(1)
}

const img = nativeImage.createFromPath(src)
// Resize to 256x256 (standard icon max size)
const resized = img.resize({ width: 256, height: 256, quality: 'best' })
writeFileSync(dst, resized.toPNG())
console.log('Resized:', img.getSize(), '->', resized.getSize())
