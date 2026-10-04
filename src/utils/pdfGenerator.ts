import jsPDF from 'jspdf';
import { Order, Restaurant } from '../types';

/**
 * Clean table number formatter to prevent "Table Table 01" duplication
 */
export function formatTableNumber(rawTable: string | undefined): string {
  if (!rawTable) return 'Table 01';
  const trimmed = rawTable.trim();
  const clean = trimmed.replace(/^Table\s*/i, '');
  return `Table ${clean || '01'}`;
}

/**
 * 1. Professional Standard Tax Invoice PDF (A4)
 * Beautiful, ultra-clean corporate typography, structured hierarchy,
 * and handles any number of items (from 1 to 100+ items) with clean auto-pagination!
 */
export function generateCustomerInvoicePdf(order: Order, restaurant: Restaurant, actorName?: string) {
  try {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2); // 182mm

    const cleanTable = formatTableNumber(order.table_number);
    const orderYear = new Date(order.created_at).getFullYear();
    const cleanOrderNum = (order.order_number || '000').replace('#', '');
    const billNumber = `INV-DGM-${orderYear}-${cleanOrderNum}`;
    const orderDate = new Date(order.created_at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const onlineAmt = Number(order.online_amount || 0);
    const cashAmt = Number(order.cash_amount || 0);
    const totalPaid = onlineAmt + cashAmt;
    const grandTotal = Number(order.grand_total || 0);
    const cashDue = Number(order.cash_due ?? Math.max(0, grandTotal - totalPaid));

    const isPaid = (order.payment_status as string) === 'paid_live' || 
                   (order.payment_status as string) === 'paid' || 
                   (order.payment_status as string) === 'paid_cash' || 
                   (order.payment_status as string) === 'paid_demo' || 
                   (order.payment_status as string) === 'paid_online' || 
                   (totalPaid >= grandTotal && grandTotal > 0);
    const isPartiallyPaid = !isPaid && ((order.payment_status as string) === 'partially_paid' || (order.payment_status as string) === 'partial' || totalPaid > 0);
    const statusText = isPaid ? 'PAID / SETTLED' : (isPartiallyPaid ? 'PARTIALLY PAID' : 'PAYMENT PENDING');

    const taxAmt = Number(order.tax || 0);
    const halfTax = (taxAmt / 2).toFixed(2);

    // Header rendering function with professional two-column layout
    const renderHeader = (isFirstPage: boolean, pageNum: number, totalPages?: number) => {
      let curY = 14;

      // Top brand accent line
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.rect(margin, curY, contentWidth, 2, 'F');
      curY += 7;

      if (isFirstPage) {
        // Left Column: Restaurant Info
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42); // slate-900
        const restName = (restaurant.name || 'Restaurant').toUpperCase();
        doc.text(restName, margin, curY);
        curY += 5.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105); // slate-600

        if (restaurant.address) {
          const addressLines = doc.splitTextToSize(restaurant.address, 105);
          doc.text(addressLines, margin, curY);
          curY += (addressLines.length * 3.8);
        }

        const phone = restaurant.contact_mobile || restaurant.owner_mobile;
        if (phone) {
          doc.text(`Phone: ${phone}`, margin, curY);
          curY += 3.8;
        }
        if (restaurant.contact_email) {
          doc.text(`Email: ${restaurant.contact_email}`, margin, curY);
          curY += 3.8;
        }

        // Legal Compliance Tags (GSTIN & FSSAI)
        const regTags: string[] = [];
        if (restaurant.gst) regTags.push(`GSTIN: ${restaurant.gst}`);
        if (restaurant.fssai) regTags.push(`FSSAI: ${restaurant.fssai}`);
        if (regTags.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(regTags.join('   |   '), margin, curY);
          curY += 5;
        }

        // Right Column: Professional Invoice Metadata Card
        const cardWidth = 66;
        const cardX = pageWidth - margin - cardWidth;
        const cardY = 21;
        const cardHeight = 34;

        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(203, 213, 225); // slate-300
        doc.setLineWidth(0.3);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

        // Invoice Header Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(16, 185, 129);
        doc.text('TAX INVOICE / BILL', cardX + (cardWidth / 2), cardY + 5.5, { align: 'center' });

        doc.setDrawColor(226, 232, 240);
        doc.line(cardX + 4, cardY + 7.5, cardX + cardWidth - 4, cardY + 7.5);

        // Meta fields
        doc.setFontSize(7.5);
        let metaY = cardY + 12;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('INVOICE NO:', cardX + 4, metaY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(billNumber, cardX + cardWidth - 4, metaY, { align: 'right' });
        metaY += 4.5;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('ORDER & TABLE:', cardX + 4, metaY);
        doc.setTextColor(15, 23, 42);
        doc.text(`${order.order_number} (${cleanTable})`, cardX + cardWidth - 4, metaY, { align: 'right' });
        metaY += 4.5;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('DATE & TIME:', cardX + 4, metaY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(orderDate, cardX + cardWidth - 4, metaY, { align: 'right' });
        metaY += 4.5;

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('PAYMENT STATUS:', cardX + 4, metaY);
        if (isPaid) doc.setTextColor(16, 185, 129);
        else if (isPartiallyPaid) doc.setTextColor(139, 92, 246);
        else doc.setTextColor(217, 119, 6);
        doc.text(statusText, cardX + cardWidth - 4, metaY, { align: 'right' });

        curY = Math.max(curY, cardY + cardHeight + 4);

        // Optional Customer Information Strip
        if (order.customer_mobile) {
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, curY, contentWidth, 6, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text(`Customer Mobile: ${order.customer_mobile}`, margin + 4, curY + 4.2);
          doc.text(`Dining Mode: Dine-in (${cleanTable})`, pageWidth - margin - 4, curY + 4.2, { align: 'right' });
          curY += 8;
        } else {
          curY += 2;
        }
      } else {
        // Continuation Header for subsequent pages
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`${(restaurant.name || 'Restaurant').toUpperCase()} — TAX INVOICE (CONTINUED)`, margin, curY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Invoice: ${billNumber} | Order ${order.order_number} (${cleanTable}) | Page ${pageNum}`, pageWidth - margin, curY, { align: 'right' });
        curY += 6;
      }

      return curY;
    };

    let currentPage = 1;
    let y = renderHeader(true, currentPage);

    // Food Items Table Header
    const drawTableHeader = (startY: number) => {
      doc.setFillColor(15, 23, 42); // slate-900 for distinct high-contrast header
      doc.rect(margin, startY, contentWidth, 7.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);

      doc.text('#', margin + 4, startY + 5.2);
      doc.text('ITEM DESCRIPTION', margin + 14, startY + 5.2);
      doc.text('QTY', margin + 115, startY + 5.2, { align: 'center' });
      doc.text('RATE (Rs.)', margin + 148, startY + 5.2, { align: 'right' });
      doc.text('AMOUNT (Rs.)', pageWidth - margin - 4, startY + 5.2, { align: 'right' });

      return startY + 9;
    };

    y = drawTableHeader(y);

    // Render items with dynamic page breaks (works smoothly for 10, 50, 100+ items!)
    const items = order.items || [];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    items.forEach((item, index) => {
      const splitName = doc.splitTextToSize(item.menu_name || 'Item', 92);
      const rowHeight = Math.max(splitName.length * 4.2, 6.8) + (item.special_instructions ? 4 : 0);

      // Check if page overflow will occur
      if (y + rowHeight > pageHeight - 55) {
        doc.addPage();
        currentPage += 1;
        y = renderHeader(false, currentPage);
        y = drawTableHeader(y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
      }

      // Alternate row background for clean readability
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 3.8, contentWidth, rowHeight, 'F');
      }

      const itemTotal = (item.quantity || 1) * (item.price || 0);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(`${index + 1}`, margin + 4, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(splitName, margin + 14, y);

      doc.setFont('helvetica', 'bold');
      doc.text(`${item.quantity}`, margin + 115, y, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.text(`${(item.price || 0).toFixed(2)}`, margin + 148, y, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.text(`${itemTotal.toFixed(2)}`, pageWidth - margin - 4, y, { align: 'right' });

      if (item.special_instructions) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`* Note: ${item.special_instructions}`, margin + 16, y + (splitName.length * 4));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
      }

      // Hairline row separator
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + rowHeight - 3.8, pageWidth - margin, y + rowHeight - 3.8);

      y += rowHeight;
    });

    // Check space for totals block; if not enough space, create new page
    if (y > pageHeight - 68) {
      doc.addPage();
      currentPage += 1;
      y = renderHeader(false, currentPage);
    }

    // Divider Line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    // Financial Calculation Block (Right Aligned Box)
    const totalBoxX = margin + 92;
    const totalBoxWidth = contentWidth - 92; // 90mm

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    // Subtotal
    doc.text('Subtotal (Food Sales):', totalBoxX, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${(order.subtotal || 0).toFixed(2)}`, pageWidth - margin - 4, y, { align: 'right' });
    y += 4.8;

    // Taxes (CGST & SGST Split if tax > 0)
    if (taxAmt > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('CGST (2.5%):', totalBoxX, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${halfTax}`, pageWidth - margin - 4, y, { align: 'right' });
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('SGST (2.5%):', totalBoxX, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${halfTax}`, pageWidth - margin - 4, y, { align: 'right' });
      y += 4.5;
    }

    if ((order.packaging_charge || 0) > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Packaging Charge:', totalBoxX, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${(order.packaging_charge || 0).toFixed(2)}`, pageWidth - margin - 4, y, { align: 'right' });
      y += 4.5;
    }

    if ((order.service_charge || 0) > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Service Charge:', totalBoxX, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs. ${(order.service_charge || 0).toFixed(2)}`, pageWidth - margin - 4, y, { align: 'right' });
      y += 4.5;
    }

    if ((order.online_discount || 0) > 0) {
      doc.setTextColor(16, 185, 129);
      doc.text('⚡ Online Pay Discount:', totalBoxX, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`-Rs. ${(order.online_discount || 0).toFixed(2)}`, pageWidth - margin - 4, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      y += 4.5;
    }

    if ((order.coupon_discount || 0) > 0) {
      doc.setTextColor(16, 185, 129);
      doc.text(`🎟️ Coupon (${order.coupon_code || 'PROMO'}):`, totalBoxX, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`-Rs. ${(order.coupon_discount || 0).toFixed(2)}`, pageWidth - margin - 4, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      y += 4.5;
    }

    // Grand Total Solid Banner
    y += 2;
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(totalBoxX, y, totalBoxWidth, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('GRAND TOTAL:', totalBoxX + 4, y + 6.2);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, pageWidth - margin - 4, y + 6.2, { align: 'right' });
    y += 13;

    // Payment Settlement Summary Box (Left)
    const settleBoxY = y - 33;
    if (settleBoxY > 30) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, settleBoxY, 82, 30, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text('PAYMENT SETTLEMENT', margin + 4, settleBoxY + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Online Paid: Rs. ${onlineAmt.toFixed(2)}`, margin + 4, settleBoxY + 11.5);
      doc.text(`Cash Paid: Rs. ${cashAmt.toFixed(2)}`, margin + 4, settleBoxY + 16.5);
      
      if (cashDue > 0) {
        doc.setTextColor(180, 83, 9);
        doc.setFont('helvetica', 'bold');
        doc.text(`Cash Due: Rs. ${cashDue.toFixed(2)}`, margin + 4, settleBoxY + 21.5);
      } else {
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.text(`Settlement Status: Fully Settled`, margin + 4, settleBoxY + 21.5);
      }

      if (order.payu_txnid || order.payu_mihpayid || order.razorpay_payment_id) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        const txnId = order.payu_txnid || order.payu_mihpayid || order.razorpay_payment_id;
        doc.text(`Txn ID: ${txnId}`, margin + 4, settleBoxY + 26.5);
      } else if (actorName || order.verified_by) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Verified By: ${actorName || order.verified_by}`, margin + 4, settleBoxY + 26.5);
      }
    }

    // Professional Footer
    const footerY = Math.min(y + 8, pageHeight - 14);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for dining with us! Please visit again.', pageWidth / 2, footerY, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Computer-generated tax invoice authenticated by DigiMoms Smart Restaurant OS.', pageWidth / 2, footerY + 4, { align: 'center' });

    // Download PDF with descriptive clean name
    const sanitizedRest = (restaurant.name || 'Restaurant').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Invoice_${sanitizedRest}_${order.order_number}_${cleanTable.replace(/\s+/g, '')}.pdf`);
  } catch (err) {
    console.error("Customer Invoice PDF Error:", err);
  }
}

/**
 * 2. Continuous-Roll 80mm POS Thermal Receipt Slip
 * Specifically designed for 80mm POS thermal receipt printers.
 * Calculates exact dynamic continuous roll height to comfortably fit 1 to 100+ items without cutoff!
 */
export function generateThermalReceiptPdf(order: Order, restaurant: Restaurant) {
  try {
    const cleanTable = formatTableNumber(order.table_number);
    const orderYear = new Date(order.created_at).getFullYear();
    const cleanOrderNum = (order.order_number || '000').replace('#', '');
    const billNumber = `INV-DGM-${orderYear}-${cleanOrderNum}`;
    const orderDate = new Date(order.created_at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const items = order.items || [];

    // Pre-calculate exact thermal paper roll height based on every single item's actual line wrapping
    // We create a temporary doc to measure exact line splits
    const probeDoc = new jsPDF({ unit: 'mm', format: [80, 500] });
    probeDoc.setFont('helvetica', 'normal');
    probeDoc.setFontSize(7.5);

    let totalItemsHeight = 0;
    items.forEach((item) => {
      const splitName = probeDoc.splitTextToSize(item.menu_name || 'Item', 38);
      const rowH = Math.max(splitName.length * 3.6, 5) + (item.special_instructions ? 3.5 : 0);
      totalItemsHeight += rowH;
    });

    // Base header: ~55mm
    // Metadata: ~28mm
    // Table Header: ~7mm
    // Totals + GST: ~38mm
    // Payment settlement: ~25mm
    // Footer + tear: ~25mm
    // Safety buffer: 18mm
    const baseHeight = 196;
    const dynamicTotalHeight = Math.max(160, Math.ceil(baseHeight + totalItemsHeight));

    // Initialize continuous roll PDF with EXACT calculated height (no cutoff even with 100 items!)
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, dynamicTotalHeight]
    });

    const margin = 4;
    const rightMargin = 76;
    const printableWidth = rightMargin - margin; // 72mm
    const centerX = 40;
    let y = 7;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.text('DigiMoms POS Thermal Slip', centerX, y, { align: 'center' });
    y += 4.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text((restaurant.name || 'Restaurant').toUpperCase(), centerX, y, { align: 'center' });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    if (restaurant.address) {
      const splitAddr = doc.splitTextToSize(restaurant.address, 68);
      doc.text(splitAddr, centerX, y, { align: 'center' });
      y += (splitAddr.length * 3.3);
    }

    const contactPhone = restaurant.contact_mobile || restaurant.owner_mobile;
    if (contactPhone) {
      doc.text(`Ph: ${contactPhone}`, centerX, y, { align: 'center' });
      y += 3.2;
    }

    if (restaurant.gst) {
      doc.setFont('helvetica', 'bold');
      doc.text(`GSTIN: ${restaurant.gst}`, centerX, y, { align: 'center' });
      y += 3.2;
    }
    if (restaurant.fssai) {
      doc.setFont('helvetica', 'normal');
      doc.text(`FSSAI Lic: ${restaurant.fssai}`, centerX, y, { align: 'center' });
      y += 3.2;
    }

    // Dashed Divider Line
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, rightMargin, y);
    doc.setLineDashPattern([], 0);
    y += 3.5;

    // Order Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`BILL #: ${billNumber}`, margin, y);
    y += 3.5;
    doc.text(`ORDER: ${order.order_number}`, margin, y);
    doc.text(`TABLE: ${cleanTable}`, rightMargin, y, { align: 'right' });
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Date: ${orderDate}`, margin, y);
    y += 3.5;

    if (order.customer_mobile) {
      doc.text(`Customer: ${order.customer_mobile}`, margin, y);
      y += 3.5;
    }

    const onlineAmt = Number(order.online_amount || 0);
    const cashAmt = Number(order.cash_amount || 0);
    const totalPaid = onlineAmt + cashAmt;
    const grandTotal = Number(order.grand_total || 0);
    const isPaid = (order.payment_status as string) === 'paid_live' || 
                   (order.payment_status as string) === 'paid' || 
                   (order.payment_status as string) === 'paid_cash' || 
                   (order.payment_status as string) === 'paid_demo' || 
                   (order.payment_status as string) === 'paid_online' || 
                   (totalPaid >= grandTotal && grandTotal > 0);
    const statusText = isPaid ? 'PAID' : 'PENDING';
    doc.setFont('helvetica', 'bold');
    doc.text(`Status: ${statusText}`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mode: ${(order.payment_mode || 'Cash').toUpperCase()}`, rightMargin, y, { align: 'right' });
    y += 3.5;

    // Table Header
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, rightMargin, y);
    doc.setLineDashPattern([], 0);
    y += 3.2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('ITEM', margin, y);
    doc.text('QTY', 46, y, { align: 'right' });
    doc.text('RATE', 59, y, { align: 'right' });
    doc.text('TOTAL', rightMargin, y, { align: 'right' });
    y += 2.2;

    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, rightMargin, y);
    doc.setLineDashPattern([], 0);
    y += 3.2;

    // Items List
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    items.forEach((item) => {
      const splitName = doc.splitTextToSize(item.menu_name || 'Item', 38);
      const amt = ((item.quantity || 1) * (item.price || 0)).toFixed(2);

      doc.text(splitName, margin, y);
      doc.text(`${item.quantity}`, 46, y, { align: 'right' });
      doc.text(`${(item.price || 0).toFixed(2)}`, 59, y, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(`${amt}`, rightMargin, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      y += Math.max(splitName.length * 3.5, 4.2);

      if (item.special_instructions) {
        doc.setFontSize(6.5);
        doc.setTextColor(80);
        doc.text(`* ${item.special_instructions}`, margin + 2, y);
        doc.setTextColor(0);
        doc.setFontSize(7.5);
        y += 3;
      }
    });

    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, y, rightMargin, y);
    doc.setLineDashPattern([], 0);
    y += 3.5;

    // Financial Totals
    doc.setFontSize(7.5);
    doc.text('Subtotal:', 46, y, { align: 'right' });
    doc.text(`Rs.${(order.subtotal || 0).toFixed(2)}`, rightMargin, y, { align: 'right' });
    y += 3.5;

    const taxAmt = Number(order.tax || 0);
    if (taxAmt > 0) {
      const halfTax = (taxAmt / 2).toFixed(2);
      doc.text('CGST (2.5%):', 46, y, { align: 'right' });
      doc.text(`Rs.${halfTax}`, rightMargin, y, { align: 'right' });
      y += 3.2;

      doc.text('SGST (2.5%):', 46, y, { align: 'right' });
      doc.text(`Rs.${halfTax}`, rightMargin, y, { align: 'right' });
      y += 3.2;
    }

    if ((order.packaging_charge || 0) > 0) {
      doc.text('Packaging:', 46, y, { align: 'right' });
      doc.text(`Rs.${(order.packaging_charge || 0).toFixed(2)}`, rightMargin, y, { align: 'right' });
      y += 3.2;
    }

    if ((order.service_charge || 0) > 0) {
      doc.text('Service Chg:', 46, y, { align: 'right' });
      doc.text(`Rs.${(order.service_charge || 0).toFixed(2)}`, rightMargin, y, { align: 'right' });
      y += 3.2;
    }

    if ((order.online_discount || 0) > 0) {
      doc.text('Online Disc:', 46, y, { align: 'right' });
      doc.text(`-Rs.${(order.online_discount || 0).toFixed(2)}`, rightMargin, y, { align: 'right' });
      y += 3.2;
    }

    if ((order.coupon_discount || 0) > 0) {
      doc.text('Coupon Disc:', 46, y, { align: 'right' });
      doc.text(`-Rs.${(order.coupon_discount || 0).toFixed(2)}`, rightMargin, y, { align: 'right' });
      y += 3.2;
    }

    // Grand Total Divider
    doc.setLineWidth(0.4);
    doc.line(margin, y, rightMargin, y);
    y += 4.2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('TOTAL:', 44, y, { align: 'right' });
    doc.text(`Rs.${grandTotal.toFixed(2)}`, rightMargin, y, { align: 'right' });
    y += 5.2;

    doc.setLineWidth(0.2);
    doc.line(margin, y, rightMargin, y);
    y += 3.5;

    // Payment Settlement Breakdown
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Cash: Rs.${cashAmt.toFixed(2)}  |  Online: Rs.${onlineAmt.toFixed(2)}`, centerX, y, { align: 'center' });
    y += 3.2;

    const cashDue = Number(order.cash_due ?? Math.max(0, grandTotal - totalPaid));
    if (cashDue > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Due / Pending: Rs.${cashDue.toFixed(2)}`, centerX, y, { align: 'center' });
      y += 3.2;
    }

    if (order.payu_txnid || order.payu_mihpayid || order.razorpay_payment_id) {
      const txnId = order.payu_txnid || order.payu_mihpayid || order.razorpay_payment_id;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text(`Txn ID: ${txnId}`, centerX, y, { align: 'center' });
      y += 3.2;
    }

    // Tear-off cut line and Thank you
    y += 2;
    doc.setLineDashPattern([2, 1], 0);
    doc.line(margin, y, rightMargin, y);
    doc.setLineDashPattern([], 0);
    y += 4;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Thank you for dining with us!', centerX, y, { align: 'center' });
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100);
    doc.text('DigiMoms Smart Restaurant OS', centerX, y, { align: 'center' });

    doc.save(`ThermalSlip_80mm_${order.order_number}_${cleanTable.replace(/\s+/g, '')}.pdf`);
  } catch (err) {
    console.error("Thermal Receipt PDF Error:", err);
  }
}

