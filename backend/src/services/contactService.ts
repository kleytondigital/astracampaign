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
    pageSize: number = 30,
    tenantId?: string
  ): Promise<ContactsResponse> {
    try {
      console.log('📋 ContactService.getContacts - tenantId:', tenantId);

      // Construir filtros dinâmicos
      const where: any = {};

      // Filtro por tenant (SUPERADMIN vê todos se tenantId for undefined)
      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Filtro de busca
      if (search) {
        const searchLower = search.toLowerCase();
        where.OR = [
          { nome: { contains: searchLower, mode: 'insensitive' } },
          { telefone: { contains: search } },
          { email: { contains: searchLower, mode: 'insensitive' } }
        ];
      }

      // Buscar total de registros
      const total = await prisma.contact.count({ where });

      // Buscar contatos com paginação e incluir categoria
      const skip = (page - 1) * pageSize;
      const contacts = await prisma.contact.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { criadoEm: 'desc' },
        include: {
          categoria: true
        }
      });

      console.log('📋 ContactService.getContacts - total encontrados:', total);

      return {
        contacts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      console.error('❌ ContactService.getContacts - erro:', error);
      throw error;
    }
  }

  static async getContactById(id: string, tenantId?: string) {
    try {
      const where: any = { id };

      // Filtro por tenant (SUPERADMIN pode acessar qualquer contato)
      if (tenantId) {
        where.tenantId = tenantId;
      }

      const contact = await prisma.contact.findFirst({
        where,
        include: {
          categoria: true
        }
      });

      if (!contact) {
        throw new Error('Contato não encontrado');
      }

      return contact;
    } catch (error) {
      console.error('❌ ContactService.getContactById - erro:', error);
      throw error;
    }
  }

  static async createContact(data: ContactInput) {
    try {
      console.log('📝 ContactService.createContact - data recebido:', JSON.stringify(data, null, 2));
      const normalizedPhone = this.normalizePhone(data.telefone);

      const newContact = await prisma.contact.create({
        data: {
          nome: data.nome,
          telefone: normalizedPhone,
          email: data.email || null,
          observacoes: data.observacoes || null,
          tags: data.tags || [],
          categoriaId: data.categoriaId || null,
          tenantId: data.tenantId || null
        },
        include: {
          categoria: true
        }
      });

      console.log('✅ ContactService.createContact - contato criado:', newContact.id);
      return newContact;
    } catch (error) {
      console.error('❌ ContactService.createContact - erro:', error);
      throw error;
    }
  }

  static async updateContact(id: string, data: ContactInput, tenantId?: string) {
    try {
      const normalizedPhone = this.normalizePhone(data.telefone);

      // Construir where clause com tenant isolation
      const where: any = { id };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Verificar se o contato existe e pertence ao tenant
      const existingContact = await prisma.contact.findFirst({ where });
      if (!existingContact) {
        throw new Error('Contato não encontrado');
      }

      const updatedContact = await prisma.contact.update({
        where: { id },
        data: {
          nome: data.nome,
          telefone: normalizedPhone,
          email: data.email || null,
          observacoes: data.observacoes || null,
          tags: data.tags || [],
          categoriaId: data.categoriaId || null
        },
        include: {
          categoria: true
        }
      });

      console.log('✅ ContactService.updateContact - contato atualizado:', id);
      return updatedContact;
    } catch (error) {
      console.error('❌ ContactService.updateContact - erro:', error);
      throw error;
    }
  }

  static async deleteContact(id: string, tenantId?: string) {
    try {
      // Construir where clause com tenant isolation
      const where: any = { id };
      if (tenantId) {
        where.tenantId = tenantId;
      }

      // Verificar se o contato existe e pertence ao tenant
      const existingContact = await prisma.contact.findFirst({ where });
      if (!existingContact) {
        throw new Error('Contato não encontrado');
      }

      await prisma.contact.delete({
        where: { id }
      });

      console.log('✅ ContactService.deleteContact - contato excluído:', id);
    } catch (error) {
      console.error('❌ ContactService.deleteContact - erro:', error);
      throw error;
    }
  }
}