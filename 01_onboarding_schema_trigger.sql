-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid references auth.users on delete cascade primary key,
    first_name text,
    last_name text,
    onboarding_completed boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add onboarding_completed column if table already existed without it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='onboarding_completed') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_completed boolean DEFAULT false;
    END IF;
END $$;

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, first_name, last_name, onboarding_completed)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    false
  );

  -- Insert default budget category "personal corpus"
  INSERT INTO public.budgets (
    category_id,
    user_id,
    category,
    description,
    limit_amount,
    icon_name,
    budget_type,
    period_type,
    reset_date,
    sort_order
  ) VALUES (
    gen_random_uuid(),
    new.id,
    'personal corpus',
    'Unallocated personal funds',
    0,
    'wallet',
    'corpus',
    'monthly',
    1,
    0
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