/**
 * 3. Monthly GST Tax Report PDF Generator
 * Generates an official, accountant-ready monthly GST compliance report
 * with CGST, SGST, taxable sales, and order register for filing GSTR-3B / GSTR-1.
 */
export function generateMonthlyGstReportPdf(
  restaurant: Restaurant,
  monthLabel: string,
  summary: {
    totalTaxableSales: number;
    totalCgst: number;
    totalSgst: number;
    totalGst: number;
    grossBilled: number;
    orderCount: number;
  },
  ordersList: Order[]
) {
  try {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    let curY = 15;

    // Header Top Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, curY, contentWidth, 22, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text((restaurant.name || 'Restaurant').toUpperCase(), margin + 6, curY + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`MONTHLY GST TAX COLLECTION REPORT — ${monthLabel.toUpperCase()}`, margin + 6, curY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.text('OFFICIAL TAX STATEMENT', pageWidth - margin - 6, curY + 9, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - margin - 6, curY + 16, { align: 'right' });

    curY += 27;

    // Business Details & GSTIN Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, curY, contentWidth, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Taxpayer / Entity: ${restaurant.name}`, margin + 5, curY + 6);
    doc.text(`GSTIN Number: ${restaurant.gst || 'NOT CONFIGURED (OPTIONAL)'}`, margin + 5, curY + 12);
    doc.text(`Standard Restaurant GST Rate: 5% (CGST 2.5% + SGST 2.5%)`, margin + 5, curY + 17);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const phone = restaurant.contact_mobile || restaurant.owner_mobile || 'N/A';
    doc.text(`Contact: ${phone}`, pageWidth - margin - 5, curY + 6, { align: 'right' });
    doc.text(`FSSAI License: ${restaurant.fssai || 'N/A'}`, pageWidth - margin - 5, curY + 12, { align: 'right' });
    doc.text(`Total Period Orders: ${summary.orderCount}`, pageWidth - margin - 5, curY + 17, { align: 'right' });

    curY += 25;

    // Key Tax KPIs (4 Columns)
    const colW = (contentWidth - 9) / 4;

    const cards = [
      { label: 'TAXABLE SALES', val: `Rs. ${summary.totalTaxableSales.toFixed(2)}`, color: [15, 23, 42] },
      { label: 'CGST (2.5%)', val: `Rs. ${summary.totalCgst.toFixed(2)}`, color: [59, 130, 246] },
      { label: 'SGST (2.5%)', val: `Rs. ${summary.totalSgst.toFixed(2)}`, color: [139, 92, 246] },
      { label: 'TOTAL GST COLLECTED', val: `Rs. ${summary.totalGst.toFixed(2)}`, color: [16, 185, 129] }
    ];

    cards.forEach((card, idx) => {
      const boxX = margin + (idx * (colW + 3));
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(boxX, curY, colW, 16, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(card.label, boxX + 4, curY + 5.5);

      doc.setFontSize(9.5);
      doc.setTextColor(card.color[0], card.color[1], card.color[2]);
      doc.text(card.val, boxX + 4, curY + 12);
    });

    curY += 21;

    // Table Header for Orders GST Register
    const drawRegisterHeader = (yPos: number) => {
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, yPos, contentWidth, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);

      doc.text('#', margin + 3, yPos + 4.8);
      doc.text('INVOICE REF', margin + 12, yPos + 4.8);
      doc.text('DATE', margin + 48, yPos + 4.8);
      doc.text('TABLE/GUEST', margin + 74, yPos + 4.8);
      doc.text('TAXABLE (Rs.)', margin + 110, yPos + 4.8, { align: 'right' });
      doc.text('CGST (2.5%)', margin + 132, yPos + 4.8, { align: 'right' });
      doc.text('SGST (2.5%)', margin + 154, yPos + 4.8, { align: 'right' });
      doc.text('TOTAL GST', pageWidth - margin - 3, yPos + 4.8, { align: 'right' });

      return yPos + 8.5;
    };

    curY = drawRegisterHeader(curY);

    // Render Order Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    ordersList.forEach((ord, index) => {
      if (curY > pageHeight - 30) {
        doc.addPage();
        curY = 15;
        curY = drawRegisterHeader(curY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
      }

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, curY - 3.2, contentWidth, 5.5, 'F');
      }

      const ordTax = Number(ord.tax || 0);
      const halfOrdTax = (ordTax / 2).toFixed(2);
      const cleanTbl = formatTableNumber(ord.table_number);
      const cleanInv = `INV-${(ord.order_number || '000').replace('#', '')}`;
      const ordDate = new Date(ord.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

      doc.text(`${index + 1}`, margin + 3, curY);
      doc.text(cleanInv, margin + 12, curY);
      doc.text(ordDate, margin + 48, curY);
      doc.text(`${cleanTbl}`, margin + 74, curY);
      doc.text(`${(ord.subtotal || 0).toFixed(2)}`, margin + 110, curY, { align: 'right' });
      doc.text(`${halfOrdTax}`, margin + 132, curY, { align: 'right' });
      doc.text(`${halfOrdTax}`, margin + 154, curY, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(`${ordTax.toFixed(2)}`, pageWidth - margin - 3, curY, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      curY += 5.5;
    });

    // Total Summary Row
    if (curY > pageHeight - 25) {
      doc.addPage();
      curY = 15;
    }

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, curY - 2, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('MONTHLY SUMMARY TOTALS:', margin + 12, curY + 2.8);
    doc.text(`Rs. ${summary.totalTaxableSales.toFixed(2)}`, margin + 110, curY + 2.8, { align: 'right' });
    doc.text(`Rs. ${summary.totalCgst.toFixed(2)}`, margin + 132, curY + 2.8, { align: 'right' });
    doc.text(`Rs. ${summary.totalSgst.toFixed(2)}`, margin + 154, curY + 2.8, { align: 'right' });
    doc.text(`Rs. ${summary.totalGst.toFixed(2)}`, pageWidth - margin - 3, curY + 2.8, { align: 'right' });

    // Footer
    const footerY = pageHeight - 12;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('This monthly GST report is generated for tax filing and CA reconciliation by DigiMoms Smart Restaurant OS.', pageWidth / 2, footerY, { align: 'center' });

    const sanitizedRest = (restaurant.name || 'Restaurant').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`GST_Report_${sanitizedRest}_${monthLabel.replace(/\s+/g, '_')}.pdf`);
  } catch (err) {
    console.error("Monthly GST Report PDF Generation Error:", err);
  }
}

