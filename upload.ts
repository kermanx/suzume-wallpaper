import { readdirSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import crypto from 'crypto'

async function uploadString(content: string): Promise<string> {
  const buffer = Buffer.from(content);
  const md5Hash = crypto.createHash('md5').update(buffer).digest('hex')

  const formData = new globalThis.FormData();

  const file = new File([buffer], 'data.json', {
    type: 'application/json',
  });
  formData.append('files', file);

  const headers = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
    "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Microsoft Edge\";v=\"138\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "Referer": "https://xhfs0.ztytech.com/",
    'XueHai-MD5': md5Hash,
  };

  const response = await fetch("https://filesoss.yunzuoye.net/XHFileServer/file/upload/CA107011/", {
    method: 'POST',
    headers: headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} ${await response.text()}`);
  }

  const data: any = await response.json();
  return data.uploadFileDTO.fileId;
}

const EXCLUDED = [
  '香槟',
  '沉入海底',
  '下头',
  '不许睡',
  '洗衣机',
  '拆空调',
  '弃置于此',
  '寄',
  '纸片',
  '考研',
  '水下小猫',
  '浴霸',
  'clash',
  '升天',
  '电车go',
  '寄了',
  'a.png',
  'IEM',
  '要饭',
  '等待戈多',
  '不是时候',
  '被冲了',
  '撒了你',
  '小心台阶',
  '你醒啦',
  '自我管理',
  '梓',
  '撸猫',
  '飞机',
  '时间管理',
  '掀被子',
  '一人四熊',
  '深渊凝视',
  '足够了',
  '举盾',
  '传火',
  '突然出现',
  '17/再见',
  '心悸',
  '看',
  '比心',
  '贴',
  '瞪',
]

async function main() {
  console.log('正在读取图片文件...')
  
  const buffers = await Promise.all(
    readdirSync(resolve(import.meta.dirname, 'data'))
      .flatMap(dir => {
        const dirPath = resolve(import.meta.dirname, 'data', dir)
        return readdirSync(dirPath)
          .filter(filename => filename.endsWith('.png'))
          .map(filename => resolve(dirPath, filename))
      })
      .map(async filepath => {
        filepath = filepath.replaceAll('\\', '/')
        const buffer = await readFile(filepath)
        const isFeasible = EXCLUDED.every(str => !filepath.includes(str))
        return isFeasible ? buffer : null
      })
  )

  const files = buffers.filter((buffer) => buffer !== null)
  console.log(`共找到 ${files.length} 个有效图片文件`)

  console.log('正在生成 JSON...')
  const json = `[${files.map(content => `"data:image/png;base64,${content.toString('base64')}"`).join(',')}]`
  
  console.log(`JSON 大小: ${(json.length / 1024 / 1024).toFixed(2)} MB`)
  console.log('正在上传...')
  
  const cdn = await uploadString(json)
  
  console.log(`上传成功! CDN URL: ${cdn}`)
  
  await writeFile(resolve(import.meta.dirname, 'UPLOADED_URL'), cdn, 'utf-8')
  console.log('已保存到 UPLOADED_URL 文件')
}

main().catch(console.error)
