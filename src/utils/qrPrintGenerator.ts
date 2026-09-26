import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface QrPrintOptions {
  restaurantName: string;
  tableNumber: string;
  shortCode: string;
  restaurantContact?: string;
  whatsappNumber?: string;
  address?: string;
}

// Single unique signature palette: Deep Royal Navy with 24K Gold
export const STAND_THEME = {
  name: 'Royal Sapphire Navy & 24K Gold',
  bgGradStart: '#091530',
  bgGradMid: '#142c62',
  bgGradEnd: '#060f24',
  goldBorder: '#fbbf24',
  goldAccent: '#f59e0b',
  goldLight: '#fef08a',
  tableBadgeBg: '#fbbf24',
  tableBadgeText: '#091530',
  qrDark: '#08132a',
};

/**
 * Robust helper to draw rounded rectangle
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Triggers guaranteed browser file download directly into Downloads folder
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Generates high quality QR Data URL (Large 800px)
 */
export async function generateQrDataUrl(shortCode: string, colorDark: string = STAND_THEME.qrDark): Promise<string> {
  const fullUrl = `${window.location.origin}/q/${shortCode}`;
  try {
    return await QRCode.toDataURL(fullUrl, {
      width: 800,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: colorDark,
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR Generation error:', err);
    return '';
  }
}

/**
 * Loads an image from Data URL into HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Core Canvas Engine: Standard Countertop UPI Stand Size (1000 x 1500 px, 2:3 ratio).
 * QR Code is HUGE (720x720px), Text is BIG and BOLD, completely filling the stand space.
 * 100% Canvas 2D - no small cramped text, no tiny QR, pixel-perfect!
 */
export async function renderStandToCanvas(options: QrPrintOptions): Promise<HTMLCanvasElement> {
  if ('fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const theme = STAND_THEME;
  const displayHost = window.location.host;
  const qrDataUrl = await generateQrDataUrl(options.shortCode, theme.qrDark);

  const contactPhone = options.restaurantContact || '9475388085';
  const whatsappNum = options.whatsappNumber || contactPhone;

  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1500;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. OUTER STAND CONTAINER (952 x 1452, 24px margin)
  const standX = 24;
  const standY = 24;
  const standW = 952;
  const standH = 1452;
  const standRadius = 38;

  // Stand shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 14;

  drawRoundedRect(ctx, standX, standY, standW, standH, standRadius);
  ctx.fillStyle = '#050a16';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // 2. MAIN GRADIENT BACKGROUND
  ctx.save();
  drawRoundedRect(ctx, standX, standY, standW, standH, standRadius);
  ctx.clip();

  const mainGrad = ctx.createLinearGradient(standX, standY, standX, standY + standH);
  mainGrad.addColorStop(0, theme.bgGradStart);
  mainGrad.addColorStop(0.35, theme.bgGradMid);
  mainGrad.addColorStop(1, theme.bgGradEnd);
  ctx.fillStyle = mainGrad;
  ctx.fillRect(standX, standY, standW, standH);

  // Subtle ambient glow
  const topGlow = ctx.createRadialGradient(500, 120, 10, 500, 120, 450);
  topGlow.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
  topGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = topGlow;
  ctx.fillRect(standX, standY, standW, 450);

  ctx.restore();

  // 3. GOLD RIM BORDER (Stand edge)
  ctx.save();
  drawRoundedRect(ctx, standX, standY, standW, standH, standRadius);
  const borderGrad = ctx.createLinearGradient(standX, standY, standX + standW, standY + standH);
  borderGrad.addColorStop(0, '#fef08a');
  borderGrad.addColorStop(0.3, theme.goldBorder);
  borderGrad.addColorStop(0.7, '#d97706');
  borderGrad.addColorStop(1, '#fef08a');
  ctx.lineWidth = 6;
  ctx.strokeStyle = borderGrad;
  ctx.stroke();
  ctx.restore();

  // 4. HEADER SECTION (TABLE BADGE, RESTAURANT NAME, 3-LANGUAGE TITLE)
  let curY = standY + 32;

  // TABLE BADGE (Large, bold, prominent at top)
  ctx.save();
  const tableText = `★ ${options.tableNumber.toUpperCase()} ★`;
  ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const tableBadgeWidth = Math.max(280, ctx.measureText(tableText).width + 60);
  const tableBadgeHeight = 48;
  const tableBadgeX = (1000 - tableBadgeWidth) / 2;

  drawRoundedRect(ctx, tableBadgeX, curY, tableBadgeWidth, tableBadgeHeight, 15);
  ctx.fillStyle = theme.tableBadgeBg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = theme.tableBadgeText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tableText, 500, curY + tableBadgeHeight / 2 + 1);
  ctx.restore();

  curY += tableBadgeHeight + 14;

  // RESTAURANT NAME (Large, Bold, Auto-scaled)
  ctx.save();
  let restFontSize = 50;
  ctx.font = `900 ${restFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  while (ctx.measureText(options.restaurantName.toUpperCase()).width > 880 && restFontSize > 28) {
    restFontSize -= 2;
    ctx.font = `900 ${restFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillText(options.restaurantName.toUpperCase(), 500, curY);
  ctx.restore();

  curY += restFontSize + 6;

  // Optional Address
  if (options.address) {
    ctx.save();
    ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`📍 ${options.address}`, 500, curY);
    ctx.restore();
    curY += 24;
  } else {
    curY += 2;
  }

  // 3-LANGUAGE ORDER HEADING (BIG & CLEAR)
  ctx.save();
  // English: SCAN TO ORDER
  ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = theme.goldBorder;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('⚡ SCAN TO ORDER ⚡', 500, curY);

  curY += 46;

  // Bengali & Hindi translations (Large, bold, crisp fonts)
  ctx.font = 'bold 24px "Hind Siliguri", "Noto Sans Bengali", "Noto Sans Devanagari", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('বাংলা: অর্ডার করতে স্ক্যান করুন   •   हिंदी: ऑर्डर करने के लिए स्कैन करें', 500, curY);
  ctx.restore();

  curY += 40;

  // 5. WHITE QR CARD (ENORMOUS - FILLS THE CENTRAL STAND!)
  // Width: 900 px, Height: 930 px
  const plateW = 900;
  const plateH = 930;
  const plateX = (1000 - plateW) / 2;
  const plateY = curY;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;

  drawRoundedRect(ctx, plateX, plateY, plateW, plateH, 28);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();
  ctx.restore();

  // Inside White Card:
  let innerY = plateY + 16;

  // QR CODE (GIANT 700 x 700 px - Huge & Dominated!)
  const qrSize = 700;
  const qrX = (1000 - qrSize) / 2;
  const qrY = innerY;

  ctx.save();
  if (qrDataUrl) {
    try {
      const qrImg = await loadImage(qrDataUrl);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    } catch (err) {
      console.error('Failed to load QR image on canvas', err);
    }
  }
  ctx.restore();

  innerY += qrSize + 16;

  // TABLE CODE & DIRECT LINK
  ctx.save();
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const codeLabel = 'Table Code: ';
  ctx.fillText(codeLabel, 440, innerY);

  const codeStr = ` ${options.shortCode} `;
  ctx.font = '900 26px monospace';
  const codeW = ctx.measureText(codeStr).width + 20;
  drawRoundedRect(ctx, 510, innerY - 4, codeW, 36, 8);
  ctx.fillStyle = '#eff6ff';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#3b82f6';
  ctx.stroke();
  ctx.fillStyle = '#1d4ed8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(options.shortCode, 510 + codeW / 2, innerY + 14);
  ctx.restore();

  innerY += 46;

  // RESTAURANT CONTACT / WHATSAPP (BIG & PROMINENT DIRECTLY ON WHITE CARD)
  ctx.save();
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (contactPhone === whatsappNum) {
    ctx.fillText(`📞 Call / WhatsApp: +91 ${contactPhone}`, 500, innerY);
  } else {
    ctx.fillText(`📞 Call: +91 ${contactPhone}   |   💬 WA: +91 ${whatsappNum}`, 500, innerY);
  }

  innerY += 34;

  // Short Direct URL
  ctx.font = '600 17px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`direct link: ${displayHost}/q/${options.shortCode}`, 500, innerY);

  innerY += 26;

  // Friendly Scan Tip
  ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.fillText('📱 Open Camera or any QR Scanner ➔ Scan to View Menu & Order', 500, innerY);
  ctx.restore();

  curY += plateH + 22;

  // 6. MANDATORY DIGIMOMS FOOTER (EXACT REQUIREMENT AS REQUESTED)
  ctx.save();
  // Gold divider
  const lineGrad = ctx.createLinearGradient(120, curY, 880, curY);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.6)');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, curY);
  ctx.lineTo(880, curY);
  ctx.stroke();

  curY += 16;

  // Line 1: Resturent Os Service Provide by DigiMoms (9475388085 WhatsApp)
  ctx.font = 'bold 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#f1f5f9';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Restaurant Os Service Provide by DigiMoms (9475388085 WhatsApp)', 500, curY);

  curY += 28;

  // Line 2: visit : www.digimoms.in
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = theme.goldBorder;
  ctx.fillText('visit : www.digimoms.in', 500, curY);
  ctx.restore();

  return canvas;
}

/**
 * Downloads Stand Card as High-Resolution PNG image.
 * File lands directly in the browser's Downloads folder!
 */
export async function downloadStandPng(options: QrPrintOptions): Promise<boolean> {
  try {
    const canvas = await renderStandToCanvas(options);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas toBlob failed');
          resolve(false);
          return;
        }
        const cleanRest = options.restaurantName.replace(/[^a-zA-Z0-9]/g, '_');
        const cleanTable = options.tableNumber.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `QR_Stand_${cleanRest}_${cleanTable}.png`;
        triggerBrowserDownload(blob, filename);
        resolve(true);
      }, 'image/png');
    });
  } catch (err) {
    console.error('Error downloading stand PNG:', err);
    return false;
  }
}

