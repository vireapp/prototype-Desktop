-- Migration: 002_daily_login_rpc.sql
-- Purpose: Atomic daily login processor that handles streaks and streak saves.

create or replace function process_daily_login()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_last_login date;
  v_streak_count int;
  v_streak_saves int;
  v_coins int;
  v_today date := current_date;
  v_days_diff int;
  v_xp_reward int := 50; -- Base daily XP
  v_coin_reward int := 10; -- Base daily coins
  v_streak_bonus_xp int := 0;
begin
  -- Get current user data
  select last_login_date, streak_count, streak_saves, coins
  into v_last_login, v_streak_count, v_streak_saves, v_coins
  from profiles
  where id = v_user_id;

  if v_last_login = v_today then
    -- Already logged in today
    return jsonb_build_object('success', false, 'reason', 'already_logged_in');
  end if;

  -- Calculate days difference
  if v_last_login is null then
    v_days_diff := 1;
  else
    v_days_diff := v_today - v_last_login;
  end if;

  -- Handle streak logic
  if v_days_diff = 1 then
    -- Consecutive day
    v_streak_count := v_streak_count + 1;
  elsif v_days_diff > 1 then
    -- Missed day(s)
    if v_streak_saves > 0 then
      -- Use a save! (Assuming 1 save can bridge any gap for simplicity, or just 1 day gap)
      v_streak_saves := v_streak_saves - 1;
      v_streak_count := v_streak_count + 1;
    else
      -- Streak broken
      v_streak_count := 1;
    end if;
  end if;

  -- Apply streak bonuses (e.g. +10 XP per streak day, max 100)
  v_streak_bonus_xp := least(v_streak_count * 10, 100);
  v_xp_reward := v_xp_reward + v_streak_bonus_xp;

  -- Update profile
  update profiles
  set
    streak_count = v_streak_count,
    streak_saves = v_streak_saves,
    last_login_date = v_today,
    coins = coins + v_coin_reward
  where id = v_user_id;

  -- Call award_xp to handle level ups
  perform award_xp(v_xp_reward);

  return jsonb_build_object(
    'success', true,
    'streak_count', v_streak_count,
    'streak_saves', v_streak_saves,
    'xp_awarded', v_xp_reward,
    'coins_awarded', v_coin_reward
  );
end;
$$;

grant execute on function process_daily_login() to authenticated;
