import jsPDF from 'jspdf';
import { Order, Restaurant } from '../types';

export function generateInvoicePdf(order: Order, restaurant: Restaurant) {
  try {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 240] // Extended thermal receipt layout
    });

    const margin = 5;
    let y = 8;

    const billNumber = `BILL-DGM-${new Date(order.created_at).getFullYear()}-${(order.order_number || '000').replace('#', '')}`;

    // Header Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('DigiMoms Smart Restaurant OS', 40, y, { align: 'center' });
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(restaurant.name.toUpperCase(), 40, y, { align: 'center' });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (restaurant.address) {
      const splitAddress = doc.splitTextToSize(restaurant.address, 70);
      doc.text(splitAddress, 40, y, { align: 'center' });
      y += (splitAddress.length * 3.5);
    }

    const contactPhone = restaurant.contact_mobile || restaurant.owner_mobile;
    if (contactPhone) {
      doc.text(`Ph: ${contactPhone}`, 40, y, { align: 'center' });
      y += 3.5;
    }
    if (restaurant.contact_email) {
      doc.text(`Email: ${restaurant.contact_email}`, 40, y, { align: 'center' });
      y += 3.5;
    }

    if (restaurant.gst) {
      doc.text(`GSTIN: ${restaurant.gst}`, 40, y, { align: 'center' });
      y += 3.5;
    }
    if (restaurant.fssai) {
      doc.text(`FSSAI Lic: ${restaurant.fssai}`, 40, y, { align: 'center' });
      y += 3.5;
    }

    // Divider
    y += 1;
    doc.setLineWidth(0.2);
    doc.line(margin, y, 75, y);
    y += 4;

    // Bill & Order Identifiers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`BILL #: ${billNumber}`, margin, y);
    y += 3.5;
    doc.text(`ORDER: ${order.order_number}`, margin, y);
    doc.text(`TABLE: ${order.table_number}`, 75, y, { align: 'right' });
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const orderDate = new Date(order.created_at).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    doc.text(`Date/Time: ${orderDate}`, margin, y);
    y += 3.5;

    if (order.customer_mobile) {
      doc.text(`Customer: ${order.customer_mobile}`, margin, y);
      y += 3.5;
    }

    const onlineAmt = Number(order.online_amount || 0);
    const cashAmt = Number(order.cash_amount || 0);
    const totalPaid = onlineAmt + cashAmt;
    const grandTotal = Number(order.grand_total || 0);
    const cashDue = Number(order.cash_due ?? Math.max(0, grandTotal - totalPaid));

    const isPaid = (order.payment_status as string) === 'paid_live' || (order.payment_status as string) === 'paid' || (order.payment_status as string) === 'paid_cash' || (order.payment_status as string) === 'paid_demo' || (totalPaid >= grandTotal && grandTotal > 0);
    const isPartiallyPaid = !isPaid && ((order.payment_status as string) === 'partially_paid' || (order.payment_status as string) === 'partial' || totalPaid > 0);
    const statusText = isPaid ? 'PAID' : (isPartiallyPaid ? 'PARTIALLY PAID' : 'PENDING');
    const payMethodLabel = (onlineAmt > 0 && cashAmt > 0) ? 'SPLIT (ONLINE + CASH)' : (onlineAmt > 0 ? 'ONLINE (UPI/CARD/NET BANKING)' : (cashAmt > 0 ? 'CASH' : 'PENDING'));

    doc.text(`Payment Status: ${statusText}`, margin, y);
    y += 3.5;
    doc.text(`Payment Method: ${payMethodLabel}`, margin, y);
    y += 4;

    // Line
    doc.line(margin, y, 75, y);
    y += 4;

    // Items Table Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ITEM', margin, y);
    doc.text('QTY', 48, y, { align: 'right' });
    doc.text('PRICE', 60, y, { align: 'right' });
    doc.text('AMOUNT', 75, y, { align: 'right' });
    y += 3;
    doc.line(margin, y, 75, y);
    y += 4;

    // Items List
    doc.setFont('helvetica', 'normal');
    (order.items || []).forEach((item) => {
      const itemTotal = item.quantity * item.price;
      const splitItemName = doc.splitTextToSize(item.menu_name, 38);
      doc.text(splitItemName, margin, y);
      doc.text(`${item.quantity}`, 48, y, { align: 'right' });
      doc.text(`Rs.${item.price}`, 60, y, { align: 'right' });
      doc.text(`Rs.${itemTotal.toFixed(2)}`, 75, y, { align: 'right' });
      
      y += Math.max(splitItemName.length * 3.5, 4);

      if (item.special_instructions) {
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text(`* ${item.special_instructions}`, margin + 2, y);
        doc.setFontSize(7.5);
        doc.setTextColor(0);
        y += 3.5;
      }
    });

    // Line
    y += 1;
    doc.line(margin, y, 75, y);
    y += 4;

    // Subtotals
    doc.setFontSize(8);
    doc.text('Subtotal:', 50, y, { align: 'right' });
    doc.text(`Rs.${(order.subtotal || 0).toFixed(2)}`, 75, y, { align: 'right' });
    y += 3.5;

    if ((order.tax || 0) > 0) {
      doc.text('GST Tax:', 50, y, { align: 'right' });
      doc.text(`Rs.${(order.tax || 0).toFixed(2)}`, 75, y, { align: 'right' });
      y += 3.5;
    }

    if ((order.packaging_charge || 0) > 0) {
      doc.text('Packaging Charge:', 50, y, { align: 'right' });
      doc.text(`Rs.${(order.packaging_charge || 0).toFixed(2)}`, 75, y, { align: 'right' });
      y += 3.5;
    }

    if ((order.service_charge || 0) > 0) {
      doc.text('Service Charge:', 50, y, { align: 'right' });
      doc.text(`Rs.${(order.service_charge || 0).toFixed(2)}`, 75, y, { align: 'right' });
      y += 3.5;
    }

    if ((order.online_discount || 0) > 0) {
      doc.text('Online Pay Discount:', 50, y, { align: 'right' });
      doc.text(`-Rs.${(order.online_discount || 0).toFixed(2)}`, 75, y, { align: 'right' });
      y += 3.5;
    }

    if ((order.coupon_discount || 0) > 0) {
      doc.text(`Coupon (${order.coupon_code || 'PROMO'}):`, 50, y, { align: 'right' });
      doc.text(`-Rs.${(order.coupon_discount || 0).toFixed(2)}`, 75, y, { align: 'right' });
      y += 3.5;
    }

    if (!order.online_discount && !order.coupon_discount && (order.discount || 0) > 0) {
      doc.text('Discount:', 50, y, { align: 'right' });
      doc.text(`-Rs.${(order.discount || 0).toFixed(2)}`, 75, y, { align: 'right' });
      y += 3.5;
    }

    doc.line(margin, y, 75, y);
    y += 4;

    // Grand Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('GRAND TOTAL:', 45, y, { align: 'right' });
    doc.text(`Rs.${(order.grand_total || 0).toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;

    // Payment Breakdown Box
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.line(margin, y, 75, y);
    y += 3.5;

    doc.text(`Online Paid (UPI/Card/Net Banking): Rs.${onlineAmt.toFixed(2)}`, margin, y);
    y += 3.5;
    doc.text(`Cash Paid: Rs.${cashAmt.toFixed(2)}`, margin, y);
    y += 3.5;
    if (cashDue > 0) {
      doc.text(`Cash Due: Rs.${cashDue.toFixed(2)}`, margin, y);
      y += 3.5;
    }

    if (order.razorpay_payment_id) {
      doc.setFontSize(7);
      doc.text(`Txn ID: ${order.razorpay_payment_id}`, margin, y);
      y += 3.5;
      doc.setFontSize(7.5);
    }

    if (order.verified_by) {
      doc.setFontSize(7);
      doc.text(`Confirmed By: ${order.verified_by}`, margin, y);
      y += 3.5;
      doc.setFontSize(7.5);
    }

    doc.line(margin, y, 75, y);
    y += 5;

    // Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Thank you for dining with us!', 40, y, { align: 'center' });
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.text('Powered by DigiMoms Smart Restaurant OS', 40, y, { align: 'center' });

    // Download PDF
    doc.save(`${billNumber}_${order.table_number}.pdf`);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    alert("Could not generate PDF invoice. Please retry. The order status remains unaffected.");
  }
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
    alert("Could not generate tax invoice PDF. Please try again.");
  }
}

