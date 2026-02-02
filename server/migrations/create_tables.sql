-- Run this to create the database and table

CREATE DATABASE IF NOT EXISTS jobbids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jobbids;

CREATE TABLE IF NOT EXISTS bids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  jd_link VARCHAR(1024) DEFAULT '',
  status VARCHAR(50) DEFAULT 'Applied',
  interview_status VARCHAR(100) DEFAULT '',
  bidded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  interview_scheduled DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- optional sample data
INSERT INTO bids (company_name, job_title, jd_link, status, interview_status, interview_scheduled)
VALUES
('Acme Corp', 'Frontend Engineer', 'https://acme.example/jd/frontend', 'Applied', '', NULL),
('Acme Corp', 'Backend Engineer', 'https://acme.example/jd/backend', 'Interview', 'Phone screen', '2026-02-10 10:00:00'),
('Globex', 'Fullstack Developer', 'https://globex.example/jd/fullstack', 'Offer', 'Onsite', '2026-02-15 14:00:00');
