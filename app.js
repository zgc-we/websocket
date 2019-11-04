const Koa = require('koa')
const WebSocket = require("koa-websocket")
const app = WebSocket(new Koa())
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')

const index = require('./routes/index')
const users = require('./routes/users')

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())

// -----------------------webSocket----------------------//
let ctxs = [];
app.listen(80);
app.ws.use((ctx, next) => {
  // console.log(JSON.stringify(ctx.websocket), '-----content-----')
  /* 每打开一个连接就往 上线文数组中 添加一个上下文 */
  ctxs.push(ctx);
  ctx.websocket.on("message", (message) => {
    console.log(message);
    for(let i = 0; i < ctxs.length; i++) {
      ctxs[i].websocket.send(message);
    }
  });
  ctx.websocket.on("close", (message) => {
      /* 连接关闭时, 清理 上下文数组, 防止报错 */
      let index = ctxs.indexOf(ctx);
      ctxs.splice(index, 1);
  });
});
// -----------------------webSocket----------------------//

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
