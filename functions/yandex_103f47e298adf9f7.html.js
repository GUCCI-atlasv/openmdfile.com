export async function onRequest() {
  return new Response(
    `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: 103f47e298adf9f7</body>
</html>
`,
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "x-robots-tag": "noindex",
      },
    }
  );
}
