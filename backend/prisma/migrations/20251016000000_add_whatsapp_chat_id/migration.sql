-- AlterTable
ALTER TABLE "chats" ADD COLUMN "whatsapp_chat_id" TEXT;

-- CreateIndex (opcional, para busca rápida)
CREATE INDEX "chats_whatsapp_chat_id_idx" ON "chats"("whatsapp_chat_id");

