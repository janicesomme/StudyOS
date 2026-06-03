alter table courses
  add column question_source text not null default 'generated'
  check (question_source in ('image_bank', 'generated'));

-- Ochem course uses the image library, not generated questions
update courses
  set question_source = 'image_bank'
  where id = '5a004484-4b43-4a74-bd76-65bbd924ec17';
