const path = require('path');
const fs = require('fs');
const os = require('os');
const Koa = require('koa');
const route = require('koa-route');
const cors = require('@koa/cors');
const koaBody = require('koa-body');

const app = new Koa();
app.use(cors());
app.use(koaBody({ multipart: true }));

// 处理图片上传
app.use(route.post('/backend/api/images', async (ctx) => {
  await new Promise((res, rej) => {
    // 解析图片文件
    const file = ctx.request.files.pic;
    // 图片的存储路径
    const savePath = path.join(__dirname, 'uploads', file.name);
    // 图片的访问url
    const apiName = path.posix.join('uploads', file.name);
    // 将图片从临时存储复制到存储路径
    const reader = fs.createReadStream(file.path);
    const wstream = fs.createWriteStream(savePath, { flags: 'wx' });
    wstream.on('error', function (err) {
      if (err.code === 'EEXIST') {
        // 同名图片已经存在
        ctx.body = { msg: 'exist', result: apiName };
        res();
      } else {
        rej(err);
      }
    });
    wstream.on('finish', function () {
      ctx.body = { msg: 'success', result: apiName };
      res();
    });
    reader.pipe(wstream);
  });
}));

app.listen(3000);
console.log('listen on 3000');