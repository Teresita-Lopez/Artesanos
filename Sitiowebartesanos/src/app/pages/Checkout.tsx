import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { MapPin, User, CreditCard } from 'lucide-react';

const WOMPI_PUBLIC_KEY = 'pub_test_6jhHtUtNNHZ6HkikZE9139oIbmtsVXPk';

export function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  });

  const [formValid, setFormValid] = useState(false);
  const totalWithShipping = totalPrice + 10000;

  useEffect(() => {
    const { name, email, phone, address, city, postalCode } = formData;
    setFormValid(!!(name && email && phone && address && city && postalCode));
  }, [formData]);

  if (cart.length === 0) {
    navigate('/catalogo');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWompiPayment = () => {
    if (!formValid) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: cart,
      total: totalWithShipping,
      customer: { name: formData.name, email: formData.email, phone: formData.phone },
      status: 'Pendiente',
    };
    localStorage.setItem('orders', JSON.stringify([...orders, newOrder]));
    clearCart();

    const params = new URLSearchParams({
      'public-key': WOMPI_PUBLIC_KEY,
      'currency': 'COP',
      'amount-in-cents': String(totalWithShipping * 100),
      'reference': newOrder.id,
      'redirect-url': 'http://localhost:5173/',
      'customer-data:email': formData.email,
      'customer-data:full-name': formData.name,
      'customer-data:phone-number': formData.phone,
    });

    window.location.href = `https://checkout.wompi.co/p/?${params.toString()}`;
  };

  return (
    <div className="py-8 bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* Información de contacto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required placeholder="+57 300 123 4567" />
                </div>
              </CardContent>
            </Card>

            {/* Dirección de envío */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Dirección de Envío
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección *</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Código Postal *</Label>
                    <Input id="postalCode" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas de Entrega (Opcional)</Label>
                  <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Apartamento, piso, instrucciones especiales..." />
                </div>
              </CardContent>
            </Card>

            {/* Métodos de pago */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Métodos de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Al hacer clic en "Pagar con Wompi" podrás elegir entre:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { name: 'Tarjeta', icon: '💳' },
                    { name: 'PSE', icon: '🏦' },
                    { name: 'Nequi', icon: '📱' },
                    { name: 'Daviplata', icon: '💜' },
                  ].map((method) => (
                    <div key={method.name} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-lg bg-white">
                      <span className="text-2xl mb-1">{method.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{method.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Resumen del pedido */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name} x {item.quantity}</span>
                      <span>${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${totalPrice.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío</span>
                    <span>$10,000</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span className="text-orange-600">${totalWithShipping.toLocaleString('es-CO')}</span>
                  </div>
                </div>
                <Button
                  onClick={handleWompiPayment}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={!formValid}
                >
                  Pagar con Wompi
                </Button>
                {!formValid && (
                  <p className="text-xs text-gray-500 text-center">Completa todos los campos para continuar</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}