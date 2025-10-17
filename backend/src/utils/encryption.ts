import crypto from 'crypto';

// Garantir que a chave tenha exatamente 32 bytes
const getEncryptionKey = (): Buffer => {
  const keyString = process.env.ENCRYPTION_KEY || 'default-key-for-development-only-32bytes';
  // Se for uma string hex, converter para Buffer
  if (keyString.length === 64 && /^[0-9a-f]+$/i.test(keyString)) {
    return Buffer.from(keyString, 'hex');
  }
  // Caso contrário, usar como string e garantir 32 bytes
  const key = Buffer.from(keyString, 'utf8');
  if (key.length === 32) return key;
  
  // Ajustar para 32 bytes se necessário
  const paddedKey = Buffer.alloc(32);
  key.copy(paddedKey);
  return paddedKey;
};

const ENCRYPTION_KEY = getEncryptionKey();
const ALGORITHM = 'aes-256-gcm';

/**
 * Criptografa um texto usando AES-256-GCM
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combinar IV + authTag + encrypted
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('❌ Erro ao criptografar:', error);
    throw new Error('Falha na criptografia');
  }
}

/**
 * Descriptografa um texto usando AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Formato de texto criptografado inválido');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Erro ao descriptografar:', error);
    throw new Error('Falha na descriptografia');
  }
}

/**
 * Gera uma chave de criptografia segura
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash seguro para senhas e tokens
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
