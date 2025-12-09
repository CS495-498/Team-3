Here’s a well-formatted Markdown representation of your SQL schema:

```markdown
# Database Schema

## Table: `public.bookmarks`

```sql
CREATE TABLE public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  user_id uuid NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  resource_title text NULL,
  resource_description text NULL,
  resource_url text NULL,
  resource_thumbnail text NULL,
  metadata jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT bookmarks_user_id_resource_type_resource_id_key UNIQUE (user_id, resource_type, resource_id),
  CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT bookmarks_resource_type_check CHECK (
    resource_type = ANY (
      ARRAY[
        'demo_website'::text,
        'demo_instruction'::text,
        'video'::text
      ]
    )
  )
) TABLESPACE pg_default;
```

---

## Table: `public.feature_request_comments`

```sql
CREATE TABLE public.feature_request_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
  content text NOT NULL,
  feature_request_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid (),
  CONSTRAINT feature_request_comments_pkey PRIMARY KEY (id),
  CONSTRAINT feature_request_comments_feature_request_id_fkey FOREIGN KEY (feature_request_id) REFERENCES feature_requests (id) ON DELETE CASCADE,
  CONSTRAINT feature_request_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT fr_comments_user_fk FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
) TABLESPACE pg_default;
```

---

## Indexes for `feature_request_comments`

```sql
CREATE INDEX IF NOT EXISTS comments_id_idx ON public.feature_request_comments USING btree (feature_request_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS feature_request_comments_created_at_idx ON public.feature_request_comments USING btree (created_at) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS frc_feature_request_id_created_at_idx ON public.feature_request_comments USING btree (feature_request_id, created_at) TABLESPACE pg_default;
```

---

## Table: `public.feature_requests`

```sql
CREATE TABLE public.feature_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  content text NULL,
  title text NULL,
  user_id uuid NULL DEFAULT auth.uid (),
  updated_at timestamp with time zone NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
  number_of_votes bigint NULL DEFAULT '0'::bigint,
  status public.feature_status NOT NULL DEFAULT 'open'::feature_status,
  CONSTRAINT feature_requests_pkey PRIMARY KEY (id),
  CONSTRAINT feature_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
) TABLESPACE pg_default;
```

---

## Index for `feature_requests`

```sql
CREATE INDEX IF NOT EXISTS feature_requests_created_at_idx ON public.feature_requests USING btree (created_at DESC) TABLESPACE pg_default;
```

---

## Table: `public.profiles`

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone NULL,
  username text NULL,
  full_name text NULL,
  avatar_url text NULL,
  website text NULL,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_username_key UNIQUE (username),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT username_length CHECK ((char_length(username) >= 3))
) TABLESPACE pg_default;
```

---

## Indexes for `profiles`

```sql
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles USING btree (id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles USING btree (username) TABLESPACE pg_default;
```

---

## Table: `public.signup_email_domains`

```sql
CREATE TABLE public.signup_email_domains (
  id serial NOT NULL,
  domain text NOT NULL,
  type public.signup_email_domain_type NOT NULL,
  reason text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT signup_email_domains_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;
```

---

## Trigger for `signup_email_domains`

```sql
CREATE TRIGGER trg_signup_email_domains_set_updated_at BEFORE
UPDATE ON signup_email_domains FOR EACH ROW
EXECUTE FUNCTION update_signup_email_domains_updated_at ();
```

