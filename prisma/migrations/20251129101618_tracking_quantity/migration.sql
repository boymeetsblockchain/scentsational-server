-- AlterTable
ALTER TABLE "public"."Order" ALTER COLUMN "billingFirstName" DROP NOT NULL,
ALTER COLUMN "billingLastName" DROP NOT NULL,
ALTER COLUMN "billingAddressLine1" DROP NOT NULL,
ALTER COLUMN "billingCity" DROP NOT NULL,
ALTER COLUMN "billingState" DROP NOT NULL,
ALTER COLUMN "billingPostalCode" DROP NOT NULL,
ALTER COLUMN "billingCountry" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."ProductVariant" ADD COLUMN     "trackQuantity" BOOLEAN NOT NULL DEFAULT true;
