// Generates icon-192.png and icon-512.png from the ClipperMark SVG
// Uses only Bun built-ins — no external deps needed.

const brass = "#37e780"; // primary green oklch(0.82 0.2 152) in the design
const bg = "#0A0F0C";    // near-black with green tint

function makeSvg(size: number): string {
  // Scale the 40×40 mark to fill the icon with padding
  const pad = size * 0.18;
  const inner = size - pad * 2;
  const scale = inner / 40;

  // Scaled path values (original viewBox 0 0 40 40)
  const s = (n: number) => (pad + n * scale).toFixed(2);
  const r = (n: number) => (n * scale).toFixed(2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- background -->
  <rect width="${size}" height="${size}" rx="${(size * 0.22).toFixed(0)}" fill="${bg}"/>
  <!-- outer ring subtle -->
  <rect x="${(size * 0.055).toFixed(1)}" y="${(size * 0.055).toFixed(1)}" width="${(size * 0.89).toFixed(1)}" height="${(size * 0.89).toFixed(1)}" rx="${(size * 0.175).toFixed(0)}" stroke="${brass}" stroke-opacity="0.35" stroke-width="${(size * 0.018).toFixed(1)}" fill="none"/>
  <!-- C arc -->
  <path
    d="M${s(27)} ${s(13.5)} C${s(25.4)} ${s(11.9)} ${s(23.3)} ${s(11)} ${s(21)} ${s(11)} C${s(16.6)} ${s(11)} ${s(13)} ${s(14.6)} ${s(13)} ${s(19)} L${s(13)} ${s(21)} C${s(13)} ${s(25.4)} ${s(16.6)} ${s(29)} ${s(21)} ${s(29)} C${s(23.3)} ${s(29)} ${s(25.4)} ${s(28.1)} ${s(27)} ${s(26.5)}"
    stroke="${brass}"
    stroke-width="${r(1.75)}"
    stroke-linecap="round"
    fill="none"
  />
  <!-- dot -->
  <circle cx="${s(28)}" cy="${s(28)}" r="${r(1.4)}" fill="${brass}"/>
</svg>`;
}

async function writePng(size: number, outPath: string) {
  const svg = makeSvg(size);
  // Bun can write SVG as-is; we actually need PNG.
  // We'll use the Bun FFI-free approach: write an HTML file, then use
  // the built-in fetch + OffscreenCanvas ... but Bun doesn't have DOM.
  // Fallback: write SVG and convert with sips (macOS built-in).
  const svgPath = outPath.replace(".png", ".svg");
  await Bun.write(svgPath, svg);

  const proc = Bun.spawn(
    ["sips", "-s", "format", "png", "--resampleHeightWidthMax", String(size), svgPath, "--out", outPath],
    { stderr: "pipe" }
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const err = await new Response(proc.stderr).text();
    console.error(`sips failed for ${size}px:`, err);
  } else {
    console.log(`✓ ${outPath} (${size}×${size})`);
    // Clean up temp SVG
    const fs = await import("fs");
    fs.unlinkSync(svgPath);
  }
}

await writePng(192, "public/icon-192.png");
await writePng(512, "public/icon-512.png");
