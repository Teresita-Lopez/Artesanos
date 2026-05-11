import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('¡Bienvenido de nuevo!');
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const destination = savedUser.role === 'artisan' ? '/perfil-artesano' : '/catalogo';
      navigate(destination);
    } catch (error: any) {
      toast.error(error.message || 'Credenciales incorrectas');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const googleUser = {
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        role: 'customer' as const,
        profileImage: decoded.picture,
      };
      localStorage.setItem('user', JSON.stringify(googleUser));
      localStorage.setItem('usuario_id', decoded.sub);
      localStorage.setItem('usuario_nombre', decoded.name);
      await updateProfile(googleUser);
      toast.success(`¡Bienvenido, ${decoded.name}!`);
      navigate('/catalogo');
    } catch (error) {
      toast.error('Error al iniciar sesión con Google');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
            Accede a tu cuenta para explorar productos artesanales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="text-right">
              <Link to="/recuperar-contraseña" className="text-sm text-orange-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
              Iniciar Sesión
            </Button>
          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-sm text-gray-500">o continúa con</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Error al iniciar sesión con Google')}
              text="signin_with"
              shape="rectangular"
            
            />
          </div>

          <div className="mt-4 text-center text-sm">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-orange-600 hover:underline">
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}