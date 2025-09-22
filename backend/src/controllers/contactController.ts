import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ContactService } from '../services/contactService';
import { ApiError } from '../types';

export class ContactController {
  static async getContacts(req: Request, res: Response) {
    try {
      const { search, page = '1', pageSize = '30' } = req.query;

      const result = await ContactService.getContacts(
        search as string,
        parseInt(page as string),
        parseInt(pageSize as string)
      );

      res.json(result);
    } catch (error) {
      const apiError: ApiError = {
        error: 'Erro ao buscar contatos',
        details: error instanceof Error ? error.message : error
      };
      res.status(500).json(apiError);
    }
  }

  static async getContactById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const contact = await ContactService.getContactById(id);
      res.json(contact);
    } catch (error) {
      const apiError: ApiError = {
        error: 'Contato não encontrado',
        details: error instanceof Error ? error.message : error
      };
      res.status(404).json(apiError);
    }
  }

  static async createContact(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const apiError: ApiError = {
          error: 'Dados inválidos',
          details: errors.array()
        };
        return res.status(400).json(apiError);
      }

      const contact = await ContactService.createContact(req.body);
      res.status(201).json(contact);
    } catch (error) {
      const apiError: ApiError = {
        error: 'Erro ao criar contato',
        details: error instanceof Error ? error.message : error
      };
      res.status(400).json(apiError);
    }
  }

  static async updateContact(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const apiError: ApiError = {
          error: 'Dados inválidos',
          details: errors.array()
        };
        return res.status(400).json(apiError);
      }

      const { id } = req.params;
      const contact = await ContactService.updateContact(id, req.body);
      res.json(contact);
    } catch (error) {
      const apiError: ApiError = {
        error: 'Erro ao atualizar contato',
        details: error instanceof Error ? error.message : error
      };
      res.status(400).json(apiError);
    }
  }

  static async deleteContact(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await ContactService.deleteContact(id);
      res.status(204).send();
    } catch (error) {
      const apiError: ApiError = {
        error: 'Erro ao excluir contato',
        details: error instanceof Error ? error.message : error
      };
      res.status(400).json(apiError);
    }
  }
}