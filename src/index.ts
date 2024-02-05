import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";


const host = `https://telegra.ph`;
const dingTalkHost = `https://msgpusher.com/push/money32wang`;
const app = new Hono();

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
    const jsonData = await c.req.json() // for JSON body
    console.log("11111111", jsonData);
    return fetch(dingTalkHost, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
    })
});

app.get("/file/:fileName", async (c) => {
    return fetch(`${host}/file/${c.req.param("fileName")}`);
});

export default app;
