-- Top 84 countries by stream-backed channel count (min=21)
insert into public.countries (name, code, enabled) values
  ('United States', 'US', true),  -- 1785 channels with streams
  ('India', 'IN', true),  -- 663 channels with streams
  ('Germany', 'DE', true),  -- 440 channels with streams
  ('Russia', 'RU', true),  -- 408 channels with streams
  ('Brazil', 'BR', true),  -- 305 channels with streams
  ('Spain', 'ES', true),  -- 266 channels with streams
  ('Italy', 'IT', true),  -- 258 channels with streams
  ('Dominican Republic', 'DO', true),  -- 252 channels with streams
  ('Chile', 'CL', true),  -- 248 channels with streams
  ('Turkiye', 'TR', true),  -- 233 channels with streams
  ('France', 'FR', true),  -- 211 channels with streams
  ('Sweden', 'SE', true),  -- 206 channels with streams
  ('United Kingdom', 'GB', true),  -- 188 channels with streams
  ('Canada', 'CA', true),  -- 180 channels with streams
  ('Netherlands', 'NL', true),  -- 178 channels with streams
  ('Peru', 'PE', true),  -- 177 channels with streams
  ('Argentina', 'AR', true),  -- 176 channels with streams
  ('Mexico', 'MX', true),  -- 167 channels with streams
  ('Indonesia', 'ID', true),  -- 158 channels with streams
  ('China', 'CN', true),  -- 155 channels with streams
  ('Iran', 'IR', true),  -- 128 channels with streams
  ('Ukraine', 'UA', true),  -- 121 channels with streams
  ('Colombia', 'CO', true),  -- 118 channels with streams
  ('Hungary', 'HU', true),  -- 102 channels with streams
  ('Poland', 'PL', true),  -- 100 channels with streams
  ('Greece', 'GR', true),  -- 87 channels with streams
  ('Pakistan', 'PK', true),  -- 87 channels with streams
  ('Ecuador', 'EC', true),  -- 87 channels with streams
  ('Bolivia', 'BO', true),  -- 86 channels with streams
  ('Romania', 'RO', true),  -- 84 channels with streams
  ('Honduras', 'HN', true),  -- 78 channels with streams
  ('South Korea', 'KR', true),  -- 75 channels with streams
  ('Paraguay', 'PY', true),  -- 74 channels with streams
  ('Venezuela', 'VE', true),  -- 74 channels with streams
  ('Costa Rica', 'CR', true),  -- 69 channels with streams
  ('Thailand', 'TH', true),  -- 64 channels with streams
  ('Serbia', 'RS', true),  -- 64 channels with streams
  ('Bulgaria', 'BG', true),  -- 63 channels with streams
  ('Guatemala', 'GT', true),  -- 60 channels with streams
  ('Portugal', 'PT', true),  -- 59 channels with streams
  ('Saudi Arabia', 'SA', true),  -- 56 channels with streams
  ('Iraq', 'IQ', true),  -- 56 channels with streams
  ('Czech Republic', 'CZ', true),  -- 55 channels with streams
  ('Vietnam', 'VN', true),  -- 54 channels with streams
  ('Nigeria', 'NG', true),  -- 53 channels with streams
  ('Bangladesh', 'BD', true),  -- 47 channels with streams
  ('Slovakia', 'SK', true),  -- 44 channels with streams
  ('United Arab Emirates', 'AE', true),  -- 40 channels with streams
  ('Australia', 'AU', true),  -- 39 channels with streams
  ('Kenya', 'KE', true),  -- 39 channels with streams
  ('Belgium', 'BE', true),  -- 39 channels with streams
  ('Mongolia', 'MN', true),  -- 38 channels with streams
  ('El Salvador', 'SV', true),  -- 37 channels with streams
  ('Kazakhstan', 'KZ', true),  -- 34 channels with streams
  ('Switzerland', 'CH', true),  -- 34 channels with streams
  ('Uzbekistan', 'UZ', true),  -- 33 channels with streams
  ('Austria', 'AT', true),  -- 33 channels with streams
  ('Croatia', 'HR', true),  -- 32 channels with streams
  ('Lebanon', 'LB', true),  -- 31 channels with streams
  ('Bosnia and Herzegovina', 'BA', true),  -- 30 channels with streams
  ('Israel', 'IL', true),  -- 29 channels with streams
  ('Cambodia', 'KH', true),  -- 29 channels with streams
  ('Cyprus', 'CY', true),  -- 28 channels with streams
  ('Puerto Rico', 'PR', true),  -- 28 channels with streams
  ('North Macedonia', 'MK', true),  -- 27 channels with streams
  ('Sri Lanka', 'LK', true),  -- 27 channels with streams
  ('Qatar', 'QA', true),  -- 25 channels with streams
  ('Taiwan', 'TW', true),  -- 25 channels with streams
  ('Finland', 'FI', true),  -- 25 channels with streams
  ('South Africa', 'ZA', true),  -- 24 channels with streams
  ('Panama', 'PA', true),  -- 24 channels with streams
  ('Jordan', 'JO', true),  -- 23 channels with streams
  ('Azerbaijan', 'AZ', true),  -- 23 channels with streams
  ('Democratic Republic of the Congo', 'CD', true),  -- 23 channels with streams
  ('Philippines', 'PH', true),  -- 22 channels with streams
  ('Albania', 'AL', true),  -- 22 channels with streams
  ('Slovenia', 'SI', true),  -- 22 channels with streams
  ('Moldova', 'MD', true),  -- 22 channels with streams
  ('Senegal', 'SN', true),  -- 21 channels with streams
  ('Uganda', 'UG', true),  -- 21 channels with streams
  ('Ivory Coast', 'CI', true),  -- 21 channels with streams
  ('Malaysia', 'MY', true),  -- 21 channels with streams
  ('Cameroon', 'CM', true),  -- 21 channels with streams
  ('Nicaragua', 'NI', true)  -- 21 channels with streams
