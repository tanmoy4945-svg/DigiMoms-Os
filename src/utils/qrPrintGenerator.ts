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

// Single signature palette: Deep Royal Navy & 24K Gold
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
 * Core Canvas Engine: Standard Countertop Stand Size (1000 x 1500 px, 2:3 ratio).
 * Clean, concise, no extra text clutter.
 * QR and text fit the stand size with perfect spacing.
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

  // 1. OUTER STAND CONTAINER (950 x 1450, 25px margin)
  const standX = 25;
  const standY = 25;
  const standW = 950;
  const standH = 1450;
  const standRadius = 36;

  // Stand shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;

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
  const topGlow = ctx.createRadialGradient(500, 100, 10, 500, 100, 450);
  topGlow.addColorStop(0, 'rgba(251, 191, 36, 0.22)');
  topGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = topGlow;
  ctx.fillRect(standX, standY, standW, 450);

  ctx.restore();

  // 3. GOLD BORDER RIM
  ctx.save();
  drawRoundedRect(ctx, standX, standY, standW, standH, standRadius);
  const borderGrad = ctx.createLinearGradient(standX, standY, standX + standW, standY + standH);
  borderGrad.addColorStop(0, '#fef08a');
  borderGrad.addColorStop(0.3, theme.goldBorder);
  borderGrad.addColorStop(0.7, '#d97706');
  borderGrad.addColorStop(1, '#fef08a');
  ctx.lineWidth = 5;
  ctx.strokeStyle = borderGrad;
  ctx.stroke();
  ctx.restore();

  // 4. HEADER: TABLE BADGE + RESTAURANT NAME (SHORT & PUNCHY)
  let curY = standY + 30;

  // Table Badge
  ctx.save();
  const tableText = `★ ${options.tableNumber.toUpperCase()} ★`;
  ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const tableBadgeWidth = Math.max(280, ctx.measureText(tableText).width + 60);
  const tableBadgeHeight = 48;
  const tableBadgeX = (1000 - tableBadgeWidth) / 2;

  drawRoundedRect(ctx, tableBadgeX, curY, tableBadgeWidth, tableBadgeHeight, 14);
  ctx.fillStyle = theme.tableBadgeBg;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.fillStyle = theme.tableBadgeText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tableText, 500, curY + tableBadgeHeight / 2 + 1);
  ctx.restore();

  curY += tableBadgeHeight + 14;

  // Restaurant Name (Bold, scaled to never clip)
  ctx.save();
  let restFontSize = 48;
  ctx.font = `900 ${restFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  while (ctx.measureText(options.restaurantName.toUpperCase()).width > 860 && restFontSize > 28) {
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

  curY += restFontSize + 12;

  // 3-Language Order Heading (Short & Crisp)
  ctx.save();
  ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = theme.goldBorder;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('SCAN TO ORDER', 500, curY);

  curY += 44;

  ctx.font = 'bold 24px "Hind Siliguri", "Noto Sans Bengali", "Noto Sans Devanagari", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('অর্ডার করতে স্ক্যান করুন  |  ऑर्डर करने के लिए स्कैन करें', 500, curY);
  ctx.restore();

  curY += 38;

  // 5. CENTER WHITE QR CARD (LARGE & CLEAN)
  const plateW = 880;
  const plateH = 820;
  const plateX = (1000 - plateW) / 2;
  const plateY = curY;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;

  drawRoundedRect(ctx, plateX, plateY, plateW, plateH, 26);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();
  ctx.restore();

  // Inside White Card:
  let innerY = plateY + 18;

  // QR Code (GIANT 640 x 640 px)
  const qrSize = 640;
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

  // Table Code badge + WhatsApp Order info (Short & Crisp inside card)
  ctx.save();
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const codePillW = 340;
  const codePillH = 42;
  const codePillX = (1000 - codePillW) / 2;

  drawRoundedRect(ctx, codePillX, innerY, codePillW, codePillH, 10);
  ctx.fillStyle = '#eff6ff';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#3b82f6';
  ctx.stroke();

  ctx.fillStyle = '#1d4ed8';
  ctx.font = '900 24px monospace';
  ctx.fillText(`Table Code: ${options.shortCode}`, 500, innerY + codePillH / 2);
  ctx.restore();

  innerY += codePillH + 16;

  // SHORT WHATSAPP / CALL ORDER LINE (Requested by user)
  ctx.save();
  const waBarW = 680;
  const waBarH = 46;
  const waBarX = (1000 - waBarW) / 2;

  drawRoundedRect(ctx, waBarX, innerY, waBarW, waBarH, 12);
  ctx.fillStyle = '#ecfdf5';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#10b981';
  ctx.stroke();

  ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#047857';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`💬 WhatsApp Order / Call: +91 ${whatsappNum}`, 500, innerY + waBarH / 2);
  ctx.restore();

  curY += plateH + 28;

  // 6. MANDATORY DIGIMOMS FOOTER (EXACT REQUIREMENT AS REQUESTED)
  ctx.save();
  // Gold divider
  const lineGrad = ctx.createLinearGradient(120, curY, 880, curY);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.6)');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(120, curY);
  ctx.lineTo(880, curY);
  ctx.stroke();

  curY += 24;

  // Line 1: Resturent Os Service Provide by DigiMoms (9475388085 WhatsApp)
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#f1f5f9';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Restaurant Os Service Provide by DigiMoms (9475388085 WhatsApp)', 500, curY);

  curY += 32;

  // Line 2: visit : www.digimoms.in
  ctx.font = 'bold 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
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
