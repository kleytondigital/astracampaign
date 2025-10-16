import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Building, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../config/api';
import { Chat } from '../types';

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  onSuccess: () => void;
}

export function EditContactModal({
  isOpen,
  onClose,
  chat,
  onSuccess,
}: EditContactModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
  });
  const [loading, setLoading] = useState(false);
  const [convertToContact, setConvertToContact] = useState(false);

  useEffect(() => {
    if (isOpen && chat) {
      // Preencher formulário com dados existentes
      if (chat.lead) {
        setFormData({
          firstName: chat.lead.firstName || '',
          lastName: chat.lead.lastName || '',
          email: chat.lead.email || '',
          phone: chat.lead.phone || chat.phone,
          company: chat.lead.company || '',
        });
        setConvertToContact(false);
      } else if (chat.contact) {
        setFormData({
          firstName: chat.contact.nome?.split(' ')[0] || '',
          lastName: chat.contact.nome?.split(' ').slice(1).join(' ') || '',
          email: chat.contact.email || '',
          phone: chat.contact.telefone || chat.phone,
          company: '',
        });
        setConvertToContact(false);
      } else {
        // Novo lead/contato
        setFormData({
          firstName: chat.contactName?.split(' ')[0] || '',
          lastName: chat.contactName?.split(' ').slice(1).join(' ') || '',
          email: '',
          phone: chat.phone,
          company: '',
        });
        setConvertToContact(false);
      }
    }
  }, [isOpen, chat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.lastName.trim()) {
      toast.error('Sobrenome é obrigatório');
      return;
    }

    // Validar email se fornecido
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Email inválido');
      return;
    }

    setLoading(true);
    try {
      if (chat.lead) {
        // Atualizar lead existente
        const updateData: any = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || `${chat.phone}@temp.com`,
          phone: formData.phone.trim() || chat.phone,
          company: formData.company.trim() || null,
          source: chat.lead.source,
          status: chat.lead.status,
          score: chat.lead.score,
        };

        console.log('📤 Enviando atualização de lead:', updateData);

        const response = await apiFetch(`/leads/${chat.leadId}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('❌ Erro do backend:', error);
          throw new Error(error.message || error.error || 'Erro ao atualizar lead');
        }

        // Se marcou para converter em contato
        if (convertToContact) {
          const convertResponse = await apiFetch(`/leads/${chat.leadId}/convert`, {
            method: 'POST',
          });

          if (!convertResponse.ok) {
            const error = await convertResponse.json();
            throw new Error(error.message || 'Erro ao converter lead');
          }

          toast.success('Lead atualizado e convertido em contato!');
        } else {
          toast.success('Lead atualizado com sucesso!');
        }
      } else if (chat.contact) {
        // Atualizar contato existente
        const response = await apiFetch(`/contacts/${chat.contactId}`, {
          method: 'PUT',
          body: JSON.stringify({
            nome: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
            email: formData.email.trim() || null,
            telefone: formData.phone.trim(),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erro ao atualizar contato');
        }

        toast.success('Contato atualizado com sucesso!');
      } else {
        // Criar novo lead
        const response = await apiFetch('/leads', {
          method: 'POST',
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim() || `${chat.phone}@temp.com`,
            phone: formData.phone.trim(),
            company: formData.company.trim() || null,
            source: 'WHATSAPP_CAMPAIGN',
            status: 'CONTACTED',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erro ao criar lead');
        }

        const data = await response.json();
        const leadId = data.lead?.id || data.data?.id;

        // Associar lead ao chat
        await apiFetch(`/chats/${chat.id}`, {
          method: 'PUT',
          body: JSON.stringify({ leadId }),
        });

        // Se marcou para converter em contato
        if (convertToContact && leadId) {
          const convertResponse = await apiFetch(`/leads/${leadId}/convert`, {
            method: 'POST',
          });

          if (!convertResponse.ok) {
            const error = await convertResponse.json();
            throw new Error(error.message || 'Erro ao converter lead');
          }

          toast.success('Lead criado e convertido em contato!');
        } else {
          toast.success('Lead criado com sucesso!');
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar informações');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            {chat.contact ? 'Editar Contato' : chat.lead ? 'Editar Lead' : 'Criar Lead'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome"
              required
            />
          </div>

          {/* Sobrenome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sobrenome *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Sobrenome"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="email@exemplo.com"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone *
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+55 11 99999-9999"
              required
            />
          </div>

          {/* Empresa (apenas para leads) */}
          {!chat.contact && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Empresa
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome da empresa"
              />
            </div>
          )}

          {/* Converter para Contato (apenas para leads) */}
          {chat.lead && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="convertToContact"
                checked={convertToContact}
                onChange={(e) => setConvertToContact(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="convertToContact" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <UserPlus className="w-4 h-4" />
                Converter em Contato
              </label>
            </div>
          )}

          {!chat.lead && !chat.contact && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="convertToContactNew"
                checked={convertToContact}
                onChange={(e) => setConvertToContact(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="convertToContactNew" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <UserPlus className="w-4 h-4" />
                Criar como Contato (ao invés de Lead)
              </label>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

