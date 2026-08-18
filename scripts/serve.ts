import path from "node:path";

const root = path.resolve(import.meta.dir, "../public");
const port = Number(process.env.PORT ?? 5173);
const fileFor = (pathname: string) => {
  const requested = pathname === "/" ? "/html/Index.html" : pathname;
  const filePath = path.resolve(root, `.${decodeURIComponent(requested)}`);
  return filePath.startsWith(root) ? filePath : null;
};

Bun.serve({
  port,
  hostname: "127.0.0.1",
  async fetch(request) {
    const filePath = fileFor(new URL(request.url).pathname);
    if (!filePath || !(await Bun.file(filePath).exists())) return new Response("Not found", { status: 404 });
    return new Response(Bun.file(filePath));
  }
});
console.log(`M-Music web frontend listening on http://127.0.0.1:${port}`);
