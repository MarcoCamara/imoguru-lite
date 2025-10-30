create function increment_usage_count(key_id uuid)
returns void as $$
  update api_keys
  set usage_count = usage_count + 1
  where id = key_id;
$$ language sql volatile;
