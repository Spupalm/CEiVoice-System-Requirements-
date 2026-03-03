-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mysql_db
-- Generation Time: Feb 27, 2026 at 06:14 PM
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
(1, 25, 22, 'ควย', 'Public', '2026-02-20 13:53:44'),
(2, 28, 22, 'ควยไรไอวัชร รีบจัง', 'Public', '2026-02-23 17:21:45'),
(3, 36, 36, 'dwdwdwdw', 'Public', '2026-02-26 11:23:31'),
(4, 36, 36, 'ไกไ', 'Public', '2026-02-26 11:24:58');

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
(36, 36),
(37, 38),
(38, 39),
(39, 40),
(40, 42),
(37, 43),
(37, 44),
(43, 45),
(43, 46),
(45, 47),
(45, 48),
(47, 49),
(48, 50),
(49, 51),
(50, 52);

-- --------------------------------------------------------

--
-- Table structure for table `draft_tickets`
--

CREATE TABLE `draft_tickets` (
  `id` int NOT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `summary` text,
  `original_message` text,
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

INSERT INTO `draft_tickets` (`id`, `user_email`, `title`, `category`, `summary`, `original_message`, `resolution_path`, `suggested_assignees`, `assigned_to`, `deadline`, `status`, `ai_suggested_merge_id`, `created_by_ai`, `created_at`, `updated_at`) VALUES
(35, NULL, 'API Server Connection Issue', 'IT Support', 'The user is reporting an inability to connect to the API server. This could be due to network connectivity problems, firewall restrictions, incorrect API endpoint configuration, or an issue with the API server itself.', NULL, '[\"Verify internet connectivity.\",\"Confirm the API endpoint URL is correct and accessible.\",\"Check local firewall settings to ensure access to the API server is not blocked.\",\"Attempt to ping the API server IP address or hostname to check for basic network reachability.\",\"Review API documentation for known outages or specific connection requirements (e.g., VPN, proxy).\"]', 1, NULL, NULL, 'Submitted', NULL, 1, '2026-02-19 12:29:52', '2026-02-19 15:35:34'),
(36, NULL, 'Cannot Connect to API Server', 'IT Support', 'The user is reporting an inability to establish a connection to the API server.', NULL, '[\"Check the user\'s network connectivity to ensure internet access.\",\"Verify that the API server\'s endpoint URL or IP address is correctly configured.\",\"Inspect local firewall settings or proxy configurations that might be blocking the connection.\",\"Attempt to ping the API server\'s hostname or IP address to check basic reachability.\",\"Confirm the operational status of the API server itself.\"]', 1, NULL, '2026-02-21 19:13:00', 'Submitted', NULL, 1, '2026-02-19 12:34:48', '2026-02-23 17:17:11'),
(37, NULL, 'Cannot Open Desktop', 'IT Support', 'The user is unable to open or access their desktop environment.', NULL, '[\"Restart the computer and try again.\",\"Check all monitor cables and ensure they are securely connected to both the monitor and the computer.\",\"If possible, try booting the computer in Safe Mode to diagnose potential software conflicts.\",\"Verify if any recent software installations or updates were performed before the issue started.\"]', 1, 25, NULL, 'Submitted', NULL, 1, '2026-02-23 17:11:51', '2026-02-26 09:47:52'),
(38, NULL, 'Unable to Send Emails', 'IT Support', 'User reports that they are unable to send messages from their email account.', NULL, '[\"Check internet connection.\",\"Verify email client settings, especially the outgoing (SMTP) server settings and authentication.\",\"Check if the mailbox storage limit has been reached.\",\"Try sending a test email to a known working address.\",\"Restart the email application or computer.\",\"Note any specific error messages received when attempting to send.\"]', 1, NULL, '2026-02-24 00:15:00', 'Submitted', NULL, 1, '2026-02-23 17:14:42', '2026-02-23 17:17:11'),
(39, NULL, 'General Computer Issue / Frustration', 'IT Support', 'The user is expressing frustration and indicates a general issue with their computer\'s functionality.', NULL, '[\"Ask the user to describe the specific problem they are experiencing.\",\"Suggest basic troubleshooting steps like restarting the computer.\",\"Inquire about any error messages or unusual behavior.\",\"Verify power connections and peripherals.\"]', 1, 22, '2026-02-26 00:20:00', 'Submitted', NULL, 1, '2026-02-23 17:18:09', '2026-02-23 17:20:50'),
(40, 'watcharathorn2549@gmail.com', 'Cannot Use Command Prompt (CMD)', 'IT Support', 'The user reports they are unable to use the Command Prompt (CMD). This could indicate an issue with the application itself, system file corruption, or access restrictions preventing its use.', 'can not use cmd', '[\"Try opening Command Prompt by pressing `Win + R`, typing `cmd`, and pressing Enter.\",\"Attempt to open Command Prompt as an administrator (right-click Start menu, select \'Command Prompt (Admin)\' or \'Windows PowerShell (Admin)\').\",\"If it opens but doesn\'t work, try running `sfc /scannow` in an elevated Command Prompt to check for system file corruption.\",\"Provide any specific error messages received when trying to open or use CMD.\"]', 1, 31, NULL, 'Draft', NULL, 1, '2026-02-25 12:54:16', '2026-02-25 12:54:16'),
(43, 'watcharathorn2549@gmail.com', 'Cannot Open Website', 'IT Support', 'The user reports an inability to open or access a specific website. This issue could stem from various factors including local network connectivity problems, browser configuration errors, firewall restrictions, or the website itself experiencing downtime. Further investigation is required to diagnose the precise root cause.', 'can not open website', '[\"Verify the internet connection is active by trying to access other websites.\",\"Attempt to open the website using a different web browser (e.g., Chrome, Firefox, Edge).\",\"Clear browser cache and cookies, then try accessing the website again.\",\"Restart the computer and/or the network router/modem.\",\"If possible, check if other users on the same network are experiencing similar issues with the website.\"]', 1, 27, '2026-02-27 17:09:00', 'Submitted', NULL, 1, '2026-02-26 09:57:23', '2026-02-26 10:21:03'),
(45, 'watcharathorn2549@gmail.com', 'Cannot Logout from Website', 'IT Support', 'The user is reporting an inability to successfully log out from a website. This issue prevents them from ending their active session, potentially posing a privacy or security risk. The root cause could involve browser-related issues (like corrupted cache or cookies), problems with the website\'s session management, or a bug within the website\'s logout functionality itself.', 'can not logout from website', '[\"Clear browser cache and cookies specifically for the website in question.\",\"Attempt to log out from the website using a different web browser (e.g., if currently using Chrome, try Firefox or Edge).\",\"Try logging out while in an incognito or private browsing window.\",\"Restart the web browser completely.\",\"If possible, test logging out from the same website on a different device to determine if the issue is device-specific or related to the user\'s account/website itself.\"]', 1, NULL, NULL, 'Submitted', NULL, 1, '2026-02-26 10:23:33', '2026-02-26 10:24:36'),
(47, NULL, 'Keyboard Malfunction Reported', 'IT Support', 'The user reports experiencing a problem with their keyboard. The exact nature of the malfunction (e.g., specific keys not working, entire keyboard unresponsive, incorrect input) is not specified. Further investigation is required to diagnose the issue.', NULL, '[\"Check if the keyboard is properly connected to the computer (for wired keyboards).\",\"For wireless keyboards, ensure batteries are charged/replaced and the receiver is plugged in.\",\"Restart the computer to see if the issue resolves itself.\",\"Test the keyboard on another computer if possible, or try a different keyboard on this computer to isolate the problem.\",\"Check Device Manager for keyboard drivers and update or reinstall them if necessary.\"]', 1, NULL, NULL, 'Draft', NULL, 1, '2026-02-26 11:57:54', '2026-02-26 11:57:54'),
(48, NULL, 'Unclear User Message - Further Information Needed', 'IT Support', 'The provided user message \"dwdwdwdw\" is unintelligible and does not contain enough information to identify a specific issue or request. We require further details from the user to proceed with troubleshooting or addressing their query.', NULL, '[\"Contact the user to request a clear and detailed description of their problem or request.\",\"If possible, provide examples of information needed (e.g., \\\"What are you trying to do?\\\", \\\"What error message are you seeing?\\\", \\\"Where are you experiencing this problem?\\\").\",\"Update the ticket once sufficient information is gathered.\"]', 1, NULL, NULL, 'Draft', NULL, 1, '2026-02-26 12:10:57', '2026-02-26 12:10:57'),
(49, NULL, 'Unclear User Message: \'can ot draw a websie\'', 'IT Support', 'The user provided a highly garbled message: \"can ot draw a websie\". This message is unintelligible and does not contain enough clear information to identify a specific issue or request. Further clarification from the user is essential to proceed with diagnosing any potential problem.', NULL, '[\"Contact the user immediately to request a clearer explanation of their issue.\",\"Ask the user to rephrase their problem in simple terms, specifying what they were trying to do.\",\"Inquire if they encountered any error messages or specific symptoms.\",\"If applicable, ask for screenshots or more context about the task they were attempting.\"]', 1, NULL, NULL, 'Draft', 48, 1, '2026-02-26 12:11:47', '2026-02-26 12:11:47'),
(50, 'rickroll', 'Computer Not Starting', 'IT Support', 'The user reports that they are unable to \'open\' their computer, indicating it is not powering on or booting up. Further information is required to diagnose the exact problem, such as whether there are any lights, sounds, or error messages.', 'can not open cpmputer', '[\"Check if the computer\'s power cable is securely plugged into both the computer and a working power outlet.\",\"If it\'s a laptop, ensure the AC adapter is connected and the battery has sufficient charge. Try removing the battery (if removable) and running it directly from the power adapter.\",\"Press the power button firmly and observe for any lights, fan sounds, or beeps. If there are any, note them down.\",\"If possible, try a different power outlet or power cable to rule out external power issues.\"]', 1, NULL, NULL, 'Draft', NULL, 1, '2026-02-26 12:12:30', '2026-02-26 12:12:30');

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
(24, 'TK-1771510901193', 'API Server Connection Issue', 'IT Support', 'The user is reporting an inability to connect to the API server. This could be due to network connectivity problems, firewall restrictions, incorrect API endpoint configuration, or an issue with the API server itself.\n\n[System Note: Assignee role changed to user. Ticket failed automatically.]', '[\"Verify internet connectivity.\",\"Confirm the API endpoint URL is correct and accessible.\",\"Check local firewall settings to ensure access to the API server is not blocked.\",\"Attempt to ping the API server IP address or hostname to check for basic network reachability.\",\"Review API documentation for known outages or specific connection requirements (e.g., VPN, proxy).\"]', 'Assigned', NULL, 24, 17, '2026-03-06 21:21:00', '2026-02-19 14:21:41', '2026-02-22 15:30:34'),
(25, 'TK-1771589621018', 'Cannot Connect to API Server', 'IT Support', 'The user is reporting an inability to establish a connection to the API server.\n\n[System Note: Assignee role changed to user. Ticket failed automatically.]', '[\"Check the user\'s network connectivity to ensure internet access.\",\"Verify that the API server\'s endpoint URL or IP address is correctly configured.\",\"Inspect local firewall settings or proxy configurations that might be blocking the connection.\",\"Attempt to ping the API server\'s hostname or IP address to check basic reachability.\",\"Confirm the operational status of the API server itself.\"]', 'Failed', '', 22, 17, '2026-03-04 19:13:00', '2026-02-20 12:13:41', '2026-02-23 17:17:11'),
(26, 'TK-1771866926390', 'Unable to Send Emails', 'IT Support', 'User reports that they are unable to send messages from their email account.', '[\"Check internet connection.\",\"Verify email client settings, especially the outgoing (SMTP) server settings and authentication.\",\"Check if the mailbox storage limit has been reached.\",\"Try sending a test email to a known working address.\",\"Restart the email application or computer.\",\"Note any specific error messages received when attempting to send.\"]', 'Failed', 'kuy stupid user', 22, 12, '2026-02-24 00:15:00', '2026-02-23 17:15:26', '2026-02-23 17:16:35'),
(28, 'TK-1771867250419', 'General Computer Issue / Frustration', 'IT Support', 'The user is expressing frustration and indicates a general issue with their computer\'s functionality.', '[\"Ask the user to describe the specific problem they are experiencing.\",\"Suggest basic troubleshooting steps like restarting the computer.\",\"Inquire about any error messages or unusual behavior.\",\"Verify power connections and peripherals.\"]', 'Solved', '56789', 22, 12, '2026-02-26 00:20:00', '2026-02-23 17:20:50', '2026-02-23 17:22:04'),
(30, 'TK-1772100293834', 'Cannot Open Website', 'IT Support', 'The user reports an inability to open or access a specific website. This issue could stem from various factors including local network connectivity problems, browser configuration errors, firewall restrictions, or the website itself experiencing downtime. Further investigation is required to diagnose the precise root cause.', '[\"Verify the internet connection is active by trying to access other websites.\",\"Attempt to open the website using a different web browser (e.g., Chrome, Firefox, Edge).\",\"Clear browser cache and cookies, then try accessing the website again.\",\"Restart the computer and/or the network router/modem.\",\"If possible, check if other users on the same network are experiencing similar issues with the website.\"]', 'New', NULL, 22, 12, '2026-02-27 17:04:00', '2026-02-26 10:04:53', '2026-02-26 10:04:53'),
(31, 'TK-1772100546755', 'Cannot Open Website', 'IT Support', 'The user reports an inability to open or access a specific website. This issue could stem from various factors including local network connectivity problems, browser configuration errors, firewall restrictions, or the website itself experiencing downtime. Further investigation is required to diagnose the precise root cause.', '[\"Verify the internet connection is active by trying to access other websites.\",\"Attempt to open the website using a different web browser (e.g., Chrome, Firefox, Edge).\",\"Clear browser cache and cookies, then try accessing the website again.\",\"Restart the computer and/or the network router/modem.\",\"If possible, check if other users on the same network are experiencing similar issues with the website.\"]', 'New', NULL, 27, 12, '2026-02-27 17:09:00', '2026-02-26 10:09:06', '2026-02-26 10:09:06'),
(32, 'TK-1772100613559', 'Cannot Open Website', 'IT Support', 'The user reports an inability to open or access a specific website. This issue could stem from various factors including local network connectivity problems, browser configuration errors, firewall restrictions, or the website itself experiencing downtime. Further investigation is required to diagnose the precise root cause.', '[\"Verify the internet connection is active by trying to access other websites.\",\"Attempt to open the website using a different web browser (e.g., Chrome, Firefox, Edge).\",\"Clear browser cache and cookies, then try accessing the website again.\",\"Restart the computer and/or the network router/modem.\",\"If possible, check if other users on the same network are experiencing similar issues with the website.\"]', 'New', NULL, 27, 12, '2026-02-27 17:09:00', '2026-02-26 10:10:13', '2026-02-26 10:10:13'),
(35, 'TK-1772101263574', 'Cannot Open Website', 'IT Support', 'The user reports an inability to open or access a specific website. This issue could stem from various factors including local network connectivity problems, browser configuration errors, firewall restrictions, or the website itself experiencing downtime. Further investigation is required to diagnose the precise root cause.', '[\"Verify the internet connection is active by trying to access other websites.\",\"Attempt to open the website using a different web browser (e.g., Chrome, Firefox, Edge).\",\"Clear browser cache and cookies, then try accessing the website again.\",\"Restart the computer and/or the network router/modem.\",\"If possible, check if other users on the same network are experiencing similar issues with the website.\"]', 'New', NULL, 27, 12, '2026-02-27 10:09:00', '2026-02-26 10:21:03', '2026-02-26 10:21:03'),
(36, 'TK-1772101476291', 'Cannot Logout from Website', 'IT Support', 'The user is reporting an inability to successfully log out from a website. This issue prevents them from ending their active session, potentially posing a privacy or security risk. The root cause could involve browser-related issues (like corrupted cache or cookies), problems with the website\'s session management, or a bug within the website\'s logout functionality itself.', '[\"Clear browser cache and cookies specifically for the website in question.\",\"Attempt to log out from the website using a different web browser (e.g., if currently using Chrome, try Firefox or Edge).\",\"Try logging out while in an incognito or private browsing window.\",\"Restart the web browser completely.\",\"If possible, test logging out from the same website on a different device to determine if the issue is device-specific or related to the user\'s account/website itself.\"]', 'Solved', 'wdw', 36, 12, '2026-02-27 17:24:00', '2026-02-26 10:24:36', '2026-02-26 11:43:58');

-- --------------------------------------------------------

--
-- Table structure for table `tickets_user_mapping`
--

CREATE TABLE `tickets_user_mapping` (
  `id` int NOT NULL,
  `ticket_id` int NOT NULL,
  `user_id` int NOT NULL,
  `request_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tickets_user_mapping`
--

INSERT INTO `tickets_user_mapping` (`id`, `ticket_id`, `user_id`, `request_id`, `created_at`) VALUES
(5, 35, 12, 45, '2026-02-26 10:21:03'),
(6, 35, 17, 46, '2026-02-26 10:21:03'),
(7, 36, 12, 47, '2026-02-26 10:24:36'),
(8, 36, 41, 48, '2026-02-26 10:24:36');

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
(3, 25, 'STATUS_CHANGE', 'New', 'Assigned', 22, '2026-02-20 13:53:56'),
(4, 26, 'STATUS_CHANGE', 'New', 'Failed', 22, '2026-02-23 17:16:35'),
(5, 28, 'STATUS_CHANGE', 'New', 'Solved', 22, '2026-02-23 17:22:04'),
(6, 36, 'STATUS_CHANGE', 'New', 'Assigned', 36, '2026-02-26 11:42:18'),
(7, 36, 'STATUS_CHANGE', 'Assigned', 'Solving', 36, '2026-02-26 11:43:29'),
(8, 36, 'STATUS_CHANGE', 'Solving', 'Solved', 36, '2026-02-26 11:43:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `role` enum('user','assignee','admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT 'user',
  `is_approved` tinyint(1) DEFAULT '1' COMMENT '0=Pending, 1=Approved'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `username`, `email`, `password`, `profile_image`, `created_at`, `role`, `is_approved`) VALUES
(5, 'Watcharathorn Krachangmon', 'watchie', NULL, '$2b$10$1M57XIJGo/yKlL1wA86a1OidTNYZ138g6bASKg9bNCvwFy2LtCRi2', '6287e8e1475892c60a8fb3fd28173102', '2026-01-29 17:06:56', 'admin', 1),
(12, 'watcharathorn krachangmon', 'watcharathorn2549@gmail.com', 'watcharathorn2549@gmail.com', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocL3hyurCaMfLDwPHAf-01qiMpRsZl63__qtY1Ueol-Ci3Y31mg=s96-c', '2026-01-31 10:30:05', 'user', 1),
(16, 'Kittisak Chalongkulwat', 'kenmuay', NULL, '$2b$10$q/tXFg2pIWDT9zAINGYV5OX8p50QBwhKowg/d1Esr5WMH9.V26fzi', 'd609d557c1a0a62e8f020a8c0ecace86', '2026-01-31 15:00:35', 'user', 1),
(17, 'Rick Astley', 'rickroll', NULL, '$2b$10$3zF/J19dONmjAY6CwMs.zONZR/4ePuA4SO.nf0DdvQ1BXuJn5VxXC', 'dd4eaa7dbbae294ecd86166bcf294c97', '2026-02-02 15:44:33', 'user', 1),
(18, 'Tworockpuzzle', 'tworock', NULL, '$2b$10$kolJT7anlg06DOzxb9mYqe5mR13IQJAChdlpLiqXczhbhWw5rxES2', '96021c4ad9076047ea8f657ac066d432', '2026-02-04 09:29:23', 'user', 1),
(20, 'ควยชิบหาย', 'ควย', NULL, '$2b$10$/yPInfm0cQ6jCi2/mG2xBeRlXFNpfGJbT5ckcYckdsYw5hzkqHXaq', '4894750d14c0b613eea2614c46e59ce3', '2026-02-08 19:24:55', 'user', 1),
(22, 'Worawalun', 'palmy', NULL, '$2b$10$bl9xEvO30D.jMY.f/MrgG.fl6l0dMQNCYEEe6HyTmPgS3j3Ube.N6', '56d572a59eb430a0afdeaefbac27a538', '2026-02-09 11:50:20', 'assignee', 1),
(23, 'adminTest', 'admin1', NULL, '$2b$10$o20HDVcoHs8F2mE7wUs8dOG97pLJfS95dIvX.cB/9n0G9HFhBlyGK', 'bf0be8f4468b607dd83f2e01a49326d2', '2026-02-09 13:22:13', 'admin', 1),
(24, 'assigneeTest(network)', 'network', NULL, '$2b$10$Jb04hp6F6pq8anRjHsLMYuHi/Te7E3npMVYmnBw.ujlQx.8YfXSy.', '1771062429427-220163703-140511293_p0_master1200.jpg', '2026-02-14 09:47:09', 'user', 1),
(25, 'assigneeTest(ITSupport)', 'ITsupport', NULL, '$2b$10$x3ff9cfnPUFUjYrbGPFzO.bW0hDPu9L1cgTBpH325H/pXQE73MyEO', '1771236740453-671959002-Screenshot 2026-02-15 211331.png', '2026-02-16 10:12:20', 'assignee', 1),
(26, 'assigneeTest(TeachSupport)', 'TeachSupport', NULL, '$2b$10$mZsm5RYQMBjI7Q8PBM3hLeG2haqYOJjrUXNLKzd6BxyomgdZbnZeu', '1771236816401-398122773-68498.jpg', '2026-02-16 10:13:36', 'assignee', 1),
(27, 'assigneeTest(HRTeam)', 'HRTeam', NULL, '$2b$10$xDE7lBZg5E/Cf2.S4IWlsOoam63wIj6pSO93s/oqSsaVoLXG.FpwC', '1771236856794-140663019-68498.jpg', '2026-02-16 10:14:17', 'assignee', 1),
(28, 'assigneeTest(Account&AccessTeam)', 'AccountTeam', NULL, '$2b$10$l2mkN5lUc4OC51buxs2b1.tQkJKkEtMuICCGW9lPa.oDZ3tB78qq6', '1771236905953-858629775-68328.jpg', '2026-02-16 10:15:06', 'assignee', 1),
(29, 'assigneeTest(Finance&Billing team)', 'FinanceTeam', NULL, '$2b$10$uIWtmZz5Kr6GlEe8846W.uzs4hNpDxE76qU62zz3gr4S95S7N1sIW', '1771236957241-212946747-67792.jpg', '2026-02-16 10:15:57', 'assignee', 1),
(31, 'test2team', '2team', NULL, '$2b$10$2gAubtDEp8P/Gpfl5r/LRuvWbj1Mys/HXOnnXe.lfXfnJpDiGRlc.', '1771349622060-886226581-68497.jpg', '2026-02-17 17:33:42', 'assignee', 1),
(32, 'checkphoto', 'check', NULL, '$2b$10$V6WrweWPpNb5WSRjLl2LO.8Agj4bVxflfbiic06ViHLIHkRYTA2Na', '1771424529073-47857953-68270.jpg', '2026-02-18 14:22:09', 'assignee', 1),
(33, 'เหี้ยไรสัส', 'เหี้ย', NULL, '$2b$10$RbzMwlKrtPc8mdncvqkXVeMf94LeRTcH57CEC6W2Ai.QHrHB17JUi', '7ebb61a3f6e43967b65989efc379c35a.jpg', '2026-02-18 14:46:12', 'user', 1),
(34, 'testapproveassignee', 'approve', NULL, '$2b$10$rVANSyYoDVnKyjWZzjCLMOn9FmBPgln/FhYTEi6Sfm6H9NLgUhVzy', '1771603119444-709374598-69061.jpg', '2026-02-20 15:58:39', 'assignee', 1),
(36, 'assignee', 'ass', NULL, '$2b$10$iOzIRSHmJgXvVaAxkSado.q34WAA1wDCldFfd.T7.MMoUgAtOpE7e', '1771867586551-206890026-69230.jpg', '2026-02-23 17:26:26', 'assignee', 1),
(37, 'keu', 'kuy', NULL, '$2b$10$XSKGNiu77/Sg0iic95VLK.E0ITCZlZSPcl6oZdJ14R9Pdq.dkdJQe', NULL, '2026-02-23 17:29:44', 'user', 1),
(38, '67011380naja', '67011380', '67011380@kmitl.ac.th', '$2b$10$WsdwXOwWOZiahb1vG4rEzOkXMdsXZ9frc/nED2D0qFfVKTlxLtSBq', 'https://lh3.googleusercontent.com/a/ACg8ocIXG3634ZtSeg1dUsJUZ1CKb8UyC6Z9qrCQ5AT_N8g9SZiCPQ=s96-c', '2026-02-24 11:36:12', 'user', 1),
(39, 'Watcharathorn Krachangmon', 'watcharat.kra_g31@mwit.ac.th', 'watcharat.kra_g31@mwit.ac.th', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocIZw_KmyKDE32eOsqMpySBz3zAZbn_EgedYbUqBo61dXnwCXnM=s96-c', '2026-02-24 12:02:42', 'user', 1),
(41, 'dwdwdwdwd dwdwdwdwd', 'dwdwdwdwd dwdwdwdwd', 'gaemefefelmfe@gmail.com', 'OAUTH_USER_NO_PASSWORD', 'https://lh3.googleusercontent.com/a/ACg8ocJDLWpp2ttQKDOKVvbiLqJEXuE0W_LoUdSZ1UkLEzQNLzM4NA=s96-c', '2026-02-24 14:25:15', 'user', 1);

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
(36, 17, 'rickroll', 'i cannot connect to api server', '2026-02-19 12:29:46', 'ticket', 36, NULL, NULL, NULL),
(37, 17, 'rickroll', 'i can not open computer', '2026-02-23 16:39:50', 'received', NULL, NULL, NULL, NULL),
(38, 12, 'watcharathorn2549@gmail.com', 'can not open destop', '2026-02-23 17:11:46', 'ticket', 37, NULL, NULL, NULL),
(39, 12, 'watcharathorn2549@gmail.com', 'my email cant send message', '2026-02-23 17:14:36', 'ticket', 38, NULL, NULL, NULL),
(40, 12, 'watcharathorn2549@gmail.com', 'kuy stupid computer', '2026-02-23 17:18:04', 'ticket', 39, NULL, NULL, NULL),
(41, 17, 'rickroll', 'cant use screen shot', '2026-02-25 12:52:39', 'received', NULL, NULL, NULL, NULL),
(42, 12, 'watcharathorn2549@gmail.com', 'can not use cmd', '2026-02-25 12:54:10', 'draft', 40, NULL, NULL, NULL),
(43, 17, 'null', 'my computer not open', '2026-02-26 09:46:34', 'draft', NULL, NULL, NULL, NULL),
(44, 12, 'watcharathorn2549@gmail.com', 'my computer can not open', '2026-02-26 09:46:55', 'draft', NULL, NULL, NULL, NULL),
(45, 12, 'watcharathorn2549@gmail.com', 'can not open website', '2026-02-26 09:57:16', 'ticket', 43, NULL, NULL, NULL),
(46, 17, 'rickroll', 'website not open', '2026-02-26 09:57:43', 'ticket', 43, NULL, NULL, NULL),
(47, 12, 'watcharathorn2549@gmail.com', 'can not logout from website', '2026-02-26 10:23:24', 'ticket', 45, NULL, NULL, NULL),
(48, 41, 'gaemefefelmfe@gmail.com', 'can not logout', '2026-02-26 10:23:42', 'ticket', 45, NULL, NULL, NULL),
(49, 17, 'rickroll', 'keyboard have a problem', '2026-02-26 11:57:47', 'draft', 47, NULL, NULL, NULL),
(50, 17, 'rickroll', 'dwdwdwdw', '2026-02-26 12:10:52', 'draft', 48, NULL, NULL, NULL),
(51, 17, 'rickroll', 'can ot draw a websie', '2026-02-26 12:11:28', 'draft', 49, NULL, NULL, NULL),
(52, 17, 'rickroll', 'can not open cpmputer', '2026-02-26 12:12:23', 'draft', 50, NULL, NULL, NULL);

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
(22, 4),
(28, 4),
(31, 4),
(34, 4),
(36, 4),
(29, 5),
(32, 5),
(34, 5),
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
-- Indexes for table `tickets_user_mapping`
--
ALTER TABLE `tickets_user_mapping`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_ticket` (`ticket_id`,`user_id`);

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
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `draft_tickets`
--
ALTER TABLE `draft_tickets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `tickets_user_mapping`
--
ALTER TABLE `tickets_user_mapping`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `ticket_history`
--
ALTER TABLE `ticket_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `user_requests`
--
ALTER TABLE `user_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

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