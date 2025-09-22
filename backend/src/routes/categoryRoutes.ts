import { Router } from 'express';
import { CategoryService } from '../services/categoryService';
import { CategoryInput } from '../types';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { search, page = '1', pageSize = '10' } = req.query;

    const result = await CategoryService.getCategories(
      search as string,
      parseInt(page as string),
      parseInt(pageSize as string)
    );

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const categories = await CategoryService.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar todas as categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await CategoryService.getCategoryById(id);
    res.json(category);
  } catch (error) {
    if (error instanceof Error && error.message === 'Categoria não encontrada') {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Erro ao buscar categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

router.post('/', async (req, res) => {
  try {
    const categoryData: CategoryInput = req.body;

    if (!categoryData.nome || !categoryData.cor) {
      return res.status(400).json({ error: 'Nome e cor são obrigatórios' });
    }

    const newCategory = await CategoryService.createCategory(categoryData);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData: CategoryInput = req.body;

    if (!categoryData.nome || !categoryData.cor) {
      return res.status(400).json({ error: 'Nome e cor são obrigatórios' });
    }

    const updatedCategory = await CategoryService.updateCategory(id, categoryData);
    res.json(updatedCategory);
  } catch (error) {
    if (error instanceof Error && error.message === 'Categoria não encontrada') {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Erro ao atualizar categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await CategoryService.deleteCategory(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Categoria não encontrada') {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Erro ao deletar categoria:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

export { router as categoryRoutes };