-- CreateIndex
CREATE INDEX "Post_isPublished_createdAt_idx" ON "Post"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "Message_chatId_createdAt_idx" ON "Message"("chatId", "createdAt");
