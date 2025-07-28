-- DropForeignKey
ALTER TABLE `locations` DROP FOREIGN KEY `locations_device_id_fkey`;

-- DropForeignKey
ALTER TABLE `statuses` DROP FOREIGN KEY `statuses_device_id_fkey`;

-- DropForeignKey
ALTER TABLE `vehicles` DROP FOREIGN KEY `vehicles_device_id_fkey`;

-- DropIndex
DROP INDEX `vehicles_device_id_fkey` ON `vehicles`;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statuses` ADD CONSTRAINT `statuses_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
