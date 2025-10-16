import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, MessageSquare, Settings, AlertCircle, UserCog } from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../config/api';
import toast from 'react-hot-toast';
import { ManageUsersModal } from '../components/ManageUsersModal';

interface Department {
  id: string;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  createdAt: string;
  _count: {
    users: number;
    chats: number;
  };
}

interface DepartmentFormData {
  name: string;
  description: string;
  color: string;
}

const DEPARTMENT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
];

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  
  // Estados para gerenciamento de usuários
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Verificar permissões
  if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">Você não tem permissão para acessar esta página.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Carregar departamentos
  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/departments');
      const data = await response.json();
      
      if (data.success) {
        setDepartments(data.data);
      } else {
        toast.error('Erro ao carregar departamentos');
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
      toast.error('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // Abrir modal para criar/editar
  const openModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        description: department.description || '',
        color: department.color
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6'
      });
    }
    setShowModal(true);
  };

  // Fechar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  };

  // Salvar departamento
  const saveDepartment = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do departamento é obrigatório');
      return;
    }

    try {
      const url = editingDepartment ? `/departments/${editingDepartment.id}` : '/departments';
      const method = editingDepartment ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingDepartment ? 'Departamento atualizado!' : 'Departamento criado!');
        loadDepartments();
        closeModal();
      } else {
        toast.error(data.error || 'Erro ao salvar departamento');
      }
    } catch (error) {
      console.error('Erro ao salvar departamento:', error);
      toast.error('Erro ao salvar departamento');
    }
  };

  // Deletar departamento
  const deleteDepartment = async (department: Department) => {
    if (!confirm(`Tem certeza que deseja deletar o departamento "${department.name}"?`)) {
      return;
    }

    try {
      const response = await apiFetch(`/departments/${department.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Departamento deletado!');
        loadDepartments();
      } else {
        toast.error(data.error || 'Erro ao deletar departamento');
      }
    } catch (error) {
      console.error('Erro ao deletar departamento:', error);
      toast.error('Erro ao deletar departamento');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Departamentos</h1>
              <p className="text-gray-600">Gerencie os departamentos da sua empresa</p>
            </div>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Departamento
            </button>
          </div>
        </div>

        {/* Lista de Departamentos */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((department) => (
              <div
                key={department.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: department.color }}
                    ></div>
                    <h3 className="font-semibold text-gray-900">{department.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(department)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteDepartment(department)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {department.description && (
                  <p className="text-gray-600 text-sm mb-4">{department.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{department._count.users} usuários</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MessageSquare className="h-4 w-4" />
                    <span>{department._count.chats} chats</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Criado em {new Date(department.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className={`px-2 py-1 rounded-full ${
                      department.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {department.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  {/* Botão Gerenciar Usuários */}
                  <button
                    onClick={() => {
                      setSelectedDepartment(department);
                      setShowManageUsersModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <UserCog className="w-4 h-4" />
                    Gerenciar Usuários
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && departments.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum departamento encontrado</h3>
            <p className="text-gray-600 mb-4">Comece criando seu primeiro departamento.</p>
            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Criar Departamento
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingDepartment ? 'Editar Departamento' : 'Novo Departamento'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Vendas, Suporte, Financeiro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descrição do departamento..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DEPARTMENT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={saveDepartment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingDepartment ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gerenciar Usuários */}
      {showManageUsersModal && selectedDepartment && (
        <ManageUsersModal
          isOpen={showManageUsersModal}
          onClose={() => {
            setShowManageUsersModal(false);
            setSelectedDepartment(null);
          }}
          departmentId={selectedDepartment.id}
          departmentName={selectedDepartment.name}
          onSuccess={() => {
            // Recarregar lista de departamentos para atualizar contadores
            loadDepartments();
          }}
        />
      )}
    </div>
  );
}
