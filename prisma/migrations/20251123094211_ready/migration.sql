-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EMAIL_VERIFIED', 'PHONE_VERIFIED');

-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFY', 'PHONE_VERIFY');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('PERFUME', 'BODY_SPRAY', 'CANDLE', 'DIFFUSER', 'ROOM_SPRAY', 'GIFT_SET', 'SAMPLE');

-- CreateEnum
CREATE TYPE "public"."ConcentrationLevel" AS ENUM ('EAU_FRAICHE', 'EAU_DE_COLOGNE', 'EAU_DE_TOILETTE', 'EAU_DE_PARFUM', 'PARFUM', 'EXTRAIT');

-- CreateEnum
CREATE TYPE "public"."Season" AS ENUM ('SPRING', 'SUMMER', 'FALL', 'WINTER', 'ALL_SEASON');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MENS', 'WOMENS', 'UNISEX');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'COD', 'WALLET');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "firstName" VARCHAR(40),
    "lastName" VARCHAR(40),
    "middleName" VARCHAR(40),
    "displayName" VARCHAR(100),
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneCountryCode" VARCHAR(5) NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL,
    "type" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatar" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" VARCHAR(20),
    "acceptsMarketing" BOOLEAN NOT NULL DEFAULT false,
    "newsletterSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "passwordUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserToken" (
    "id" UUID NOT NULL,
    "type" "public"."TokenType" NOT NULL,
    "token" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RefreshTokenBlacklist" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshTokenBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(250) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "comparePrice" DECIMAL(10,2),
    "costPrice" DECIMAL(10,2),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "trackQuantity" BOOLEAN NOT NULL DEFAULT true,
    "allowBackorder" BOOLEAN NOT NULL DEFAULT false,
    "lowStockAlert" INTEGER NOT NULL DEFAULT 5,
    "type" "public"."ProductType" NOT NULL,
    "concentration" "public"."ConcentrationLevel",
    "gender" "public"."Gender" NOT NULL,
    "season" "public"."Season"[],
    "topNotes" TEXT[],
    "middleNotes" TEXT[],
    "baseNotes" TEXT[],
    "volume" INTEGER,
    "weight" DECIMAL(8,2),
    "ingredients" TEXT,
    "howToUse" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[],
    "metaTitle" VARCHAR(200),
    "metaDescription" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductImage" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "altText" VARCHAR(200),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "parentId" UUID,
    "metaTitle" VARCHAR(200),
    "metaDescription" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductCategory" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sku" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "comparePrice" DECIMAL(10,2),
    "costPrice" DECIMAL(10,2),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "weight" DECIMAL(8,2),
    "volume" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryLog" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "type" VARCHAR(20) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "reason" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "title" VARCHAR(200),
    "comment" TEXT,
    "longevity" SMALLINT,
    "sillage" SMALLINT,
    "projection" SMALLINT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WishlistItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cart" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CartItem" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" UUID NOT NULL,
    "orderNumber" VARCHAR(50) NOT NULL,
    "userId" UUID NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shippingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerFirstName" TEXT NOT NULL,
    "customerLastName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "shippingAddressId" UUID,
    "billingAddressId" UUID,
    "shippingFirstName" TEXT NOT NULL,
    "shippingLastName" TEXT NOT NULL,
    "shippingCompany" TEXT,
    "shippingAddressLine1" TEXT NOT NULL,
    "shippingAddressLine2" TEXT,
    "shippingCity" TEXT NOT NULL,
    "shippingState" TEXT NOT NULL,
    "shippingPostalCode" TEXT NOT NULL,
    "shippingCountry" TEXT NOT NULL,
    "shippingPhone" TEXT,
    "billingFirstName" TEXT NOT NULL,
    "billingLastName" TEXT NOT NULL,
    "billingCompany" TEXT,
    "billingAddressLine1" TEXT NOT NULL,
    "billingAddressLine2" TEXT,
    "billingCity" TEXT NOT NULL,
    "billingState" TEXT NOT NULL,
    "billingPostalCode" TEXT NOT NULL,
    "billingCountry" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "transactionId" TEXT,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "discountId" UUID,
    "discountCode" VARCHAR(50),
    "customerNote" TEXT,
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "variantId" UUID,
    "productName" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "variantName" TEXT,
    "productImage" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "comparePrice" DECIMAL(10,2),
    "quantity" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "paymentIntentId" TEXT,
    "transactionId" TEXT,
    "processor" VARCHAR(50),
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "company" VARCHAR(100),
    "addressLine1" VARCHAR(200) NOT NULL,
    "addressLine2" VARCHAR(200),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "country" VARCHAR(2) NOT NULL,
    "phone" VARCHAR(20),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "type" VARCHAR(20) NOT NULL DEFAULT 'BOTH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShippingZone" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "countries" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShippingRate" (
    "id" UUID NOT NULL,
    "shippingZoneId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "minOrderAmount" DECIMAL(10,2),
    "maxOrderAmount" DECIMAL(10,2),
    "estimatedDays" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Discount" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "type" "public"."DiscountType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "minOrderAmount" DECIMAL(10,2),
    "maxDiscountAmount" DECIMAL(10,2),
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appliesToAllProducts" BOOLEAN NOT NULL DEFAULT true,
    "productIds" TEXT[],
    "categoryIds" TEXT[],
    "oncePerCustomer" BOOLEAN NOT NULL DEFAULT false,
    "customerIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DiscountUsage" (
    "id" UUID NOT NULL,
    "discountId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID,
    "orderId" UUID,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "public"."User"("phoneNumber");

-- CreateIndex
CREATE INDEX "user_phone_idx" ON "public"."User"("phoneCountryCode", "phoneNumber");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "public"."User"("status");

-- CreateIndex
CREATE INDEX "user_created_at_idx" ON "public"."User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserToken_token_key" ON "public"."UserToken"("token");

-- CreateIndex
CREATE INDEX "idx_user_token" ON "public"."UserToken"("type", "userId");

-- CreateIndex
CREATE INDEX "idx_token" ON "public"."UserToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokenBlacklist_reference_key" ON "public"."RefreshTokenBlacklist"("reference");

-- CreateIndex
CREATE INDEX "idx_blacklist_expires" ON "public"."RefreshTokenBlacklist"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "public"."Product"("slug");

-- CreateIndex
CREATE INDEX "idx_product_sku" ON "public"."Product"("sku");

-- CreateIndex
CREATE INDEX "idx_product_slug" ON "public"."Product"("slug");

-- CreateIndex
CREATE INDEX "idx_product_status" ON "public"."Product"("status");

-- CreateIndex
CREATE INDEX "idx_product_type" ON "public"."Product"("type");

-- CreateIndex
CREATE INDEX "idx_product_gender" ON "public"."Product"("gender");

-- CreateIndex
CREATE INDEX "idx_product_featured" ON "public"."Product"("featured");

-- CreateIndex
CREATE INDEX "idx_product_created" ON "public"."Product"("createdAt");

-- CreateIndex
CREATE INDEX "idx_product_price" ON "public"."Product"("price");

-- CreateIndex
CREATE INDEX "idx_image_product" ON "public"."ProductImage"("productId");

-- CreateIndex
CREATE INDEX "idx_image_sort" ON "public"."ProductImage"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE INDEX "idx_category_slug" ON "public"."Category"("slug");

-- CreateIndex
CREATE INDEX "idx_category_parent" ON "public"."Category"("parentId");

-- CreateIndex
CREATE INDEX "idx_category_sort" ON "public"."Category"("sortOrder");

-- CreateIndex
CREATE INDEX "idx_category_active" ON "public"."Category"("isActive");

-- CreateIndex
CREATE INDEX "idx_prodcat_product" ON "public"."ProductCategory"("productId");

-- CreateIndex
CREATE INDEX "idx_prodcat_category" ON "public"."ProductCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_productId_categoryId_key" ON "public"."ProductCategory"("productId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "public"."ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "idx_variant_product" ON "public"."ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "idx_variant_sku" ON "public"."ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "idx_variant_active" ON "public"."ProductVariant"("isActive");

-- CreateIndex
CREATE INDEX "idx_invlog_product" ON "public"."InventoryLog"("productId");

-- CreateIndex
CREATE INDEX "idx_invlog_variant" ON "public"."InventoryLog"("variantId");

-- CreateIndex
CREATE INDEX "idx_invlog_created" ON "public"."InventoryLog"("createdAt");

-- CreateIndex
CREATE INDEX "idx_invlog_type" ON "public"."InventoryLog"("type");

-- CreateIndex
CREATE INDEX "idx_review_product" ON "public"."Review"("productId");

-- CreateIndex
CREATE INDEX "idx_review_user" ON "public"."Review"("userId");

-- CreateIndex
CREATE INDEX "idx_review_rating" ON "public"."Review"("rating");

-- CreateIndex
CREATE INDEX "idx_review_created" ON "public"."Review"("createdAt");

-- CreateIndex
CREATE INDEX "idx_review_status" ON "public"."Review"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "public"."Review"("productId", "userId");

-- CreateIndex
CREATE INDEX "idx_wishlist_user" ON "public"."WishlistItem"("userId");

-- CreateIndex
CREATE INDEX "idx_wishlist_product" ON "public"."WishlistItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "public"."WishlistItem"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "public"."Cart"("userId");

-- CreateIndex
CREATE INDEX "idx_cart_user" ON "public"."Cart"("userId");

-- CreateIndex
CREATE INDEX "idx_cartitem_cart" ON "public"."CartItem"("cartId");

-- CreateIndex
CREATE INDEX "idx_cartitem_product" ON "public"."CartItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantId_key" ON "public"."CartItem"("cartId", "productId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "public"."Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentIntentId_key" ON "public"."Order"("paymentIntentId");

-- CreateIndex
CREATE INDEX "idx_order_user" ON "public"."Order"("userId");

-- CreateIndex
CREATE INDEX "idx_order_number" ON "public"."Order"("orderNumber");

-- CreateIndex
CREATE INDEX "idx_order_status" ON "public"."Order"("status");

-- CreateIndex
CREATE INDEX "idx_order_payment_status" ON "public"."Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "idx_order_created" ON "public"."Order"("createdAt");

-- CreateIndex
CREATE INDEX "idx_orderitem_order" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "idx_orderitem_product" ON "public"."OrderItem"("productId");

-- CreateIndex
CREATE INDEX "idx_payment_order" ON "public"."Payment"("orderId");

-- CreateIndex
CREATE INDEX "idx_payment_intent" ON "public"."Payment"("paymentIntentId");

-- CreateIndex
CREATE INDEX "idx_payment_transaction" ON "public"."Payment"("transactionId");

-- CreateIndex
CREATE INDEX "idx_payment_created" ON "public"."Payment"("createdAt");

-- CreateIndex
CREATE INDEX "idx_address_user" ON "public"."Address"("userId");

-- CreateIndex
CREATE INDEX "idx_address_default" ON "public"."Address"("isDefault");

-- CreateIndex
CREATE INDEX "idx_shipzone_active" ON "public"."ShippingZone"("isActive");

-- CreateIndex
CREATE INDEX "idx_shiprate_zone" ON "public"."ShippingRate"("shippingZoneId");

-- CreateIndex
CREATE INDEX "idx_shiprate_active" ON "public"."ShippingRate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "public"."Discount"("code");

-- CreateIndex
CREATE INDEX "idx_discount_code" ON "public"."Discount"("code");

-- CreateIndex
CREATE INDEX "idx_discount_active" ON "public"."Discount"("isActive");

-- CreateIndex
CREATE INDEX "idx_discount_expires" ON "public"."Discount"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_usage_discount" ON "public"."DiscountUsage"("discountId");

-- CreateIndex
CREATE INDEX "idx_usage_user" ON "public"."DiscountUsage"("userId");

-- CreateIndex
CREATE INDEX "idx_usage_date" ON "public"."DiscountUsage"("usedAt");

-- AddForeignKey
ALTER TABLE "public"."UserToken" ADD CONSTRAINT "UserToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryLog" ADD CONSTRAINT "InventoryLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryLog" ADD CONSTRAINT "InventoryLog_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryLog" ADD CONSTRAINT "InventoryLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "public"."Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "public"."Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "public"."Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShippingRate" ADD CONSTRAINT "ShippingRate_shippingZoneId_fkey" FOREIGN KEY ("shippingZoneId") REFERENCES "public"."ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscountUsage" ADD CONSTRAINT "DiscountUsage_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "public"."Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DiscountUsage" ADD CONSTRAINT "DiscountUsage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
