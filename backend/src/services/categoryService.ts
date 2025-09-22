import { CategoryInput, CategoriesResponse } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const CATEGORIES_FILE = '/app/data/categories.json';

const defaultCategories: any[] = [];

function loadCategories(): any[] {
  try {
    const dir = path.dirname(CATEGORIES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
      return JSON.parse(data, (key, value) => {
        if (key === 'criadoEm' || key === 'atualizadoEm') {
          return new Date(value);
        }
        return value;
      });
    }
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
  return [...defaultCategories];
}

function saveCategories(categories: any[]): void {
  try {
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error('Erro ao salvar categorias:', error);
  }
}

export class CategoryService {
  static async getCategories(
    search?: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<CategoriesResponse> {
    const categories = loadCategories();
    let filteredCategories = [...categories];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredCategories = filteredCategories.filter(category =>
        category.nome.toLowerCase().includes(searchLower) ||
        (category.descricao && category.descricao.toLowerCase().includes(searchLower))
      );
    }

    const total = filteredCategories.length;
    const skip = (page - 1) * pageSize;
    const paginatedCategories = filteredCategories.slice(skip, skip + pageSize);

    return {
      categories: paginatedCategories,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  static async getCategoryById(id: string) {
    const categories = loadCategories();
    const category = categories.find(c => c.id === id);

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    return category;
  }

  static async createCategory(data: CategoryInput) {
    const categories = loadCategories();
    const newCategory = {
      id: Math.random().toString(36).substr(2, 9),
      nome: data.nome,
      cor: data.cor,
      descricao: data.descricao || null,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };

    categories.unshift(newCategory);
    saveCategories(categories);
    return newCategory;
  }

  static async updateCategory(id: string, data: CategoryInput) {
    const categories = loadCategories();
    const categoryIndex = categories.findIndex(c => c.id === id);

    if (categoryIndex === -1) {
      throw new Error('Categoria não encontrada');
    }

    const updatedCategory = {
      ...categories[categoryIndex],
      nome: data.nome,
      cor: data.cor,
      descricao: data.descricao || null,
      atualizadoEm: new Date()
    };

    categories[categoryIndex] = updatedCategory;
    saveCategories(categories);
    return updatedCategory;
  }

  static async deleteCategory(id: string) {
    const categories = loadCategories();
    const categoryIndex = categories.findIndex(c => c.id === id);

    if (categoryIndex === -1) {
      throw new Error('Categoria não encontrada');
    }

    categories.splice(categoryIndex, 1);
    saveCategories(categories);
  }

  static async getAllCategories() {
    return loadCategories();
  }
}