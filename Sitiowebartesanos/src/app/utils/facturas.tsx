import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: OrderItem[];
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
}

export function generarFacturaPDF(order: Order) {
  const doc = new jsPDF();
  const IVA = 0.19;

  const subtotal = order.total - 10000;
  const baseIVA = subtotal / (1 + IVA);
  const valorIVA = subtotal - baseIVA;

  // Encabezado
  doc.setFillColor(234, 88, 12);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Pakari Shop', 14, 15);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Artesanías Colombianas', 14, 23);
  doc.text('Pasto, Nariño - Colombia', 14, 30);

  // Título factura
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURA DE VENTA', 14, 50);

  // Número y fecha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`N° Pedido: #${order.id.slice(-8).toUpperCase()}`, 14, 60);
  doc.text(`Fecha: ${new Date(order.date).toLocaleDateString('es-CO')}`, 14, 67);
  doc.text(`Estado: ${order.status || 'Pendiente'}`, 14, 74);

  // Datos del cliente
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 82, 182, 28, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Datos del Cliente', 18, 91);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nombre: ${order.customer.name}`, 18, 99);
  doc.text(`Correo: ${order.customer.email}`, 18, 106);
  if (order.customer.phone) {
    doc.text(`Teléfono: ${order.customer.phone}`, 110, 99);
  }

  // Tabla de productos
  autoTable(doc, {
    startY: 118,
    head: [['Producto', 'Cantidad', 'Precio Unitario', 'Subtotal']],
    body: order.items.map(item => [
      item.name,
      item.quantity.toString(),
      `$${item.price.toLocaleString('es-CO')}`,
      `$${(item.price * item.quantity).toLocaleString('es-CO')}`,
    ]),
    headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [255, 247, 242] },
    styles: { fontSize: 10 },
  });

  // Totales
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Base gravable:`, 130, finalY);
  doc.text(`$${baseIVA.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`, 185, finalY, { align: 'right' });

  doc.text(`IVA (19%):`, 130, finalY + 8);
  doc.text(`$${valorIVA.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`, 185, finalY + 8, { align: 'right' });

  doc.text(`Envío:`, 130, finalY + 16);
  doc.text(`$10,000`, 185, finalY + 16, { align: 'right' });

  doc.setFillColor(234, 88, 12);
  doc.rect(128, finalY + 20, 67, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`TOTAL:`, 132, finalY + 27);
  doc.text(`$${order.total.toLocaleString('es-CO')}`, 185, finalY + 27, { align: 'right' });

  // Pie de página
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Gracias por tu compra en Pakari Shop', 105, 285, { align: 'center' });
  doc.text('Este documento es una factura de venta electrónica', 105, 290, { align: 'center' });

  doc.save(`Factura_${order.id.slice(-8).toUpperCase()}.pdf`);
}