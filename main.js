const fs = require('fs')
const path = require('path')
const {promisify} = require('util')
const readdir = require('recursive-readdir')

async function main() {
    let folderPath = process.argv[2]
    let cssFiles = await readdir(folderPath, [
        (file, stats) => !stats.isDirectory() && path.extname(file) !== '.css'
    ])

    await Promise.all(cssFiles.map(file => (async () => {
        console.log(`Processing ${path.relative(folderPath, file)}...`)

        let css = await promisify(fs.readFile)(file, 'utf8')

        let newCSS = css
            .replace(
                /\.goban\s+(\.row\s+)?li(\.random_(\d+))?\.sign_(-1|0|1)(\.random_(\d+))?\s+\.stone\s+img/g,
                (_0, _1, _2, random1, sign, _3, random2) => {
                    let random = +(random1 || random2 || 0)
                    let randomClass = random !== 0 ? `.shudan-random_${random}` : ''

                    return `.shudan-stone-image.shudan-sign_${sign}${randomClass}`
                }
            )
            .replace(
                /([^\s}][^}]*,\s*)?\.goban\s*(,[^{]*)?{([^{}]*)}/g,
                (_0, _1, _2, body) => {
                    let urlRegex = /background(-image)?:[^;]*(url\([^)]*\))/
                    let boardBackgroundImage = (body.match(urlRegex) || [])[2]
                    let colorRegex = /background(-color)?:[^;]*(#[0-9a-f]{6}|rgba?\((\s*[\d\.]+\s*,?){3,4}\))/i
                    let boardBackgroundColor = (body.match(colorRegex) || [])[2]
                    let borderColorRegex = /border(-color)?:[^;]*(#[0-9a-f]{6}|rgba?\((\s*[\d\.]+\s*,?){3,4}\))/i
                    let borderColor = (body.match(borderColorRegex) || [])[2]

                    return [
                        (boardBackgroundColor || borderColor) && [
                            `.shudan-goban {`,
                            boardBackgroundColor && `    --shudan-board-background-color: ${boardBackgroundColor};`,
                            borderColor && `    --shudan-board-border-color: ${borderColor}`,
                            '}'
                        ].filter(x => !!x).join('\n'),
                        '',
                        boardBackgroundImage && [
                            '.shudan-goban-image {',
                            `    background-image: ${boardBackgroundImage}`,
                            '}'
                        ].join('\n'),
                        '',
                        `.DEPRECATED-goban {${body}}`,
                    ].join('\n')
                }
            )

        await promisify(fs.writeFile)(file, newCSS)

        console.log(`Done processing ${path.relative(folderPath, file)}.`)
    })()))

    console.log('Done.')
}

main()
.catch(console.log)
