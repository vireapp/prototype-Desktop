-- Migration: 001_award_xp_rpc.sql
-- Purpose: Atomic XP + level update to eliminate read-then-write race conditions.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query).

-- Helper: Compute level from total XP using the tiered system
-- Levels 1-10: 100 XP each, 11-20: 200 XP each, 21-30: 300 XP each, etc.
create or replace function compute_level(total_xp int)
returns int
language plpgsql
immutable
as $$
declare
  lvl      int := 1;
  acc      int := 0;
  xp_cost  int;
begin
  loop
    xp_cost := 100 * (floor((lvl - 1) / 10)::int + 1);
    if total_xp < acc + xp_cost then
      return lvl;
    end if;
    acc := acc + xp_cost;
    lvl := lvl + 1;
  end loop;
end;
$$;

-- Main RPC: atomically increment XP and recalculate level in a single UPDATE
-- Restricted to the authenticated user's own profile for security.
create or replace function award_xp(p_amount int)
returns void
language plpgsql
security definer
as $$
begin
  -- Sanity check: don't allow ridiculous amounts or negative XP
  if p_amount < 0 or p_amount > 5000 then
    raise exception 'Invalid XP amount';
  end if;

  update profiles
  set
    xp            = xp + p_amount,
    level         = compute_level(xp + p_amount),
    last_xp_award = now()
  where id = auth.uid();
end;
$$;

-- Grant execute to authenticated users
grant execute on function award_xp(int) to authenticated;
grant execute on function compute_level(int)  to authenticated;
