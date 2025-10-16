-- Create security definer function to get user's company_id without recursion
create or replace function public.get_user_company_id(_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.profiles
  where id = _user_id
$$;

-- Drop existing problematic policies on profiles
drop policy if exists "Users can view company members" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;

-- Create new non-recursive policies for profiles
create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can view company members"
on public.profiles
for select
using (
  (auth.uid() = id) 
  OR (company_id is not null and company_id = public.get_user_company_id(auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can view all profiles
create policy "Admins can view all profiles"
on public.profiles
for select
using (public.has_role(auth.uid(), 'admin'::app_role));