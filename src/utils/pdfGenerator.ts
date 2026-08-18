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

