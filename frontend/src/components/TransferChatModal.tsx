import React, { useState, useEffect } from 'react';
import { X, Users, User as UserIcon, FileText } from 'lucide-react';
import { chatAssignmentsService, Department, User } from '../services/chatAssignmentsService';
import { toast } from 'react-hot-toast';

interface TransferChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
  onSuccess: () => void;
}

export function TransferChatModal({
  isOpen,
  onClose,
  chatId,
  chatName,
  onSuccess,
}: TransferChatModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Buscar departamentos ao abrir modal
  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  // Buscar usuários quando departamento for selecionado
  useEffect(() => {
    if (selectedDepartment) {
      loadUsers(selectedDepartment);
    } else {
      setUsers([]);
      setSelectedUser('');
    }
  }, [selectedDepartment]);

  const loadDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const data = await chatAssignmentsService.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      toast.error('Erro ao carregar departamentos');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadUsers = async (departmentId: string) => {
    setLoadingUsers(true);
    try {
      const data = await chatAssignmentsService.getDepartmentUsers(departmentId);
      setUsers(data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedDepartment) {
      toast.error('Selecione um departamento');
      return;
    }

    setLoading(true);
    try {
      await chatAssignmentsService.transferChat({
        chatId,
        departmentId: selectedDepartment,
        userId: selectedUser || undefined,
        notes: notes || undefined,
      });

      toast.success('Chat transferido com sucesso!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao transferir chat:', error);
      toast.error(error.message || 'Erro ao transferir chat');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDepartment('');
    setSelectedUser('');
    setNotes('');
    setUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Transferir Chat
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Info do Chat */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Chat:</span> {chatName}
            </p>
          </div>

          {/* Selecionar Departamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Departamento *
            </label>
            {loadingDepartments ? (
              <div className="text-sm text-gray-500">Carregando departamentos...</div>
            ) : (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um departamento</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selecionar Usuário (opcional) */}
          {selectedDepartment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Usuário (opcional)
              </label>
              {loadingUsers ? (
                <div className="text-sm text-gray-500">Carregando usuários...</div>
              ) : users.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Nenhum usuário encontrado neste departamento
                </div>
              ) : (
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Não atribuir a usuário específico</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome} ({user.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre a transferência..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleTransfer}
            disabled={loading || !selectedDepartment}
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
            Transferir
          </button>
        </div>
      </div>
    </div>
  );
}

