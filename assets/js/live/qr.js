/* A QR code as a crisp SVG (the encoder is Project Nayuki's MIT-licensed library, in assets/vendor). Medium error
   correction, so a slightly blurry projector or a Teams screen share still scans. */
import qrcodegen from '../../vendor/qrcodegen-3c6d0b3/qrcodegen.js';

export function qrSVG(text, label) {
  const q = qrcodegen.QrCode.encodeText(String(text), qrcodegen.QrCode.Ecc.MEDIUM);
  const n = q.size, b = 3, size = n + 2 * b;
  let d = '';
  for (let y = 0; y < n; y++) {
    let run = -1;
    for (let x = 0; x <= n; x++) {
      const on = x < n && q.getModule(x, y);
      if (on && run < 0) run = x;
      if (!on && run >= 0) { d += 'M' + (run + b) + ' ' + (y + b) + 'h' + (x - run) + 'v1h-' + (x - run) + 'z'; run = -1; }
    }
  }
  return '<svg class="qr" viewBox="0 0 ' + size + ' ' + size + '" shape-rendering="crispEdges" role="img" aria-label="' + String(label || 'QR code').replace(/[<>&"]/g, '') + '">' +
    '<rect width="' + size + '" height="' + size + '" fill="#FFFFFF"/><path d="' + d + '" fill="#0B0D12"/></svg>';
}
