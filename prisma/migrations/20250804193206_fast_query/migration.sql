-- CreateIndex
CREATE INDEX `users_phone_token_status_idx` ON `users`(`phone`, `token`, `status`);
