// Inramning för interaktiva block (HTML-pussel från admin).
// Körs i en iframe med sandbox="allow-scripts" (utan allow-same-origin):
// koden får en egen isolerad origin och kommer inte åt appen, dess
// localStorage eller sessionen. CSP:n nedan stoppar externa skript, CSS
// och nätverksanrop – bara bilder, ljud och video (https) får hämtas.
// Samma inramning finns i admin (content.ejs → buildInteractiveDoc).

const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https: data:; media-src https: data:; font-src data:"

// Rapporterar dokumentets höjd till appen så att iframen kan växa med innehållet.
const HEIGHT_SCRIPT = `<script>(function(){
  var last = 0;
  function send(){
    var h = Math.ceil(document.documentElement.scrollHeight);
    if (h !== last) { last = h; parent.postMessage({ paplatsHeight: h }, '*'); }
  }
  if (window.ResizeObserver) new ResizeObserver(send).observe(document.documentElement);
  window.addEventListener('load', send);
  send();
})();</script>`

export function buildInteractiveDoc(html) {
  return '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">` +
    '<style>html,body{margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;color-scheme:light;}</style>' +
    '</head><body>' + (html || '') + HEIGHT_SCRIPT + '</body></html>'
}
