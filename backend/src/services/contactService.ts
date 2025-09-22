import { PrismaClient } from '@prisma/client';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { ContactInput, ContactsResponse } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { CategoryService } from './categoryService';

const prisma = new PrismaClient();

const DATA_FILE = '/app/data/contacts.json';

const defaultContacts: any[] = [];

function loadContacts(): any[] {
  try {
    // Ensure directory exists
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('📁 ContactService.loadContacts - diretório criado:', dir);
    }

    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data, (key, value) => {
        if (key === 'criadoEm' || key === 'atualizadoEm') {
          return new Date(value);
        }
        return value;
      });
      console.log(`📂 ContactService.loadContacts - carregou ${parsed.length} contatos do arquivo`);
      return parsed;
    } else {
      console.log('📂 ContactService.loadContacts - arquivo não existe, iniciando com contatos padrão');
      // Initialize with default contacts when file doesn't exist
      saveContacts(defaultContacts);
      return [...defaultContacts];
    }
  } catch (error) {
    console.error('❌ ContactService.loadContacts - erro ao carregar:', error);
    // In case of error, initialize with default contacts
    console.log('📂 ContactService.loadContacts - erro encontrado, iniciando com contatos padrão');
    try {
      saveContacts(defaultContacts);
      return [...defaultContacts];
    } catch (saveError) {
      console.error('❌ ContactService.loadContacts - erro ao salvar contatos padrão:', saveError);
      return [...defaultContacts];
    }
  }
}

function saveContacts(contacts: any[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(contacts, null, 2));
  } catch (error) {
    console.error('Erro ao salvar contatos:', error);
  }
}

// Removido cache em memória - sempre ler do arquivo para consistência entre instâncias

async function enrichContactsWithCategories(contactsList: any[]): Promise<any[]> {
  try {
    const categories = await CategoryService.getAllCategories();
    return contactsList.map(contact => {
      if (contact.categoriaId) {
        const categoria = categories.find(cat => cat.id === contact.categoriaId);
        return { ...contact, categoria };
      }
      return { ...contact, categoria: null };
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return contactsList.map(contact => ({ ...contact, categoria: null }));
  }
}

export class ContactService {
  static normalizePhone(phone: string): string {
    const phoneNumber = parsePhoneNumberFromString(phone, 'BR');
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error('Número de telefone inválido');
    }
    return phoneNumber.format('E.164');
  }

  static async getContacts(
    search?: string,
    page: number = 1,
    pageSize: number = 30
  ): Promise<ContactsResponse> {
    // Sempre ler do arquivo para garantir consistência entre instâncias
    const contacts = loadContacts();
    console.log('📋 ContactService.getContacts - total contatos carregados do arquivo:', contacts.length);
    console.log('📋 ContactService.getContacts - primeiros IDs:', contacts.slice(0, 3).map(c => c.id));
    let filteredContacts = [...contacts];

    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      filteredContacts = filteredContacts.filter(contact =>
        contact.nome.toLowerCase().includes(searchLower) ||
        contact.telefone.includes(search) ||
        (contact.email && contact.email.toLowerCase().includes(searchLower))
      );
    }


    // Paginação
    const total = filteredContacts.length;
    const skip = (page - 1) * pageSize;
    const paginatedContacts = filteredContacts.slice(skip, skip + pageSize);

    // Enriquecer com dados de categoria
    const enrichedContacts = await enrichContactsWithCategories(paginatedContacts);

    return {
      contacts: enrichedContacts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  static async getContactById(id: string) {
    // Carregar contatos atuais do arquivo
    const contacts = loadContacts();
    const contact = contacts.find(c => c.id === id);

    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    // Enriquecer com dados de categoria
    const enrichedContacts = await enrichContactsWithCategories([contact]);
    return enrichedContacts[0];
  }

  static async createContact(data: ContactInput) {
    console.log('📝 ContactService.createContact - data recebido:', JSON.stringify(data, null, 2));
    const normalizedPhone = this.normalizePhone(data.telefone);

    const newContact = {
      id: Math.random().toString(36).substr(2, 9),
      nome: data.nome,
      telefone: normalizedPhone,
      email: data.email || null,
      observacoes: data.observacoes || null,
      categoriaId: data.categoriaId || null,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };

    console.log('💾 ContactService.createContact - contato criado:', JSON.stringify(newContact, null, 2));

    // Carregar contatos atuais do arquivo
    const currentContacts = loadContacts();
    currentContacts.unshift(newContact); // Adiciona no início da lista
    saveContacts(currentContacts);
    console.log('✅ ContactService.createContact - contato salvo no arquivo');

    // Retornar com dados de categoria
    const enrichedContacts = await enrichContactsWithCategories([newContact]);
    return enrichedContacts[0];
  }

  static async updateContact(id: string, data: ContactInput) {
    const normalizedPhone = this.normalizePhone(data.telefone);

    // Carregar contatos atuais do arquivo
    const contacts = loadContacts();
    const contactIndex = contacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      throw new Error('Contato não encontrado');
    }

    const updatedContact = {
      ...contacts[contactIndex],
      nome: data.nome,
      telefone: normalizedPhone,
      email: data.email || null,
      observacoes: data.observacoes || null,
      categoriaId: data.categoriaId || null,
      atualizadoEm: new Date()
    };

    contacts[contactIndex] = updatedContact;
    saveContacts(contacts);

    // Retornar com dados de categoria
    const enrichedContacts = await enrichContactsWithCategories([updatedContact]);
    return enrichedContacts[0];
  }

  static async deleteContact(id: string) {
    // Carregar contatos atuais do arquivo
    const contacts = loadContacts();
    const contactIndex = contacts.findIndex(c => c.id === id);

    if (contactIndex === -1) {
      throw new Error('Contato não encontrado');
    }

    contacts.splice(contactIndex, 1);
    saveContacts(contacts);
  }
}