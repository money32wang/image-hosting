import { Hono } from "hono";
import { cors } from 'hono/cors'
import { serveStatic } from "hono/cloudflare-workers";

const host = `https://telegra.ph`;
const dingTalkHost = `https://connector.dingtalk.com/webhook/flow/51889f19465282ea4bac3a71`;
const app = new Hono();

app.use(
    '/webhook/*',
    cors({
      origin: '*',
      allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
      allowMethods: ['POST', 'GET', 'OPTIONS'],
      exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
      maxAge: 600,
      credentials: true,
    })
)

app.get("/", serveStatic({ root: "./public" }));

app.post("/upload", async (c) => {
  const body = await c.req.parseBody();
  const formData = new FormData();
  // Telegraph ignores filenames, so we can use any filename we want!
  formData.append("file", body.file as Blob, "test.png");
  return fetch(`${host}/upload`, {
    method: "POST",
    body: formData,
  });
});

app.post("/send", async (c) => {
    const body = await c.req.parseBody();
    const formData = new FormData();
    console.log('body===>', body);
    // Telegraph ignores filenames, so we can use any filename we want!
    formData.append("msgtype", "markdown");
    formData.append("markdown",  JSON.stringify({
        "title":"测试",
        "text": `#### Dida QA帮您传图这是您上传的图片![screenshot](${body.imageUrl})`
    }));

    return fetch(dingTalkHost, {
        method: "POST",
        body: formData,
    });
});


// app.post("/webhook/flow/51889f19465282ea4bac3a71", async (c) => {
//   const data = {
//     msgtype: 'markdown',
//     markdown: {
//       title: '测试',
//       text: `#### Dida QA帮您传图\n> 这是您上传的图片\n> ![screenshot](https://image.hi-ohmyideatalk.xyz/file/1cac5ace5e62d1bb15062.jpg)\n>`,
//     },
//   };
//
//   return fetch(`${dingTalkHost}/webhook/flow/51889f19465282ea4bac3a71`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(data),
//   })
// });

app.get("/file/:fileName", async (c) => {
  return fetch(`${host}/file/${c.req.param("fileName")}`);
});

export default app;
