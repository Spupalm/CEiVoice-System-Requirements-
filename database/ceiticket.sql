-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql_db
-- Generation Time: Feb 20, 2026 at 05:15 PM
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

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `ticket_id`, `user_id`, `comment_text`, `comment_type`, `created_at`) VALUES
(1, 25, 22, 'ควย', 'Public', '2026-02-20 13:53:44');

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
(35, 34),
(36, 36);

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

INSERT INTO `draft_tickets` (`id`, `title`, `category`, `summary`, `resolution_path`, `suggested_assignees`, `assigned_to`, `deadline`, `status`, `ai_suggested_merge_id`, `created_by_ai`, `created_at`, `updated_at`) VALUES
(35, 'API Server Connection Issue', 'IT Support', 'The user is reporting an inability to connect to the API server. This could be due to network connectivity problems, firewall restrictions, incorrect API endpoint configuration, or an issue with the API server itself.', '[\"Verify internet connectivity.\",\"Confirm the API endpoint URL is correct and accessible.\",\"Check local firewall settings to ensure access to the API server is not blocked.\",\"Attempt to ping the API server IP address or hostname to check for basic network reachability.\",\"Review API documentation for known outages or specific connection requirements (e.g., VPN, proxy).\"]', 1, NULL, NULL, 'Submitted', NULL, 1, '2026-02-19 12:29:52', '2026-02-19 15:35:34'),
(36, 'Cannot Connect to API Server', 'IT Support', 'The user is reporting an inability to establish a connection to the API server.', '[\"Check the user\'s network connectivity to ensure internet access.\",\"Verify that the API server\'s endpoint URL or IP address is correctly configured.\",\"Inspect local firewall settings or proxy configurations that might be blocking the connection.\",\"Attempt to ping the API server\'s hostname or IP address to check basic reachability.\",\"Confirm the operational status of the API server itself.\"]', 1, 22, '2026-02-21 19:13:00', 'Submitted', NULL, 1, '2026-02-19 12:34:48', '2026-02-20 12:13:58');

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
  `resolution_comment` text,
  `assignee_id` int DEFAULT NULL,
  `follower_id` int DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tickets`
--

INSERT INTO `tickets` (`id`, `ticket_no`, `title`, `category`, `summary`, `resolution_path`, `status`, `resolution_comment`, `assignee_id`, `follower_id`, `deadline`, `created_at`, `updated_at`) VALUES
(24, 'TK-1771510901193', 'API Server Connection Issue', 'IT Support', 'The user is reporting an inability to connect to the API server. This could be due to network connectivity problems, firewall restrictions, incorrect API endpoint configuration, or an issue with the API server itself.\n\n[System Note: Assignee role changed to user. Ticket failed automatically.]', '[\"Verify internet connectivity.\",\"Confirm the API endpoint URL is correct and accessible.\",\"Check local firewall settings to ensure access to the API server is not blocked.\",\"Attempt to ping the API server IP address or hostname to check for basic network reachability.\",\"Review API documentation for known outages or specific connection requirements (e.g., VPN, proxy).\"]', 'Failed', NULL, 24, 17, '2026-03-06 21:21:00', '2026-02-19 14:21:41', '2026-02-19 15:35:34'),
(25, 'TK-1771589621018', 'Cannot Connect to API Server', 'IT Support', 'The user is reporting an inability to establish a connection to the API server.', '[\"Check the user\'s network connectivity to ensure internet access.\",\"Verify that the API server\'s endpoint URL or IP address is correctly configured.\",\"Inspect local firewall settings or proxy configurations that might be blocking the connection.\",\"Attempt to ping the API server\'s hostname or IP address to check basic reachability.\",\"Confirm the operational status of the API server itself.\"]', 'Assigned', '', 22, 17, '2026-03-04 19:13:00', '2026-02-20 12:13:41', '2026-02-20 13:53:24');

-- --------------------------------------------------------

--
-- Table structure for table `ticket_followers`
--

CREATE TABLE `ticket_followers` (
  `id` int NOT NULL,
  `ticket_id` int NOT NULL,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ticket_followers`
--

INSERT INTO `ticket_followers` (`id`, `ticket_id`, `user_id`, `created_at`) VALUES
(0, 25, 25, '2026-02-20 13:34:24'),
(0, 25, 31, '2026-02-20 13:53:54');

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

--
-- Dumping data for table `ticket_history`
--