/**
 * Downloads Stand Card as standard 4" x 6" (100mm x 150mm) Standee PDF.
 */
export async function downloadStandPdf(options: QrPrintOptions): Promise<boolean> {
  try {
    const canvas = await renderStandToCanvas(options);
    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150],
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 100, 150, undefined, 'FAST');
    const cleanRest = options.restaurantName.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanTable = options.tableNumber.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `QR_Stand_${cleanRest}_${cleanTable}.pdf`;

    pdf.save(filename);

    try {
      const pdfBlob = pdf.output('blob');
      triggerBrowserDownload(pdfBlob, filename);
    } catch {
      // ignore
    }

    return true;
  } catch (err) {
    console.error('Error downloading stand PDF:', err);
    return false;
  }
}

/**
 * Backwards compatibility wrapper
 */
export async function generatePrintableQrPdf(options: QrPrintOptions): Promise<boolean> {
  return await downloadStandPdf(options);
}

/**
 * Direct print popup: Opens clean print window sized to 4x6" stand format
 */
export async function printStandDirectly(options: QrPrintOptions): Promise<boolean> {
  try {
    const canvas = await renderStandToCanvas(options);
    const imgData = canvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      return await downloadStandPdf(options);
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Stand - ${options.restaurantName} - ${options.tableNumber}</title>
          <style>
            @page {
              size: 100mm 150mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: #000;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              display: block;
            }
            @media print {
              body {
                background: none;
              }
              img {
                width: 100mm;
                height: 150mm;
              }
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
    return true;
  } catch (err) {
    console.error('Print stand failed:', err);
    return false;
  }
}
