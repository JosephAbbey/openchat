/*
  Warnings:

  - Made the column `name` on table `Thread` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Thread` ADD COLUMN `image` VARCHAR(191) NOT NULL DEFAULT '/defaultgroup.png',
    MODIFY `name` VARCHAR(191) NOT NULL;