INSERT INTO `ticket_history` (`id`, `ticket_id`, `action_type`, `old_value`, `new_value`, `performed_by`, `created_at`) VALUES
(1, 25, 'STATUS_CHANGE', 'New', 'Assigned', 22, '2026-02-20 13:53:24'),
(2, 25, 'STATUS_CHANGE', 'New', 'Assigned', 22, '2026-02-20 13:53:25'),
(3, 25, 'STATUS_CHANGE', 'New', 'Assigned', 22, '2026-02-20 13:53:56');

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
  `is_approved` tinyint(1) DEFAULT '1' COMMENT '0=Pending, 1=Approved'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `username`, `password`, `profile_image`, `created_at`, `role`, `is_approved`) VALUES
(5, 'Watcharathorn Krachangmon', 'watchie', '$2b$10$1M57XIJGo/yKlL1wA86a1OidTNYZ138g6bASKg9bNCvwFy2LtCRi2', '6287e8e1475892c60a8fb3fd28173102', '2026-01-29 17:06:56', 'admin', 1),
(11, 'Watcharathorn Krachangmon (1380)', '67011380@kmitl.ac.th', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocIXG3634ZtSeg1dUsJUZ1CKb8UyC6Z9qrCQ5AT_N8g9SZiCPQ=s96-c', '2026-01-31 10:29:57', 'user', 1),
(12, 'watcharathorn krachangmon', 'watcharathorn2549@gmail.com', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocL3hyurCaMfLDwPHAf-01qiMpRsZl63__qtY1Ueol-Ci3Y31mg=s96-c', '2026-01-31 10:30:05', 'user', 1),
(14, 'Watcharathorn Krachangmon', 'watcharat.kra_g31@mwit.ac.th', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocIZw_KmyKDE32eOsqMpySBz3zAZbn_EgedYbUqBo61dXnwCXnM=s96-c', '2026-01-31 13:50:09', 'user', 1),
(16, 'Kittisak Chalongkulwat', 'kenmuay', '$2b$10$q/tXFg2pIWDT9zAINGYV5OX8p50QBwhKowg/d1Esr5WMH9.V26fzi', 'd609d557c1a0a62e8f020a8c0ecace86', '2026-01-31 15:00:35', 'user', 1),
(17, 'Rick Astley', 'rickroll', '$2b$10$3zF/J19dONmjAY6CwMs.zONZR/4ePuA4SO.nf0DdvQ1BXuJn5VxXC', 'dd4eaa7dbbae294ecd86166bcf294c97', '2026-02-02 15:44:33', 'user', 1),
(18, 'Tworockpuzzle', 'tworock', '$2b$10$kolJT7anlg06DOzxb9mYqe5mR13IQJAChdlpLiqXczhbhWw5rxES2', '96021c4ad9076047ea8f657ac066d432', '2026-02-04 09:29:23', 'user', 1),
(20, 'ควยชิบหาย', 'ควย', '$2b$10$/yPInfm0cQ6jCi2/mG2xBeRlXFNpfGJbT5ckcYckdsYw5hzkqHXaq', '4894750d14c0b613eea2614c46e59ce3', '2026-02-08 19:24:55', 'user', 1),
(22, 'Worawalun', 'palmy', '$2b$10$bl9xEvO30D.jMY.f/MrgG.fl6l0dMQNCYEEe6HyTmPgS3j3Ube.N6', '56d572a59eb430a0afdeaefbac27a538', '2026-02-09 11:50:20', 'assignee', 1),
(23, 'adminTest', 'admin1', '$2b$10$o20HDVcoHs8F2mE7wUs8dOG97pLJfS95dIvX.cB/9n0G9HFhBlyGK', 'bf0be8f4468b607dd83f2e01a49326d2', '2026-02-09 13:22:13', 'admin', 1),
(24, 'assigneeTest(network)', 'network', '$2b$10$Jb04hp6F6pq8anRjHsLMYuHi/Te7E3npMVYmnBw.ujlQx.8YfXSy.', '1771062429427-220163703-140511293_p0_master1200.jpg', '2026-02-14 09:47:09', 'user', 1),
(25, 'assigneeTest(ITSupport)', 'ITsupport', '$2b$10$x3ff9cfnPUFUjYrbGPFzO.bW0hDPu9L1cgTBpH325H/pXQE73MyEO', '1771236740453-671959002-Screenshot 2026-02-15 211331.png', '2026-02-16 10:12:20', 'assignee', 1),
(26, 'assigneeTest(TeachSupport)', 'TeachSupport', '$2b$10$mZsm5RYQMBjI7Q8PBM3hLeG2haqYOJjrUXNLKzd6BxyomgdZbnZeu', '1771236816401-398122773-68498.jpg', '2026-02-16 10:13:36', 'assignee', 1),
(27, 'assigneeTest(HRTeam)', 'HRTeam', '$2b$10$xDE7lBZg5E/Cf2.S4IWlsOoam63wIj6pSO93s/oqSsaVoLXG.FpwC', '1771236856794-140663019-68498.jpg', '2026-02-16 10:14:17', 'assignee', 1),
(28, 'assigneeTest(Account&AccessTeam)', 'AccountTeam', '$2b$10$l2mkN5lUc4OC51buxs2b1.tQkJKkEtMuICCGW9lPa.oDZ3tB78qq6', '1771236905953-858629775-68328.jpg', '2026-02-16 10:15:06', 'assignee', 1),
(29, 'assigneeTest(Finance&Billing team)', 'FinanceTeam', '$2b$10$uIWtmZz5Kr6GlEe8846W.uzs4hNpDxE76qU62zz3gr4S95S7N1sIW', '1771236957241-212946747-67792.jpg', '2026-02-16 10:15:57', 'assignee', 1),
(30, 'dwdwdwdwd dwdwdwdwd', 'gaemefefelmfe@gmail.com', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocJDLWpp2ttQKDOKVvbiLqJEXuE0W_LoUdSZ1UkLEzQNLzM4NA=s96-c', '2026-02-16 16:08:13', 'user', 1),
(31, 'test2team', '2team', '$2b$10$2gAubtDEp8P/Gpfl5r/LRuvWbj1Mys/HXOnnXe.lfXfnJpDiGRlc.', '1771349622060-886226581-68497.jpg', '2026-02-17 17:33:42', 'assignee', 1),
(32, 'checkphoto', 'check', '$2b$10$V6WrweWPpNb5WSRjLl2LO.8Agj4bVxflfbiic06ViHLIHkRYTA2Na', '1771424529073-47857953-68270.jpg', '2026-02-18 14:22:09', 'assignee', 1),
(33, 'เหี้ยไรสัส', 'เหี้ย', '$2b$10$RbzMwlKrtPc8mdncvqkXVeMf94LeRTcH57CEC6W2Ai.QHrHB17JUi', '7ebb61a3f6e43967b65989efc379c35a.jpg', '2026-02-18 14:46:12', 'user', 1),
(34, 'testapproveassignee', 'approve', '$2b$10$rVANSyYoDVnKyjWZzjCLMOn9FmBPgln/FhYTEi6Sfm6H9NLgUhVzy', '1771603119444-709374598-69061.jpg', '2026-02-20 15:58:39', 'assignee', 1),
(35, 'testdwdw', 'we', '$2b$10$rfKhMY3vg2DQqBdenbLRXOQtRFvH2SGobVdSOEoHSHQjlEEPIf25a', '1771605993621-65469953-69021.jpg', '2026-02-20 16:46:33', 'assignee', 0);

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
  `draft_ticket_id` int DEFAULT NULL,
  `tracking_token_hash` char(64) DEFAULT NULL,
  `tracking_token_last4` char(4) DEFAULT NULL,
  `tracking_token_expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user_requests`
--

INSERT INTO `user_requests` (`id`, `user_id`, `user_email`, `message`, `created_at`, `status`, `draft_ticket_id`, `tracking_token_hash`, `tracking_token_last4`, `tracking_token_expires_at`) VALUES
(34, 17, 'rickroll', 'my computer is so hot', '2026-02-18 16:01:41', 'draft', NULL, NULL, NULL, NULL),
(35, 17, 'rickroll', 'my computer temperature is high', '2026-02-18 16:02:35', 'draft', NULL, NULL, NULL, NULL),
(36, 17, 'rickroll', 'i cannot connect to api server', '2026-02-19 12:29:46', 'ticket', 36, NULL, NULL, NULL);

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
(25, 1),
(31, 1),
(26, 2),
(34, 2),
(22, 3),
(28, 4),
(31, 4),
(34, 4),
(35, 4),
(29, 5),
(32, 5),
(34, 5),
(35, 5),
(22, 6),
(27, 6),
(31, 6);

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
  ADD KEY `fk_suggested_category` (`suggested_assignees`),
  ADD KEY `fk_ai_suggested_merge` (`ai_suggested_merge_id`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticket_no` (`ticket_no`),
  ADD KEY `assignee_id` (`assignee_id`),
  ADD KEY `fk_ticket_follower` (`follower_id`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `draft_tickets`
--
ALTER TABLE `draft_tickets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `ticket_history`
--
ALTER TABLE `ticket_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `user_requests`
--
ALTER TABLE `user_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

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
  ADD CONSTRAINT `fk_ai_suggested_merge` FOREIGN KEY (`ai_suggested_merge_id`) REFERENCES `draft_tickets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_suggested_category` FOREIGN KEY (`suggested_assignees`) REFERENCES `categories` (`id`);

--
-- Constraints for table `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `fk_ticket_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
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
