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
app.use(require('koa-static')('./mono_video_output'));

// 处理图片上传
app.use(route.post('/backend/api/upload', async (ctx) => {
  await new Promise((res, rej) => {
    // 解析图片文件
    const file = ctx.request.files.upload;
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
        const isVideo = extname === '.mp4';
        let { outputPath, inputPath } = await createPyProcess(savePath, isVideo);
        outputPath = path.basename(outputPath)
        inputPath = path.basename(inputPath)
        ctx.body = { msg: 'success', outputPath, inputPath, isVideo };
      } catch (err) {
        ctx.body = { msg: 'createPyProcess fail', data: err };
      }
      res();
    });
    reader.pipe(wstream);
  });
}));

app.listen(3000, () => console.log('listen on 3000'));


function createPyProcess(targetPath, isVideo) {
  // https://medium.freecodecamp.org/node-js-child-processes-everything-you-need-to-know-e69498fe970a
  return new Promise(function (success, nosuccess) {

    const { spawn } = require('child_process');
    let pyProcess;
    if (isVideo) {
      pyProcess = spawn('python', ['../mono/mono_video.py', targetPath]);
    } else {
      pyProcess = spawn('python', ['../mono/mono_img.py', targetPath]);
    }
    let inputPath = '';

    pyProcess.stdout.on('data', function (data) {
      const pyStr = data.toString('utf8');
      const matchOutput = /(?:{-output-{)(.+)(?:}-output-})/.exec(pyStr);
      const matchInput = /(?:{-input-{)(.+)(?:}-input-})/.exec(pyStr);
      if (matchOutput && matchOutput[1]) {
        console.log('success: ', matchOutput[1]);
        success({ outputPath: matchOutput[1], inputPath });
      } else if (matchInput && matchInput[1]) {
        console.log('input path: ', matchInput[1]);
        inputPath = matchInput[1];
      } else {
        console.log('log: ', pyStr);
      }
    });

    pyProcess.stderr.on('data', (data) => {
      const errStr = data.toString('utf8');
      console.error('error:', errStr);
    });

    pyProcess.on('close', () => {
      console.error('child process closed.');
      nosuccess('no output');
    });
  });
}
