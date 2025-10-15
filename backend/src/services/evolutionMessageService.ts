import { settingsService } from './settingsService';

function normalizeBrazilianPhone(phone: string | number): string {
  if (!phone || phone === null || phone === undefined) {
    console.log(`📱 Número brasileiro Evolution inválido: ${phone}`);
    return '';
  }
  const phoneStr = String(phone);
  let cleanPhone = phoneStr.replace(/\D/g, '');
  console.log(`📱 Número brasileiro Evolution: ${phone} -> ${cleanPhone}`);
  return cleanPhone;
}

interface EvolutionMessage {
  text?: string;
  image?: { url: string };
  video?: { url: string };
  audio?: { url: string };
  document?: { url: string };
  fileName?: string;
  caption?: string;
}

export async function sendMessageViaEvolution(
  instanceName: string,
  phone: string | number,
  message: EvolutionMessage
) {
  try {
    const config = await settingsService.getEvolutionConfig();

    if (!config.host || !config.apiKey) {
      throw new Error(
        'Configurações Evolution API não encontradas. Configure nas configurações do sistema.'
      );
    }

    const normalizedPhone = normalizeBrazilianPhone(phone);
    let endpoint = '';
    let requestBody: any = {
      number: normalizedPhone
    };

    if (message.text) {
      endpoint = `/message/sendText/${instanceName}`;
      requestBody.text = message.text;
    } else if (message.image) {
      endpoint = `/message/sendMedia/${instanceName}`;

      // Converter URL local para Base64
      let mediaContent = message.image.url;

      // Se for URL local (localhost), converter para Base64
      if (
        message.image.url.includes('localhost') ||
        message.image.url.startsWith('http://192.168.') ||
        message.image.url.startsWith('http://10.')
      ) {
        console.log(
          `🔄 [Evolution] Convertendo imagem local para Base64: ${message.image.url}`
        );
        try {
          const imageResponse = await fetch(message.image.url);
          const arrayBuffer = await imageResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          mediaContent = base64; // ✅ Evolution aceita Base64 puro (sem prefixo data:)
          console.log(
            `✅ [Evolution] Imagem convertida para Base64 (${base64.length} chars)`
          );
        } catch (error) {
          console.error(
            `❌ [Evolution] Erro ao converter imagem para Base64:`,
            error
          );
          throw new Error('Erro ao processar imagem local');
        }
      }

      requestBody = {
        number: normalizedPhone,
        mediatype: 'image',
        mimetype: 'image/png',
        caption: message.caption || '',
        media: mediaContent,
        fileName: 'imagem.png'
      };
    } else if (message.video) {
      // ✅ Usar endpoint correto para vídeos (sendPtv)
      endpoint = `/message/sendPtv/${instanceName}`;

      // Converter URL local para Base64
      let videoContent = message.video.url;

      if (
        message.video.url.includes('localhost') ||
        message.video.url.startsWith('http://192.168.') ||
        message.video.url.startsWith('http://10.')
      ) {
        console.log(
          `🔄 [Evolution] Convertendo vídeo local para Base64: ${message.video.url}`
        );
        try {
          const videoResponse = await fetch(message.video.url);
          const arrayBuffer = await videoResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          videoContent = base64; // ✅ Evolution aceita Base64 puro (sem prefixo data:)
          console.log(
            `✅ [Evolution] Vídeo convertido para Base64 (${base64.length} chars)`
          );
        } catch (error) {
          console.error(
            `❌ [Evolution] Erro ao converter vídeo para Base64:`,
            error
          );
          throw new Error('Erro ao processar vídeo local');
        }
      }

      // ✅ Formato correto para sendPtv
      requestBody = {
        number: normalizedPhone,
        video: videoContent, // URL ou Base64
        delay: 1200
      };
    } else if (message.audio) {
      endpoint = `/message/sendMedia/${instanceName}`;

      // Converter URL local para Base64
      let mediaContent = message.audio.url;

      if (
        message.audio.url.includes('localhost') ||
        message.audio.url.startsWith('http://192.168.') ||
        message.audio.url.startsWith('http://10.')
      ) {
        console.log(
          `🔄 [Evolution] Convertendo áudio local para Base64: ${message.audio.url}`
        );
        try {
          const audioResponse = await fetch(message.audio.url);
          const arrayBuffer = await audioResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          mediaContent = base64; // ✅ Evolution aceita Base64 puro (sem prefixo data:)
          console.log(
            `✅ [Evolution] Áudio convertido para Base64 (${base64.length} chars)`
          );
        } catch (error) {
          console.error(
            `❌ [Evolution] Erro ao converter áudio para Base64:`,
            error
          );
          throw new Error('Erro ao processar áudio local');
        }
      }

      requestBody = {
        number: normalizedPhone,
        mediatype: 'audio',
        mimetype: 'audio/ogg',
        media: mediaContent,
        fileName: 'audio.ogg'
      };
    } else if (message.document) {
      endpoint = `/message/sendMedia/${instanceName}`;

      // Converter URL local para Base64
      let mediaContent = message.document.url;

      if (
        message.document.url.includes('localhost') ||
        message.document.url.startsWith('http://192.168.') ||
        message.document.url.startsWith('http://10.')
      ) {
        console.log(
          `🔄 [Evolution] Convertendo documento local para Base64: ${message.document.url}`
        );
        try {
          const docResponse = await fetch(message.document.url);
          const arrayBuffer = await docResponse.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          mediaContent = base64; // ✅ Evolution aceita Base64 puro (sem prefixo data:)
          console.log(
            `✅ [Evolution] Documento convertido para Base64 (${base64.length} chars)`
          );
        } catch (error) {
          console.error(
            `❌ [Evolution] Erro ao converter documento para Base64:`,
            error
          );
          throw new Error('Erro ao processar documento local');
        }
      }

      requestBody = {
        number: normalizedPhone,
        mediatype: 'document',
        mimetype: 'application/pdf',
        caption: message.caption || '',
        media: mediaContent,
        fileName: message.fileName || 'documento.pdf'
      };
    } else {
      throw new Error('Tipo de mensagem não suportado');
    }

    const url = `${config.host}${endpoint}`;
    console.log(`Evolution API - Enviando para: ${url}`);
    console.log(
      `Evolution API - Request body:`,
      JSON.stringify(requestBody, null, 2)
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.apiKey
      },
      body: JSON.stringify(requestBody)
    });

    console.log(
      `Evolution API - Response status: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const responseText = await response.text();
      console.log(`Evolution API - Error response:`, responseText);
      throw new Error(
        `Evolution API error: ${response.status} ${response.statusText} - ${responseText}`
      );
    }

    const result = await response.json();
    console.log(`Evolution API - Success response:`, result);
    return result;
  } catch (error) {
    console.error('Error sending message via Evolution:', error);
    throw error;
  }
}

export async function checkContactExistsEvolution(
  instanceName: string,
  phone: string | number
): Promise<{ exists: boolean; validPhone?: string }> {
  try {
    const config = await settingsService.getEvolutionConfig();

    if (!config.host || !config.apiKey) {
      throw new Error('Configurações Evolution API não encontradas.');
    }

    const normalizedPhone = normalizeBrazilianPhone(phone);

    console.log(
      `🔍 Evolution - Verificando se contato existe: ${phone} -> ${normalizedPhone}`
    );

    const url = `${config.host}/chat/whatsappNumbers/${instanceName}`;
    const requestBody = {
      numbers: [normalizedPhone]
    };

    console.log(`Evolution API - Checking contact: ${url}`);
    console.log(
      `Evolution API - Request body:`,
      JSON.stringify(requestBody, null, 2)
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.log(
        `❌ Evolution - Erro ao verificar contato ${normalizedPhone}: ${response.status} ${response.statusText}`
      );
      return { exists: false };
    }

    const result = await response.json();
    console.log(`Evolution API - Check contact response:`, result);

    // A Evolution API retorna um array com os números válidos
    const validNumbers = Array.isArray(result) ? result : [];
    const exists = validNumbers.length > 0;
    const validPhoneData = exists ? validNumbers[0] : undefined;

    console.log(
      `${exists ? '✅' : '❌'} Evolution - Contato ${normalizedPhone} existe: ${exists}`
    );

    if (exists && validPhoneData) {
      // Extrair o número do objeto retornado pela Evolution API
      const validPhone = validPhoneData.number || normalizedPhone;
      console.log(`📱 Evolution - Usando número válido: ${validPhone}`);
      return { exists: true, validPhone };
    }

    return { exists: false };
  } catch (error) {
    console.error(
      `❌ Evolution - Erro ao verificar existência do contato ${phone}:`,
      error
    );
    return { exists: false };
  }
}
