import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function AdminLogin({ searchParams }: { searchParams: { next?: string } }) {
  const next = searchParams.next || "/admin";

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <Card>
        <CardHeader title="Admin Login" subtitle="Acceso restringido" />
        <CardContent>
          <form className="grid gap-3" action="/api/login" method="POST">
            <input type="hidden" name="next" value={next} />
            <label className="text-sm font-semibold">Email</label>
            <Input name="email" type="email" placeholder="admin@..." required />
            <label className="text-sm font-semibold mt-2">Password</label>
            <Input name="password" type="password" placeholder="••••••••" required />
            <Button type="submit" className="mt-2">Ingresar</Button>
          </form>
          <p className="text-xs text-slate-500 mt-3">
            Si fallas varias veces, se bloqueará temporalmente (rate limit).
          </p>
        </CardContent>
      </Card>
    </main>
  );
}