on conflict (code) do update
  set name = excluded.name,
      enabled = true,
      updated_at = now();

-- Disable any country not in the top set (keep rows for FK safety).
update public.countries
set enabled = false, updated_at = now()
where code not in ('US', 'IN', 'DE', 'RU', 'BR', 'ES', 'IT', 'DO', 'CL', 'TR', 'FR', 'SE', 'GB', 'CA', 'NL', 'PE', 'AR', 'MX', 'ID', 'CN', 'IR', 'UA', 'CO', 'HU', 'PL', 'GR', 'PK', 'EC', 'BO', 'RO', 'HN', 'KR', 'PY', 'VE', 'CR', 'TH', 'RS', 'BG', 'GT', 'PT', 'SA', 'IQ', 'CZ', 'VN', 'NG', 'BD', 'SK', 'AE', 'AU', 'KE', 'BE', 'MN', 'SV', 'KZ', 'CH', 'UZ', 'AT', 'HR', 'LB', 'BA', 'IL', 'KH', 'CY', 'PR', 'MK', 'LK', 'QA', 'TW', 'FI', 'ZA', 'PA', 'JO', 'AZ', 'CD', 'PH', 'AL', 'SI', 'MD', 'SN', 'UG', 'CI', 'MY', 'CM', 'NI');

-- Normalize legacy category labels onto public app slugs.
update public.channels set category = 'entertainment' where lower(coalesce(category,'')) in ('general','lifestyle','comedy','relax','interactive','cooking','');
update public.channels set category = 'documentary' where lower(coalesce(category,'')) in ('culture','travel');
update public.channels set category = 'technology' where lower(coalesce(category,'')) in ('science');
update public.channels set category = 'movies' where lower(coalesce(category,'')) in ('drama','classic','series');
update public.channels set category = 'kids' where lower(coalesce(category,'')) in ('family','animation');
update public.channels set category = 'sports' where lower(coalesce(category,'')) in ('outdoor','auto');
update public.channels set category = 'business' where lower(coalesce(category,'')) in ('shop','shopping');
update public.channels set category = 'news' where lower(coalesce(category,'')) in ('weather','legislative');

insert into public.category_settings (category_id, name, enabled)
values
  ('sports','Sports',true),
  ('news','News',true),
  ('movies','Movies',true),
  ('kids','Kids',true),
  ('music','Music',true),
  ('documentary','Documentary',true),
  ('entertainment','Entertainment',true),
  ('religion','Religion',true),
  ('education','Education',true),
  ('business','Business',true),
  ('technology','Technology',true)
on conflict (category_id) do update
  set name = excluded.name,
      enabled = true;
