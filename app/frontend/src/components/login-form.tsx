import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (id === 'allie' && pw === 'alliegrace') {
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/admin');
    } else {
      setError('Invalid credentials');
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="w-full max-w-md md:max-w-3xl mx-auto overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8 w-full" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your admin account
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="id">ID</Label>
                <Input
                  id="id"
                  type="text"
                  placeholder="allie"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="alliegrace"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm mb-2">{error}</div>
              )}
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>
          <div className="relative bg-muted md:block items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center h-full w-full">
              <Lock className="w-20 h-20" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
