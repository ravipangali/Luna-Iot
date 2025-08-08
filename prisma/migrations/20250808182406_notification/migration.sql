/*
  Warnings:

  - You are about to drop the column `targetRoles` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `targetUsers` on the `notifications` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `notifications` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Enum(EnumId(6))`.

*/
-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `targetRoles`,
    DROP COLUMN `targetUsers`,
    MODIFY `type` ENUM('all', 'specific') NOT NULL;
