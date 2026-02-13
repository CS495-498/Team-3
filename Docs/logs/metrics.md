DAILY API METRICS TABLE SCHEMA

| column_name   | data_type         | is_nullable | column_default |
| ------------- | ----------------- | ----------- | -------------- |
| date          | date              | NO          | null           |
| endpoint      | character varying | NO          | null           |
| request_count | numeric           | NO          | null           |
| error_count   | numeric           | NO          | null           |
| log_type      | character varying | NO          | null           |
| post_count    | numeric           | YES         | null           |
| get_count     | numeric           | YES         | null           |
| put_count     | numeric           | YES         | null           |
| delete_count  | numeric           | YES         | null           |


DAILY USER METRICS TABLE SCHEMA

| column_name   | data_type         | is_nullable | column_default |
| ------------- | ----------------- | ----------- | -------------- |
| date          | date              | NO          | null           |
| user_id       | character varying | NO          | null           |
| request_count | numeric           | NO          | null           |
| endpoint      | character varying | NO          | null           |
| post_count    | numeric           | YES         | null           |
| get_count     | numeric           | YES         | null           |
| put_count     | numeric           | YES         | null           |
| delete_count  | numeric           | YES         | null           |