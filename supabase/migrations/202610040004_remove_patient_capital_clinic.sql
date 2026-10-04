update public.content_items
set status = 'archived',
    featured = false,
    updated_at = now()
where slug = 'patient-capital-clinic';
