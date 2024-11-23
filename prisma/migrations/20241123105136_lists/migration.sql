/*
  Warnings:

  - You are about to drop the column `bookmarkedById` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `pinnedById` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `readLaterById` on the `Item` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ListType" AS ENUM ('PINNED_POSTS', 'BOOKMARKS', 'READ_LATER', 'GENERIC');

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_bookmarkedById_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_pinnedById_fkey";

-- DropForeignKey
ALTER TABLE "Item" DROP CONSTRAINT "Item_readLaterById_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "bookmarkedById",
DROP COLUMN "pinnedById",
DROP COLUMN "readLaterById";

-- CreateTable
CREATE TABLE "List" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ListType" NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListItem" (
    "id" SERIAL NOT NULL,
    "listId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "ListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteList" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "listId" INTEGER NOT NULL,

    CONSTRAINT "FavoriteList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "List_userId_idx" ON "List"("userId");

-- CreateIndex
CREATE INDEX "ListItem_listId_idx" ON "ListItem"("listId");

-- CreateIndex
CREATE INDEX "ListItem_itemId_idx" ON "ListItem"("itemId");

-- CreateIndex
CREATE INDEX "FavoriteList_userId_idx" ON "FavoriteList"("userId");

-- CreateIndex
CREATE INDEX "FavoriteList_listId_idx" ON "FavoriteList"("listId");

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteList" ADD CONSTRAINT "FavoriteList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteList" ADD CONSTRAINT "FavoriteList_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;
