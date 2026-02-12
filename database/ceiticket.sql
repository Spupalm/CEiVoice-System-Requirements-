-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql_db
-- Generation Time: Feb 11, 2026 at 08:41 AM
-- Server version: 8.0.44
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ceidb`
--

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int NOT NULL,
  `ticket_id` int DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `comment_text` text,
  `comment_type` enum('Public','Internal') DEFAULT 'Public',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `draft_request_mapping`
--

CREATE TABLE `draft_request_mapping` (
  `draft_id` int NOT NULL,
  `request_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `draft_request_mapping`
--

INSERT INTO `draft_request_mapping` (`draft_id`, `request_id`) VALUES
(2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `draft_tickets`
--

CREATE TABLE `draft_tickets` (
  `id` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `summary` text,
  `resolution_path` text,
  `assigned_to` int DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `status` enum('Draft','Submitted','Merged') DEFAULT 'Draft',
  `ai_suggested_merge_id` int DEFAULT NULL,
  `created_by_ai` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `draft_tickets`
--

INSERT INTO `draft_tickets` (`id`, `title`, `category`, `summary`, `resolution_path`, `assigned_to`, `deadline`, `status`, `ai_suggested_merge_id`, `created_by_ai`, `created_at`, `updated_at`) VALUES
(1, 'Draft: dwdwdw...', 'General Inquiry', 'User Request Details: dwdwdw', NULL, NULL, NULL, 'Draft', NULL, 1, '2026-02-10 14:23:44', '2026-02-10 14:23:44'),
(2, 'Draft: test request01...', 'General Inquiry', 'User Request Details: test request01', NULL, NULL, NULL, 'Draft', NULL, 1, '2026-02-10 14:24:43', '2026-02-10 14:24:43'),
(3, 'Draft: request test 2 user_id...', 'General Inquiry', 'User Request Details: request test 2 user_id', NULL, NULL, NULL, 'Draft', NULL, 1, '2026-02-10 15:01:43', '2026-02-10 15:01:43');

-- --------------------------------------------------------

--
-- Table structure for table `task_assignments`
--

CREATE TABLE `task_assignments` (
  `id` int NOT NULL,
  `todo_id` int NOT NULL,
  `user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int NOT NULL,
  `ticket_no` varchar(20) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `summary` text,
  `resolution_path` text,
  `status` enum('New','Assigned','Solving','Solved','Failed') DEFAULT 'New',
  `assignee_id` int DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_history`
--

CREATE TABLE `ticket_history` (
  `id` int NOT NULL,
  `ticket_id` int NOT NULL,
  `action_type` enum('STATUS_CHANGE','REASSIGN','DEADLINE_UPDATE','COMMENT','SUBMIT_DRAFT') NOT NULL,
  `old_value` text,
  `new_value` text,
  `performed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `role` enum('user','assignee','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'user',
  `skills` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `username`, `password`, `profile_image`, `created_at`, `role`, `skills`) VALUES
(5, 'Watcharathorn Krachangmon', 'watchie', '$2b$10$1M57XIJGo/yKlL1wA86a1OidTNYZ138g6bASKg9bNCvwFy2LtCRi2', '6287e8e1475892c60a8fb3fd28173102', '2026-01-29 17:06:56', 'admin', NULL),
(11, 'Watcharathorn Krachangmon (1380)', '67011380@kmitl.ac.th', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocIXG3634ZtSeg1dUsJUZ1CKb8UyC6Z9qrCQ5AT_N8g9SZiCPQ=s96-c', '2026-01-31 10:29:57', 'user', NULL),
(12, 'watcharathorn krachangmon', 'watcharathorn2549@gmail.com', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocL3hyurCaMfLDwPHAf-01qiMpRsZl63__qtY1Ueol-Ci3Y31mg=s96-c', '2026-01-31 10:30:05', 'user', NULL),
(14, 'Watcharathorn Krachangmon', 'watcharat.kra_g31@mwit.ac.th', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocIZw_KmyKDE32eOsqMpySBz3zAZbn_EgedYbUqBo61dXnwCXnM=s96-c', '2026-01-31 13:50:09', 'user', NULL),
(16, 'Kittisak Chalongkulwat', 'kenmuay', '$2b$10$q/tXFg2pIWDT9zAINGYV5OX8p50QBwhKowg/d1Esr5WMH9.V26fzi', 'd609d557c1a0a62e8f020a8c0ecace86', '2026-01-31 15:00:35', 'user', NULL),
(17, 'Rick Astley', 'rickroll', '$2b$10$3zF/J19dONmjAY6CwMs.zONZR/4ePuA4SO.nf0DdvQ1BXuJn5VxXC', 'dd4eaa7dbbae294ecd86166bcf294c97', '2026-02-02 15:44:33', 'user', NULL),
(18, 'Tworockpuzzle', 'tworock', '$2b$10$kolJT7anlg06DOzxb9mYqe5mR13IQJAChdlpLiqXczhbhWw5rxES2', '96021c4ad9076047ea8f657ac066d432', '2026-02-04 09:29:23', 'user', NULL),
(20, 'ควยชิบหาย', 'ควย', '$2b$10$/yPInfm0cQ6jCi2/mG2xBeRlXFNpfGJbT5ckcYckdsYw5hzkqHXaq', '4894750d14c0b613eea2614c46e59ce3', '2026-02-08 19:24:55', 'user', NULL),
(22, 'Worawalun', 'palmy', '$2b$10$bl9xEvO30D.jMY.f/MrgG.fl6l0dMQNCYEEe6HyTmPgS3j3Ube.N6', '56d572a59eb430a0afdeaefbac27a538', '2026-02-09 11:50:20', 'assignee', 'Graphic Design'),
(23, 'adminTest', 'admin1', '$2b$10$o20HDVcoHs8F2mE7wUs8dOG97pLJfS95dIvX.cB/9n0G9HFhBlyGK', 'bf0be8f4468b607dd83f2e01a49326d2', '2026-02-09 13:22:13', 'admin', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_requests`
--

CREATE TABLE `user_requests` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('received','draft','ticket') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'received',
  `draft_ticket_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_requests`
--

INSERT INTO `user_requests` (`id`, `user_id`, `user_email`, `message`, `created_at`, `status`, `draft_ticket_id`) VALUES
(2, NULL, 'rickroll', 'test request01', '2026-02-10 14:24:43', 'draft', 2),
(4, 17, 'rickroll', 'test userid', '2026-02-10 15:08:05', 'received', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `draft_request_mapping`
--
ALTER TABLE `draft_request_mapping`
  ADD PRIMARY KEY (`draft_id`,`request_id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `draft_tickets`
--
ALTER TABLE `draft_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assigned_to` (`assigned_to`);

--
-- Indexes for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `todo_id` (`todo_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticket_no` (`ticket_no`),
  ADD KEY `assignee_id` (`assignee_id`);

--
-- Indexes for table `ticket_history`
--
ALTER TABLE `ticket_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `performed_by` (`performed_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `user_requests`
--
ALTER TABLE `user_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_request_draft` (`draft_ticket_id`),
  ADD KEY `fk_user_request_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_tickets`
--
ALTER TABLE `draft_tickets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `task_assignments`
--
ALTER TABLE `task_assignments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ticket_history`
--
ALTER TABLE `ticket_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `user_requests`
--
ALTER TABLE `user_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `draft_request_mapping`
--
ALTER TABLE `draft_request_mapping`
  ADD CONSTRAINT `draft_request_mapping_ibfk_1` FOREIGN KEY (`draft_id`) REFERENCES `draft_tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `draft_request_mapping_ibfk_2` FOREIGN KEY (`request_id`) REFERENCES `user_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `draft_tickets`
--
ALTER TABLE `draft_tickets`
  ADD CONSTRAINT `draft_tickets_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`);

--
-- Constraints for table `task_assignments`
--
ALTER TABLE `task_assignments`
  ADD CONSTRAINT `task_assignments_ibfk_1` FOREIGN KEY (`todo_id`) REFERENCES `todo` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_assignments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `ticket_history`
--
ALTER TABLE `ticket_history`
  ADD CONSTRAINT `ticket_history_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`),
  ADD CONSTRAINT `ticket_history_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_requests`
--
ALTER TABLE `user_requests`
  ADD CONSTRAINT `fk_user_request_draft` FOREIGN KEY (`draft_ticket_id`) REFERENCES `draft_tickets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_request_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
