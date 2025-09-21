-- CreateEnum
CREATE TYPE "public"."SermonType" AS ENUM ('SERMON', 'SUNDAY_SCHOOL', 'RETREAT_MESSAGE', 'BAPTISM_CLASS');

-- AlterTable
ALTER TABLE "public"."sermons" ADD COLUMN     "type" "public"."SermonType" NOT NULL DEFAULT 'SERMON';
