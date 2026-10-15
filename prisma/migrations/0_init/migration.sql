-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `artwork_jobs` (
    `job_id` VARCHAR(36) NOT NULL,
    `job_number` VARCHAR(191) NOT NULL,
    `job_name` TEXT NOT NULL,
    `remarks` TEXT NULL,
    `machine_name` TEXT NULL,
    `is_updated` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `run_order` DOUBLE NULL,
    `is_completed` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `artwork_jobs_job_number_key`(`job_number`),
    PRIMARY KEY (`job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proofing_jobs` (
    `job_id` VARCHAR(36) NOT NULL,
    `job_number` VARCHAR(191) NOT NULL,
    `job_name` TEXT NOT NULL,
    `remarks` TEXT NULL,
    `machine_name` TEXT NULL,
    `is_updated` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `run_order` DOUBLE NULL,
    `is_completed` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `proofing_jobs_job_number_key`(`job_number`),
    PRIMARY KEY (`job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
