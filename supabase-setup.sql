-- ============================================================
-- SETUP DO SUPABASE — TOP CELL
-- Cole isso inteiro no SQL Editor do Supabase e clique em "Run".
-- Faz tudo de uma vez: cria a tabela de produtos e as políticas
-- de segurança (RLS).
-- ============================================================

-- 1) Tabela de produtos
create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null,
  preco text not null,
  variante text default '',
  estoque boolean default true,
  badge text default '',
  foto_url text default '',
  foto_path text default '',
  updated_at timestamptz default now()
);

-- 2) Liga a segurança em nível de linha (RLS)
alter table produtos enable row level security;

-- 3) Qualquer pessoa pode LER o catálogo (o app do cliente não faz login)
create policy "Leitura pública dos produtos"
  on produtos for select
  using (true);

-- 4) Só usuário autenticado (mesmo anônimo, via app de gerenciamento
--    com PIN) pode inserir, editar ou excluir
create policy "Escrita só autenticado"
  on produtos for insert
  with check (auth.role() = 'authenticated' or auth.role() = 'anon' and auth.uid() is not null);

create policy "Update só autenticado"
  on produtos for update
  using (auth.uid() is not null);

create policy "Delete só autenticado"
  on produtos for delete
  using (auth.uid() is not null);

-- 5) Habilita realtime pra essa tabela (pro app de gerenciamento
--    sincronizar entre aparelhos na hora)
alter publication supabase_realtime add table produtos;

-- ============================================================
-- STORAGE (fotos dos produtos)
-- IMPORTANTE: antes de rodar a parte abaixo, crie o bucket
-- manualmente em Storage → New bucket → nome exatamente "produtos"
-- → marque como "Public bucket". Só depois rode o resto deste script.
-- ============================================================

create policy "Leitura pública das fotos"
  on storage.objects for select
  using (bucket_id = 'produtos');

create policy "Upload só autenticado"
  on storage.objects for insert
  with check (bucket_id = 'produtos' and auth.uid() is not null);

create policy "Update só autenticado"
  on storage.objects for update
  using (bucket_id = 'produtos' and auth.uid() is not null);

create policy "Delete só autenticado"
  on storage.objects for delete
  using (bucket_id = 'produtos' and auth.uid() is not null);
