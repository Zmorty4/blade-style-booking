insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Media files are publicly readable"
on storage.objects
for select
using (bucket_id = 'media');

create policy "Authenticated users can upload media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'media');

create policy "Authenticated users can update media"
on storage.objects
for update
to authenticated
using (bucket_id = 'media')
with check (bucket_id = 'media');

create policy "Authenticated users can delete media"
on storage.objects
for delete
to authenticated
using (bucket_id = 'media');
