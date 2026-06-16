-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PROCESSING';
