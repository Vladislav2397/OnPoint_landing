import imagemin from 'imagemin'
import imageminMozjpeg from 'imagemin-mozjpeg'
import imageminPngquant from 'imagemin-pngquant'
import fs, { promises as fsPromises } from 'fs'
import chokidar from 'chokidar'
import ncp from 'ncp'
import sharp from 'sharp'

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootPath = path.resolve(__dirname, '../')

const src = rootPath + '/src/assets/images/'
const dest = rootPath + '/dist/assets/images/'

const removeBrackets = function (string) {
    const brackets = string.match(/\[(.*?)\]/)
    if (brackets) {
        return string.replace(brackets[0], '')
    }
    return string
}

/**
 * @param {string} name - file name
 * @param {0 | 1 | 2} size - device index. Desktop, tablet, mobile
 * */
const toDeviceSizeName = function (name, size) {
    const devices = {
        [0]: 'desktop',
        [1]: 'tablet',
        [2]: 'mobile'
    }
    const execDotIndex = name.lastIndexOf('.')
    const fileName = name.slice(0, execDotIndex)
    const exec = name.slice(execDotIndex, name.length)

    return `${fileName}-${devices[size]}${exec}`
}

// creating watcher
const needToWatch = process.argv.indexOf('--webp') !== -1
let watcherObj = null
if (needToWatch) {
    watcherObj = chokidar.watch(src, {
        cwd: '.'
    })
}


// function that will recursively check images directory
const walkSync = async function (dir) {
    const files = await fsPromises.readdir(dir)

    files.forEach(file => {
        const ext = (`${dir}/${file}`).substring((`${dir}/${file}`).lastIndexOf('.') + 1, (`${dir}/${file}`).length)

        console.log('file', file, ext)

        if (fs.statSync(`${dir}/${file}`).isDirectory()) {
            // if file is a directory - open this directory
            walkSync(`${dir}/${file}`)
        } else if (ext === 'png' || ext === 'jpg') {
            // else optimize this file and generate webp
            const filename = (`${dir}/${file}`).replace(/^.*[\\\/]/, '')
            const matches = filename.match(/\[(.*?)\]/)
            /**
             * @type {number[]}
             * */
            let widths = []
            if (matches) {
                widths = matches[1].split('|').reduce((prev, curr) => [...prev, Number(curr)], [])
            }

            console.log('optimized', filename, matches, widths)

            Promise.all(widths.map(async (width, device) => {
                let webpFile = `${dir}/${filename}.webp`
                let classicFile = `${dir}/${filename}`

                if (widths.length > 1) {
                    webpFile = `${dir}/${toDeviceSizeName(`${removeBrackets(file).substring(0, removeBrackets(file).lastIndexOf('.'))}.webp`, device)}`
                    classicFile = `${dir}/${toDeviceSizeName(removeBrackets(file), device)}`
                } else {
                    webpFile = `${dir}/${removeBrackets(file).substring(0, removeBrackets(file).lastIndexOf('.'))}.webp`
                    classicFile = `${dir}/${removeBrackets(file)}`
                }

                console.log('webpFile', webpFile)
                console.log('classicFile', classicFile)

                await sharp(`${dir}/${file}`)
                    .resize({ width })
                    .webp({ quality: 80 })
                    .toFile(webpFile)

                const buffer = await sharp(`${dir}/${file}`)
                    .resize({ width })
                    .toBuffer()
                await fsPromises.access(`${dir}/${file}`, fs.constants.F_OK)
                await fsPromises.copyFile(`${dir}/${file}`, classicFile)
                await fs.writeFileSync(classicFile, buffer)

                await imagemin([classicFile], {
                    destination: `${dir}/`,
                    plugins: [
                        imageminMozjpeg(),
                        imageminPngquant({
                            quality: [0.6, 0.8]
                        })
                    ]
                })
            }))
                .then(() => {
                    fs.rmSync(`${dir}/${file}`)
                })
        }
    })
}
// entry point
export const buildImages = async function (done) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest)
    }

    fsPromises.rm(dest, { recursive: true })
        .then(() => fsPromises.mkdir(dest))
        .then(() => {
            console.log('images folder created')
            ncp(src, dest, () => {
                walkSync(dest.substring(0, dest.length - 1)).then()
            })
        }).then(done)
}

buildImages()
