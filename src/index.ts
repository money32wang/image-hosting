import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

const app = new Hono<{ Bindings: { UPLOAD_API_HOST: string, SEND_API_HOST: string } }>();

app.get("/*", serveStatic({ root: "./public" }));

app.post("/upload", async (c) => {
    const body = await c.req.parseBody();
    const formData = new FormData();
    // Telegraph ignores filenames, so we can use any filename we want!
    formData.append("file", body.file as Blob, "test.png");
    return fetch(`${c.env.UPLOAD_API_HOST}/upload`, {
        method: "POST",
        body: formData,
    });
});

app.post("/send", async (c) => {
    const jsonData = await c.req.json() // for JSON body
    console.log("11111111", jsonData);
    return fetch(`${c.env.SEND_API_HOST}`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
    })
});

app.get("/file/:fileName", async (c) => {
    return fetch(`${c.env.UPLOAD_API_HOST}/file/${c.req.param("fileName")}`);
});

export default app;
