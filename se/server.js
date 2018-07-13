const path = require('path');
const fs = require('fs');
const os = require('os');
const Koa = require('koa');
const route = require('koa-route');
const cors = require('@koa/cors');
const koaBody = require('koa-body');
const uuidv1 = require('uuid/v1');

const app = new Koa();
app.use(cors());
app.use(koaBody({ multipart: true }));
app.use(require('koa-static')('./mono_img_output'));

// 处理图片上传
app.use(route.post('/backend/api/images', async (ctx) => {
  await new Promise((res, rej) => {
    // 解析图片文件
    const file = ctx.request.files.pic;
    // 图片的存储路径
    // const savePath = path.join(__dirname, 'uploads', file.name);
    extname = path.extname(file.name);
    nameWithoutExt = file.name.slice(0, -1 * extname.length)
    const savePath = path.join(__dirname, 'uploads', `${nameWithoutExt}-${uuidv1()}${extname}`);
    console.log(savePath)
    // 将图片从临时存储复制到存储路径
    const reader = fs.createReadStream(file.path);
    const wstream = fs.createWriteStream(savePath, { flags: 'wx' });
    wstream.on('error', function (err) {
      if (err.code === 'EEXIST') {
        // 同名图片已经存在
        ctx.body = { msg: 'exist' };
        res();
      } else {
        rej(err);
      }
    });
    wstream.on('finish', async function () {
      try {
        let { outputPath, inputPath } = await createPyProcess(savePath);
        outputPath = path.basename(outputPath)
        inputPath = path.basename(inputPath)
        ctx.body = { msg: 'success', outputPath, inputPath };
      } catch (err) {
        ctx.body = { msg: 'createPyProcess fail', data: err };
      }
      res();
    });
    reader.pipe(wstream);
  });
}));

app.listen(3000, () => console.log('listen on 3000'));


function createPyProcess(targetPath) {
  // https://medium.freecodecamp.org/node-js-child-processes-everything-you-need-to-know-e69498fe970a
  return new Promise(function (success, nosuccess) {

    const { spawn } = require('child_process');
    const pyprog = spawn('python', ['../mono/mono_img.py', targetPath]);
    let inputPath = '';

    pyprog.stdout.on('data', function (data) {
      const pyStr = data.toString('utf8');
      const matchOutput = /(?:{-output-{)(.+)(?:}-output-})/.exec(pyStr);
      const matchInput = /(?:{-input-{)(.+)(?:}-input-})/.exec(pyStr);
      if (matchOutput && matchOutput[1]) {
        console.log('success: ', matchOutput[1]);
        success({ outputPath: matchOutput[1], inputPath });
      } else if (matchInput && matchInput[1]) {
        inputPath = matchInput[1];
      } else {
        console.log('log: ', pyStr);
      }
    });

    pyprog.stderr.on('data', (data) => {
      const errStr = data.toString('utf8');
      console.error('error:', errStr);
    });

    pyprog.on('close', () => {
      console.error('child process closed.');
      nosuccess('no output');
    });
  });
}
