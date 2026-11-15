-- Run once as root. The lab's own database; the wtt user gets it, nothing else changes.
CREATE DATABASE IF NOT EXISTS lab_three_wikipedias CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci;
GRANT ALL PRIVILEGES ON lab_three_wikipedias.* TO 'wtt'@'%';
