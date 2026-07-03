-- AlterTable: Add new columns to users (with defaults for existing rows)
ALTER TABLE "users" ADD COLUMN "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN "lastName" TEXT;
ALTER TABLE "users" ADD COLUMN "cpf" TEXT;
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "birthDate" TIMESTAMP(3);

-- Migrate existing data: split "name" into firstName/lastName
UPDATE "users" SET
  "firstName" = SPLIT_PART("name", ' ', 1),
  "lastName" = CASE
    WHEN POSITION(' ' IN "name") > 0 THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
    ELSE ''
  END,
  "cpf" = LPAD(CAST("id" AS TEXT), 11, '0'),
  "phone" = '00000000000',
  "birthDate" = '2000-01-01T00:00:00.000Z';

-- Make columns required after migration
ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "cpf" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "birthDate" SET NOT NULL;

-- Drop old name column
ALTER TABLE "users" DROP COLUMN "name";

-- Add unique constraint on cpf
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateTable: addresses
CREATE TABLE "addresses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Casa',
    "street" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "zipCode" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Add shipping fields to orders
ALTER TABLE "orders" ADD COLUMN "shippingStreet" TEXT;
ALTER TABLE "orders" ADD COLUMN "shippingComplement" TEXT;
ALTER TABLE "orders" ADD COLUMN "shippingNeighborhood" TEXT;
ALTER TABLE "orders" ADD COLUMN "shippingCity" TEXT;
ALTER TABLE "orders" ADD COLUMN "shippingState" TEXT;
ALTER TABLE "orders" ADD COLUMN "shippingZipCode" TEXT;
