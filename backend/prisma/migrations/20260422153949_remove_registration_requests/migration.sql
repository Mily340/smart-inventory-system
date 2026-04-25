/*
  Warnings:

  - You are about to drop the `registration_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "registration_requests" DROP CONSTRAINT "registration_requests_branch_id_fkey";

-- DropTable
DROP TABLE "registration_requests";
