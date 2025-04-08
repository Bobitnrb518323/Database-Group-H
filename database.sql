-- 1. CLEANUP
DROP TRIGGER inventory_trigger;
DROP FUNCTION update_inventory;
DROP TABLE bean_inventory;
DROP FUNCTION get_bean_stats_by_class;
DROP INDEX idx_bean_class;

-- 1. STATISTICS FUNCTION (DB2 version)
CREATE OR REPLACE PROCEDURE get_bean_stats_by_class(
    IN p_bean_class VARCHAR(50),
    OUT avg_area DECIMAL(10,4),
    OUT avg_perimeter DECIMAL(10,4),
    OUT bean_count BIGINT
)
LANGUAGE SQL
BEGIN
    SELECT 
        ROUND(AVG(area), 4) AS avg_area,
        ROUND(AVG(perimeter), 4) AS avg_perimeter,
        COUNT(*) AS bean_count
    INTO avg_area, avg_perimeter, bean_count
    FROM bean_inventory
    WHERE bean_class = p_bean_class;
 
END;

-- 2. INVENTORY SYSTEM
CREATE TABLE bean_inventory (
    bean_class VARCHAR(50) PRIMARY KEY,
    quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    area DECIMAL(10,4),  -- Ensure this field exists if referenced in the procedure
    perimeter DECIMAL(10,4) -- Added this line based on context
);

-- Initialize with MERGE statement (DB2 version)
MERGE INTO bean_inventory AS target
USING (SELECT bean_class, COUNT(*) AS cnt FROM dry_beans GROUP BY bean_class) AS source
ON target.bean_class = source.bean_class
WHEN MATCHED THEN
    UPDATE SET quantity = source.cnt, last_updated = CURRENT TIMESTAMP
WHEN NOT MATCHED THEN
    INSERT (bean_class, quantity, last_updated) VALUES (source.bean_class, source.cnt, CURRENT TIMESTAMP);

-- 3. VERIFICATION & TESTING
----------------------------
-- View current inventory
SELECT * FROM bean_inventory 
ORDER BY quantity DESC, bean_class;

-- Test procedure
CALL get_bean_stats_by_class('DERMASON', avg_area, avg_perimeter, bean_count);

-- Test trigger functionality (using correct columns)
-- First check current test bean count
SELECT * FROM bean_inventory WHERE bean_class = 'TEST_BEAN';

-- Insert test record (using only existing columns)
INSERT INTO dry_beans (bean_class, area, perimeter) 
VALUES ('TEST_BEAN', 100, 50);

-- Verify insert
SELECT * FROM bean_inventory WHERE bean_class = 'TEST_BEAN';

-- Clean up test data
DELETE FROM dry_beans WHERE bean_class = 'TEST_BEAN';

-- Verify delete
SELECT * FROM bean_inventory WHERE bean_class = 'TEST_BEAN';