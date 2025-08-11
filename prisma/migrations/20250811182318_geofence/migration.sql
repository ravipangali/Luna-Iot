-- CreateTable
CREATE TABLE `geofences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `type` ENUM('Entry', 'Exit') NOT NULL,
    `boundary` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `geofence_vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `geofence_id` INTEGER NOT NULL,
    `vehicle_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `geofence_vehicles_geofence_id_vehicle_id_key`(`geofence_id`, `vehicle_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `geofence_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `geofence_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `geofence_users_geofence_id_user_id_key`(`geofence_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `geofence_vehicles` ADD CONSTRAINT `geofence_vehicles_geofence_id_fkey` FOREIGN KEY (`geofence_id`) REFERENCES `geofences`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `geofence_vehicles` ADD CONSTRAINT `geofence_vehicles_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `geofence_users` ADD CONSTRAINT `geofence_users_geofence_id_fkey` FOREIGN KEY (`geofence_id`) REFERENCES `geofences`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `geofence_users` ADD CONSTRAINT `geofence_users_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
