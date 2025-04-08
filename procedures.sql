-- Average measurements by class
CREATE OR REPLACE FUNCTION get_bean_stats()
RETURNS TABLE (class VARCHAR, avg_area FLOAT) AS $$
BEGIN
  RETURN QUERY 
  SELECT Class, AVG(Area) 
  FROM dry_beans 
  GROUP BY Class;
END;
$$ LANGUAGE plpgsql;