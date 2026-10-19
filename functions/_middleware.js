
const ORIGIN = "https://geagroupau.com";

const SERVICE_HOSTS = {
  "geagroupau.com": "geagroupau.pages.dev",
  "www.geagroupau.com": "geagroupau.pages.dev",
  "manager.geagroupau.com": "manager-geagroupau.lockleytimmy.workers.dev",
  "nextcloud.geagroupau.com": "nextcloud-geagroupau.lockleytimmy.workers.dev",
  "portainer.geagroupau.com": "portainer-geagroupau.lockleytimmy.workers.dev"
};

function rewriteUrl(value) {
  if (!value) return value;

  try {
    const url = new URL(value, ORIGIN);

    if (!["http:", "https:"].includes(url.protocol)) {
      return value;
    }

    const replacement = SERVICE_HOSTS[url.hostname.toLowerCase()];

    if (!replacement) return value;

    url.protocol = "https:";
    url.hostname = replacement;
    url.port = "";

    return url.toString();
  } catch {
    return value;
  }
}

class LinkRewriter {
  element(element) {
    for (const attribute of ["href", "src", "action"]) {
      const value = element.getAttribute(attribute);

      if (value) {
        element.setAttribute(attribute, rewriteUrl(value));
      }
    }
  }
}

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

  const location = outputHeaders.get("location");

  if (location) {
    outputHeaders.set("location", rewriteUrl(location));
  }

  const contentType =
    outputHeaders.get("content-type") || "";

  const isHtml = contentType.toLowerCase().includes("text/html");

  if (isHtml) {
    outputHeaders.delete("content-length");
    outputHeaders.delete("content-encoding");
    outputHeaders.delete("etag");
  }

  const result = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: outputHeaders
  });

  if (!isHtml || request.method === "HEAD") {
    return result;
  }

  return new HTMLRewriter()
    .on("a[href]", new LinkRewriter())
    .on("form[action]", new LinkRewriter())
    .on("img[src]", new LinkRewriter())
    .on("script[src]", new LinkRewriter())
    .on("link[href]", new LinkRewriter())
    .on("iframe[src]", new LinkRewriter())
    .transform(result);
}
