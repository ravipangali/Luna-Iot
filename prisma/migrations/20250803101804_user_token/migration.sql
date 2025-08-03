/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `fcm_token` VARCHAR(500) NULL,
    ADD COLUMN `token` VARCHAR(500) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_token_key` ON `users`(`token`);
