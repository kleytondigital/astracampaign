import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Users as UsersIcon, Star, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../config/api';

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  isDefault?: boolean;
  addedAt?: string;
  _count?: {
    assignedChats: number;
    chatAssignments: number;
  };
}

interface ManageUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
  onSuccess: () => void;
}

export function ManageUsersModal({
  isOpen,
  onClose,
  departmentId,
  departmentName,
  onSuccess,
}: ManageUsersModalProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'available'>('current');
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentUsers();
      loadAvailableUsers();
    }
  }, [isOpen, departmentId]);

  const loadCurrentUsers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/departments/${departmentId}/users`);
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      const data = await response.json();
      setCurrentUsers(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários do departamento');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await apiFetch(`/departments/${departmentId}/available-users`);
      if (!response.ok) throw new Error('Erro ao carregar usuários disponíveis');
      const data = await response.json();
      setAvailableUsers(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários disponíveis:', error);
    }
  };

  const handleAddUser = async (userId: string) => {
    setActionLoading(true);
    try {
      const response = await apiFetch(`/departments/${departmentId}/users`, {
        method: 'POST',
        body: JSON.stringify({ userId, isDefault: false }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao adicionar usuário');
      }

      toast.success('Usuário adicionado com sucesso!');
      await loadCurrentUsers();
      await loadAvailableUsers();
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error(error.message || 'Erro ao adicionar usuário');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    const confirmed = window.confirm(
      'Tem certeza que deseja remover este usuário do departamento?'
    );

    if (!confirmed) return;

    setActionLoading(true);
    try {
      const response = await apiFetch(`/departments/${departmentId}/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover usuário');
      }

      toast.success('Usuário removido com sucesso!');
      await loadCurrentUsers();
      await loadAvailableUsers();
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      toast.error(error.message || 'Erro ao remover usuário');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefaultDepartment = async (userId: string) => {
    setActionLoading(true);
    try {
      // Remover e adicionar novamente com isDefault = true
      await apiFetch(`/departments/${departmentId}/users/${userId}`, {
        method: 'DELETE',
      });

      const response = await apiFetch(`/departments/${departmentId}/users`, {
        method: 'POST',
        body: JSON.stringify({ userId, isDefault: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao definir departamento padrão');
      }

      toast.success('Departamento padrão atualizado!');
      await loadCurrentUsers();
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao definir departamento padrão:', error);
      toast.error(error.message || 'Erro ao atualizar departamento padrão');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UsersIcon className="w-6 h-6" />
              Gerenciar Usuários
            </h2>
            <p className="text-sm text-gray-600 mt-1">{departmentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'current'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Usuários Atuais ({currentUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'available'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Adicionar Usuários ({availableUsers.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'current' ? (
            <div className="space-y-3">
              {currentUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum usuário neste departamento</p>
                </div>
              ) : (
                currentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{user.nome}</h4>
                        {user.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                            Padrão
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            user.role === 'ADMIN' || user.role === 'SUPERADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role === 'ADMIN' ? 'Admin' : user.role === 'SUPERADMIN' ? 'Super Admin' : 'Usuário'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {user._count && (
                        <p className="text-xs text-gray-500 mt-1">
                          {user._count.assignedChats || 0} chats atribuídos
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!user.isDefault && user.role === 'USER' && (
                        <button
                          onClick={() => handleSetDefaultDepartment(user.id)}
                          disabled={actionLoading}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Definir como departamento padrão"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      {user.role === 'USER' && (
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={actionLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remover do departamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
                        <span className="text-xs text-gray-500 px-3 py-1 bg-gray-100 rounded-lg">
                          Membro automático
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {availableUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Todos os usuários já estão neste departamento</p>
                </div>
              ) : (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{user.nome}</h4>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          Usuário
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddUser(user.id)}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

