-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql_db
-- Generation Time: Feb 14, 2026 at 11:23 AM
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
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'IT Support', 'Technical issues related to system, login, server, or software', '2026-02-12 17:42:22'),
(2, 'Teach Support', 'Issues related to classroom systems, LMS, or teaching tools', '2026-02-12 17:42:22'),
(3, 'Network Team', 'Internet, Wi-Fi, and network related problems', '2026-02-12 17:42:22'),
(4, 'Account & Access Team', 'Password reset, account lock, permission issues', '2026-02-12 17:42:22'),
(5, 'Finance & Billing team', 'Payment, invoice, and financial related requests', '2026-02-12 17:42:22'),
(6, 'HR Team', 'Human resource and administrative concerns', '2026-02-12 17:42:22');

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
  `suggested_assignees` int DEFAULT NULL,
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
  `role` enum('user','assignee','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `username`, `password`, `profile_image`, `created_at`, `role`) VALUES
(5, 'Watcharathorn Krachangmon', 'watchie', '$2b$10$1M57XIJGo/yKlL1wA86a1OidTNYZ138g6bASKg9bNCvwFy2LtCRi2', '6287e8e1475892c60a8fb3fd28173102', '2026-01-29 17:06:56', 'admin'),
(11, 'Watcharathorn Krachangmon (1380)', '67011380@kmitl.ac.th', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocIXG3634ZtSeg1dUsJUZ1CKb8UyC6Z9qrCQ5AT_N8g9SZiCPQ=s96-c', '2026-01-31 10:29:57', 'user'),
(12, 'watcharathorn krachangmon', 'watcharathorn2549@gmail.com', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocL3hyurCaMfLDwPHAf-01qiMpRsZl63__qtY1Ueol-Ci3Y31mg=s96-c', '2026-01-31 10:30:05', 'user'),
(14, 'Watcharathorn Krachangmon', 'watcharat.kra_g31@mwit.ac.th', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocIZw_KmyKDE32eOsqMpySBz3zAZbn_EgedYbUqBo61dXnwCXnM=s96-c', '2026-01-31 13:50:09', 'user'),
(16, 'Kittisak Chalongkulwat', 'kenmuay', '$2b$10$q/tXFg2pIWDT9zAINGYV5OX8p50QBwhKowg/d1Esr5WMH9.V26fzi', 'd609d557c1a0a62e8f020a8c0ecace86', '2026-01-31 15:00:35', 'user'),
(17, 'Rick Astley', 'rickroll', '$2b$10$3zF/J19dONmjAY6CwMs.zONZR/4ePuA4SO.nf0DdvQ1BXuJn5VxXC', 'dd4eaa7dbbae294ecd86166bcf294c97', '2026-02-02 15:44:33', 'user'),
(18, 'Tworockpuzzle', 'tworock', '$2b$10$kolJT7anlg06DOzxb9mYqe5mR13IQJAChdlpLiqXczhbhWw5rxES2', '96021c4ad9076047ea8f657ac066d432', '2026-02-04 09:29:23', 'user'),
(20, 'ควยชิบหาย', 'ควย', '$2b$10$/yPInfm0cQ6jCi2/mG2xBeRlXFNpfGJbT5ckcYckdsYw5hzkqHXaq', '4894750d14c0b613eea2614c46e59ce3', '2026-02-08 19:24:55', 'user'),
(22, 'Worawalun', 'palmy', '$2b$10$bl9xEvO30D.jMY.f/MrgG.fl6l0dMQNCYEEe6HyTmPgS3j3Ube.N6', '56d572a59eb430a0afdeaefbac27a538', '2026-02-09 11:50:20', 'assignee'),
(23, 'adminTest', 'admin1', '$2b$10$o20HDVcoHs8F2mE7wUs8dOG97pLJfS95dIvX.cB/9n0G9HFhBlyGK', 'bf0be8f4468b607dd83f2e01a49326d2', '2026-02-09 13:22:13', 'admin'),
(24, 'assigneeTest(network)', 'network', '$2b$10$Jb04hp6F6pq8anRjHsLMYuHi/Te7E3npMVYmnBw.ujlQx.8YfXSy.', '1771062429427-220163703-140511293_p0_master1200.jpg', '2026-02-14 09:47:09', 'assignee');

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
(8, 16, 'kenmuay', 'Cannot Log In to Account', '2026-02-12 18:11:53', 'draft', 5),
(9, 17, 'rickroll', 'can\'t connect to kmitl network', '2026-02-14 11:18:39', 'draft', NULL),
(10, 17, 'rickroll', 'can\'t use kmitl neetwork', '2026-02-14 11:20:35', 'draft', 7);

-- --------------------------------------------------------

--
-- Table structure for table `user_skills`
--

CREATE TABLE `user_skills` (
  `user_id` int NOT NULL,
  `category_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_skills`
--

INSERT INTO `user_skills` (`user_id`, `category_id`) VALUES
(24, 3);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

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
  ADD KEY `assigned_to` (`assigned_to`),
  ADD KEY `fk_suggested_category` (`suggested_assignees`);

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
-- Indexes for table `user_skills`
--
ALTER TABLE `user_skills`
  ADD PRIMARY KEY (`user_id`,`category_id`),
  ADD KEY `category_id` (`category_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `draft_tickets`
--
ALTER TABLE `draft_tickets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `user_requests`
--
ALTER TABLE `user_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
  ADD CONSTRAINT `draft_tickets_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_suggested_category` FOREIGN KEY (`suggested_assignees`) REFERENCES `categories` (`id`);

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

--
-- Constraints for table `user_skills`
--
ALTER TABLE `user_skills`
  ADD CONSTRAINT `user_skills_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_skills_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;