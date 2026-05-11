-- CreateTable
CREATE TABLE "SubTheme" (
    "subName" CITEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "linkColor" TEXT,
    "logoId" INTEGER,

    CONSTRAINT "SubTheme_pkey" PRIMARY KEY ("subName")
);

-- CreateIndex
CREATE INDEX "SubTheme_logoId_idx" ON "SubTheme"("logoId");

-- AddForeignKey
ALTER TABLE "SubTheme" ADD CONSTRAINT "SubTheme_subName_fkey" FOREIGN KEY ("subName") REFERENCES "Sub"("name") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTheme" ADD CONSTRAINT "SubTheme_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "DomainSeo" (
    "domainId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "tagline" TEXT,
    "faviconId" INTEGER,

    CONSTRAINT "DomainSeo_pkey" PRIMARY KEY ("domainId")
);

-- CreateIndex
CREATE INDEX "DomainSeo_faviconId_idx" ON "DomainSeo"("faviconId");

-- AddForeignKey
ALTER TABLE "DomainSeo" ADD CONSTRAINT "DomainSeo_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainSeo" ADD CONSTRAINT "DomainSeo_faviconId_fkey" FOREIGN KEY ("faviconId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
