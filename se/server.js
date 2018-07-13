const path = require('path');
const fs = require('fs');
const os = require('os');
const Koa = require('koa');
const route = require('koa-route');
const cors = require('@koa/cors');
const uuidv1 = require('uuid/v1');
const multer = require('koa-multer');

const app = new Koa();

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    originalname = file.originalname;
    extname = path.extname(originalname);
    nameWithoutExt = originalname.slice(0, -1 * extname.length);
    cb(null, `${nameWithoutExt}-${uuidv1()}${extname}`);
  }
})
const upload = multer({ storage });

app.use(async (ctx, next) => {
  console.log(`${Date.now().toLocaleString()} have request`);
  await next();
  console.log(`${Date.now().toLocaleString()} response send`);
});
app.use(cors());
app.use(require('koa-static')('./fe-static'));
app.use(require('koa-static')('./mono_img_output'));
app.use(require('koa-static')('./mono_video_output'));

// 处理图片上传
app.use(route.post('/backend/api/upload', upload.single('upload')));
app.use(route.post('/backend/api/upload', async (ctx) => {
  console.log(ctx.req.file.path);
  const savePath = ctx.req.file.path;
  const isVideo = extname === '.mp4';
  try {
    let { outputPath, inputPath } = await createPyProcess(savePath, isVideo);
    outputPath = path.basename(outputPath)
    inputPath = path.basename(inputPath)
    ctx.body = { msg: 'success', outputPath, inputPath, isVideo };
  } catch (err) {
    ctx.body = { msg: 'createPyProcess fail', data: err };
  }
}));

app.listen(3000, () => console.log('listen on 3000'));
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

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
