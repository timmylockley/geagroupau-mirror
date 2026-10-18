
const ORIGIN = "https://geagroupau.com";


const SERVICE_HOSTS = {
  "geagroupau.com": "geagroupau.pages.dev",
  "manager.geagroupau.com": "manager-geagroupau.lockleytimmy.workers.dev",
  "nextcloud.geagroupau.com": "nextcloud-geagroupau.lockleytimmy.workers.dev",
  "portainer.geagroupau.com": "portainer-geagroupau.lockleytimmy.workers.dev",
  "homepage.geagroupau.com": "homepage-geagroupau.lockleytimmy.workers.dev"
};

export async function onRequest(context) {
  const request = context.request;
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(
    incomingUrl.pathname + incomingUrl.search,
    ORIGIN
  );

  const headers = new Headers(request.headers);
  headers.delete("host");

  const response = await fetch(targetUrl.toString(), {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : request.body,
    redirect: "manual"
  });

  const outputHeaders = new Headers(response.headers);

  function rewriteUrl(value) {
    if (!value) return value;

    try {
      const url = new URL(value, ORIGIN);
      const replacement = SERVICE_HOSTS[url.hostname];

      if (!replacement || !["http:", "https:"].includes(url.protocol)) {
        return value;
      }

      url.protocol = "https:";
      url.hostname = replacement;
      url.port = "";

      return url.toString();
    } catch {
      return value;
    }
  }

  const location = outputHeaders.get("location");
  if (location) {
    outputHeaders.set("location", rewriteUrl(location));
  }

  const result = new Response(response.body, {
    status: response.status,
    headers: outputHeaders
  });

  const contentType = result.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    return result;
  }

  class LinkRewriter {
    element(element) {
      for (const attribute of ["href", "action"]) {
        const value = element.getAttribute(attribute);
        if (value) {
          element.setAttribute(attribute, rewriteUrl(value));
        }
      }
    }
  }

  return new HTMLRewriter()
    .on("a[href]", new LinkRewriter())
    .on("form[action]", new LinkRewriter())
    .transform(result);
}
