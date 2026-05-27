# Acesso ao Painel Admin

O painel `/admin` nao e para clientes. Ele e restrito aos administradores da
Amaro dos Reis Parfum.

1. Crie o usuario no Supabase Auth.
2. Depois, insira esse usuario em `amaro_admin_members` pelo SQL Editor:

```sql
insert into public.amaro_admin_members (user_id, role, is_active)
select id, 'owner', true
from auth.users
where email = 'ronne.ariquemes@gmail.com';
```

Para adicionar um ajudante no futuro, crie o usuario no Auth e insira com role
`seller` ou `admin`.

Nunca usar service role no frontend.

Nunca commitar `.env.local`.
