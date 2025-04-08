SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dry_beans'
ORDER BY ordinal_position;