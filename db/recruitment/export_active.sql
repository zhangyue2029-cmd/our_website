SELECT jsonb_build_object(
    'version', version,
    'requirements', jsonb_agg(jsonb_build_object(
        'id', id, 'careerId', career_id, 'category', category, 'summary', summary
    ) ORDER BY id)
)
FROM recruitment.released_requirements
GROUP BY version;
