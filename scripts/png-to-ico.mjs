import { readFileSync, writeFileSync } from 'fs'

const pngPath = process.argv[2]
const icoPath = process.argv[3]

if (!pngPath || !icoPath) {
  console.error('Usage: node png-to-ico.mjs <input.png> <output.ico>')
  process.exit(1)
}

const pngData = readFileSync(pngPath)
const pngSize = pngData.length

// ICO format: https://en.wikipedia.org/wiki/ICO_(file_format)
// ICO header: 6 bytes
//   - reserved (2 bytes): 0
//   - type (2 bytes): 1 (icon)
//   - count (2 bytes): 1
//
// ICO directory entry: 16 bytes
//   - width (1 byte): 0 (=256)
//   - height (1 byte): 0 (=256)
//   - colors (1 byte): 0
//   - reserved (1 byte): 0
//   - planes (2 bytes): 1
//   - bpp (2 bytes): 32
//   - size (4 bytes): PNG size
//   - offset (4 bytes): 22 (6 header + 16 entry)

const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)   // reserved
header.writeUInt16LE(1, 2)   // type: ICO
header.writeUInt16LE(1, 4)   // count: 1 entry

const entry = Buffer.alloc(16)
entry.writeUInt8(0, 0)        // width: 0 = 256px
entry.writeUInt8(0, 1)        // height: 0 = 256px
entry.writeUInt8(0, 2)        // color palette: 0 (no palette)
entry.writeUInt8(0, 3)        // reserved
entry.writeUInt16LE(1, 4)     // planes
entry.writeUInt16LE(32, 6)    // bits per pixel
entry.writeUInt32LE(pngSize, 8)  // size of image data
entry.writeUInt32LE(22, 12)   // offset to image data

const icoData = Buffer.concat([header, entry, pngData])
writeFileSync(icoPath, icoData)
console.log(`Created ${icoPath} (${icoData.length} bytes)`)