/**
 * Backward compatibility alias: defaults to the high-res professional customer invoice
 */
export function generateInvoicePdf(order: Order, restaurant: Restaurant) {
  generateCustomerInvoicePdf(order, restaurant);
}

export function generateSubscriptionInvoicePdf(subscription: any, restaurant: Restaurant) {
  try {
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4'
    });

    const invoiceNumber = `INV-SUB-${subscription.id ? subscription.id.slice(0, 8).toUpperCase() : Date.now()}`;
    const invoiceDate = new Date(subscription.payment_date || subscription.created_at || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('DigiMoms Technologies & SaaS', 20, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Smart Cloud Restaurant Operating System', 20, 31);
    doc.text('Email: support@digimoms.in | Web: digimoms.in', 20, 36);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('TAX INVOICE / RECEIPT', 190, 25, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Invoice No: ${invoiceNumber}`, 190, 32, { align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 190, 38, { align: 'right' });
    doc.text(`Txn ID: ${subscription.transaction_id || 'N/A'}`, 190, 44, { align: 'right' });

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);

    // Bill To
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('BILLED TO:', 20, 60);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(restaurant.name || 'Restaurant Partner', 20, 67);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Attn: ${restaurant.owner_name || 'Restaurant Owner'}`, 20, 73);
    doc.text(`Phone: ${restaurant.contact_mobile || restaurant.owner_mobile || 'N/A'}`, 20, 79);
    if (restaurant.address) {
      const splitAddr = doc.splitTextToSize(`Address: ${restaurant.address}`, 90);
      doc.text(splitAddr, 20, 85);
    }
    if (restaurant.gst) {
      doc.text(`GSTIN: ${restaurant.gst}`, 20, 95);
    }

    // Table Header
    const tableY = 110;
    doc.setFillColor(241, 245, 249);
    doc.rect(20, tableY, 170, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Description', 25, tableY + 6);
    doc.text('Period', 105, tableY + 6);
    doc.text('Qty', 140, tableY + 6, { align: 'center' });
    doc.text('Amount (INR)', 185, tableY + 6, { align: 'right' });

    // Table Content
    const rowY = tableY + 16;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('DigiMoms Restaurant OS Monthly SaaS Subscription', 25, rowY);
    doc.text('Cloud POS, QR Menus, KDS & Analytics', 25, rowY + 5);
    doc.text('30 Days', 105, rowY);
    doc.text('1', 140, rowY, { align: 'center' });
    const amount = Number(subscription.amount_paid || 999);
    doc.text(`Rs. ${amount.toFixed(2)}`, 185, rowY, { align: 'right' });

    doc.line(20, rowY + 14, 190, rowY + 14);

    // Totals
    const totalsY = rowY + 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Subtotal:', 140, totalsY, { align: 'right' });
    doc.text(`Rs. ${amount.toFixed(2)}`, 185, totalsY, { align: 'right' });

    doc.text('Taxes & Gateway Fees:', 140, totalsY + 6, { align: 'right' });
    doc.text('Rs. 0.00', 185, totalsY + 6, { align: 'right' });

    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129);
    doc.text('Total Paid:', 140, totalsY + 14, { align: 'right' });
    doc.text(`Rs. ${amount.toFixed(2)}`, 185, totalsY + 14, { align: 'right' });

    // Payment Status Box
    doc.setDrawColor(16, 185, 129);
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(20, totalsY + 2, 75, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61);
    doc.text('PAYMENT STATUS: CONFIRMED & PAID', 25, totalsY + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Method: Online Gateway (${subscription.gateway || 'Verified'})`, 25, totalsY + 16);

    // Terms and Footer
    const footerY = 250;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Terms & Conditions:', 20, footerY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('1. This invoice is electronically generated and digitally authenticated by DigiMoms.', 20, footerY + 5);
    doc.text('2. Subscription charges grant continuous access to DigiMoms Restaurant OS for the active billing cycle.', 20, footerY + 9);
    doc.text('3. For billing disputes or technical assistance, contact support@digimoms.in.', 20, footerY + 13);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Thank you for partnering with DigiMoms Smart Restaurant OS!', 105, 280, { align: 'center' });

    doc.save(`DigiMoms_Invoice_${invoiceNumber}.pdf`);
  } catch (err) {
    console.error("Subscription PDF Generation Error:", err);
  }
}



