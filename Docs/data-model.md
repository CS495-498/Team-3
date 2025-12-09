create table public.bookmarks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  resource_type text not null,
  resource_id text not null,
  resource_title text null,
  resource_description text null,
  resource_url text null,
  resource_thumbnail text null,
  metadata jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint bookmarks_pkey primary key (id),
  constraint bookmarks_user_id_resource_type_resource_id_key unique (user_id, resource_type, resource_id),
  constraint bookmarks_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint bookmarks_resource_type_check check (
    (
      resource_type = any (
        array[
          'demo_website'::text,
          'demo_instruction'::text,
          'video'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.feature_request_comments (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default (now() AT TIME ZONE 'utc'::text),
  content text not null,
  feature_request_id uuid not null,
  user_id uuid not null default auth.uid (),
  constraint feature_request_comments_pkey primary key (id),
  constraint feature_request_comments_feature_request_id_fkey foreign KEY (feature_request_id) references feature_requests (id) on delete CASCADE,
  constraint feature_request_comments_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint fr_comments_user_fk foreign KEY (user_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists comments_id_idx on public.feature_request_comments using btree (feature_request_id) TABLESPACE pg_default;

create index IF not exists feature_request_comments_created_at_idx on public.feature_request_comments using btree (created_at) TABLESPACE pg_default;

create index IF not exists frc_feature_request_id_created_at_idx on public.feature_request_comments using btree (feature_request_id, created_at) TABLESPACE pg_default;

create table public.feature_requests (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  content text null,
  title text null,
  user_id uuid null default auth.uid (),
  updated_at timestamp with time zone null default (now() AT TIME ZONE 'utc'::text),
  number_of_votes bigint null default '0'::bigint,
  status public.feature_status not null default 'open'::feature_status,
  constraint Feature Requests_pkey primary key (id),
  constraint Feature Requests_user_id_fkey foreign KEY (user_id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists feature_requests_created_at_idx on public.feature_requests using btree (created_at desc) TABLESPACE pg_default;

create table public.profiles (
  id uuid not null,
  updated_at timestamp with time zone null,
  username text null,
  full_name text null,
  avatar_url text null,
  website text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint username_length check ((char_length(username) >= 3))
) TABLESPACE pg_default;

create index IF not exists profiles_id_idx on public.profiles using btree (id) TABLESPACE pg_default;

create index IF not exists profiles_username_idx on public.profiles using btree (username) TABLESPACE pg_default;

create table public.signup_email_domains (
  id serial not null,
  domain text not null,
  type public.signup_email_domain_type not null,
  reason text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint signup_email_domains_pkey primary key (id)
) TABLESPACE pg_default;

create trigger trg_signup_email_domains_set_updated_at BEFORE
update on signup_email_domains for EACH row
execute FUNCTION update_signup_email_domains_updated_at ();

create table public.votes (
  user_id uuid not null default gen_random_uuid (),
  req_id uuid not null default gen_random_uuid (),
  "Upvoted" boolean not null,
  constraint votes_pkey primary key (user_id, req_id),
  constraint votes_req_id_fkey foreign KEY (req_id) references feature_requests (id) on delete CASCADE,
  constraint votes_user_id_fkey foreign KEY (user_id) references profiles (id)
) TABLESPACE pg_default;

create index IF not exists votes_user_id_idx on public.votes using btree (user_id) TABLESPACE pg_default;
