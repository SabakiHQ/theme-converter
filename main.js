const fs = require('fs')
const path = require('path')
const {promisify} = require('util')
const readdir = require('recursive-readdir')

async function main() {
    let folderPath = process.argv[2]
    let cssFiles = await readdir(folderPath, [
        (file, stats) => !stats.isDirectory() && path.extname(file) !== '.css'
    ])

    await Promise.all(
        cssFiles.map(file => (async () => {
            console.log(`Processing ${path.relative(folderPath, file)}...`)

            let css = await promisify(fs.readFile)(file, 'utf8')

            let newCss = css
                .replace(
                    /\.goban\s+(\.row\s+)?li(\.random_(\d+))?\.sign_(-1|0|1)(\.random_(\d+))?\s+\.stone\s+img/g,
                    (_0, _1, _2, random1, sign, _3, random2) => {
                        let random = +(random1 || random2 || 0)
                        let randomClass = random !== 0 ? `.shudan-random_${random}` : ''

                        return `.shudan-vertex.shudan-sign_${sign}${randomClass} .shudan-inner`
                    }
                )
                .replace(/\.goban\s+(\.row\s+)?li/g, '.shudan-vertex')
                .replace(
                    /(([^,{]+,\s*)*)\.goban((\s*,[^,{]+)*)\s*{([^{}])}/g,
                    (_0, before, _1, after, _2, body) => {
                        let colorRegex = /(#[0-9a-f]{6}|rgba?\((\s*[\d\.]+\s*,?){3,4}\))/i
                        let boardBackgroundColor = (body.match(colorRegex) || [])[0]

                        return [
                            `${before}.shudan-goban${after} {`,
                            '  ' + body.trim(),
                            boardBackgroundColor && `  --shudan-board-background-color: ${boardBackgroundColor};`,
                            '}'
                        ].filter(x => x).join('\n')
                    }
                )
                .replace(/\.goban/g, '.shudan-goban')

            console.log(`Done processing ${path.relative(folderPath, file)}.`)
        })())
    )

    console.log('Done.')
}

main()
.catch(console.log)
