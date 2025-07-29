/*
  Warnings:

  - You are about to drop the column `device_id` on the `locations` table. All the data in the column will be lost.
  - You are about to drop the column `device_id` on the `statuses` table. All the data in the column will be lost.
  - You are about to drop the column `device_id` on the `vehicles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `locations` DROP FOREIGN KEY `locations_device_id_fkey`;

-- DropForeignKey
ALTER TABLE `statuses` DROP FOREIGN KEY `statuses_device_id_fkey`;

-- DropForeignKey
ALTER TABLE `vehicles` DROP FOREIGN KEY `vehicles_device_id_fkey`;

-- DropIndex
DROP INDEX `locations_device_id_idx` ON `locations`;

-- DropIndex
DROP INDEX `statuses_device_id_idx` ON `statuses`;

-- DropIndex
DROP INDEX `vehicles_device_id_fkey` ON `vehicles`;

-- AlterTable
ALTER TABLE `locations` DROP COLUMN `device_id`;

-- AlterTable
ALTER TABLE `statuses` DROP COLUMN `device_id`;

-- AlterTable
ALTER TABLE `vehicles` DROP COLUMN `device_id`;

-- CreateIndex
CREATE INDEX `locations_imei_idx` ON `locations`(`imei`);

-- CreateIndex
CREATE INDEX `statuses_imei_idx` ON `statuses`(`imei`);

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_imei_fkey` FOREIGN KEY (`imei`) REFERENCES `devices`(`imei`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_imei_fkey` FOREIGN KEY (`imei`) REFERENCES `devices`(`imei`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statuses` ADD CONSTRAINT `statuses_imei_fkey` FOREIGN KEY (`imei`) REFERENCES `devices`(`imei`) ON DELETE CASCADE ON UPDATE CASCADE;
