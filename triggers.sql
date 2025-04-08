-- Validation trigger
CREATE OR REPLACE FUNCTION validate_bean()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.Area <= 0 THEN
    RAISE EXCEPTION 'Area must be positive';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_bean_trigger
BEFORE INSERT ON dry_beans
FOR EACH ROW EXECUTE FUNCTION validate_bean();