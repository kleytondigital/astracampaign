import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companiesService } from '../services/opportunitiesService';
import { superadminService, Tenant } from '../services/superadminService';
import { Company } from '../types';
import { Pagination } from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';
import { ListPageContainer } from '../components/PageContainer';
import toast from 'react-hot-toast';

export default function CompaniesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPERADMIN';
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Formulário
  const [formData, setFormData] = useState({
    // Dados da Empresa
    name: '',
    slug: '',
    industry: '',
    size: 'SMALL' as 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE' | 'STARTUP',
    website: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    tags: [] as string[],
    // Dados do Admin (apenas para SUPERADMIN criar novo tenant)
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    maxUsers: 10,
    maxWhatsappSessions: 5,
  });

  useEffect(() => {
    loadCompanies();
  }, [search, currentPage, pageSize, isSuperAdmin]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      
      if (isSuperAdmin) {
        // SUPERADMIN: carregar tenants
        console.log('🔍 SUPERADMIN carregando tenants...', { currentPage, pageSize, search });
        const response = await superadminService.getTenants({
          page: currentPage,
          pageSize,
          search,
        });
        console.log('📊 Resposta tenants:', response);
        console.log('📊 response.data:', response.data);
        console.log('📊 response.pagination:', response.pagination);
        console.log('📊 typeof response.data:', typeof response.data);
        console.log('📊 Array.isArray(response.data):', Array.isArray(response.data));
        
        setTenants(response.data);
        setTotalItems(response.pagination?.total || 0);
        setTotalPages(response.pagination?.totalPages || 0);
        console.log('✅ Tenants carregados:', response.data.length, 'total:', response.pagination?.total);
        
        // Log adicional após setState
        setTimeout(() => {
          console.log('🔄 Estado após setState - tenants:', tenants);
        }, 100);
      } else {
        // Tenant: carregar companies
        const response = await companiesService.getCompanies({
          page: currentPage,
          pageSize,
          search,
        });
        setCompanies(response.data);
        setTotalItems(response.pagination?.total || 0);
        setTotalPages(response.pagination?.totalPages || 0);
      }
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error);
      toast.error(error.message || 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isSuperAdmin && !editingCompany) {
        // SUPERADMIN criando novo tenant
        await superadminService.createTenant({
          companyName: formData.name,
          slug: formData.slug,
          industry: formData.industry || undefined,
          size: formData.size,
          website: formData.website || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
          description: formData.description || undefined,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          maxUsers: formData.maxUsers,
          maxWhatsappSessions: formData.maxWhatsappSessions,
          tags: formData.tags,
        });
        toast.success('Empresa/Tenant criado com sucesso!');
      } else if (editingCompany) {
        // Editar empresa existente
        await companiesService.updateCompany(editingCompany.id, formData);
        toast.success('Empresa atualizada com sucesso!');
      } else {
        // Tenant criando company
        await companiesService.createCompany(formData);
        toast.success('Empresa criada com sucesso!');
      }

      setShowModal(false);
      resetForm();
      loadCompanies();
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error);
      toast.error(error.message || 'Erro ao salvar empresa');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      industry: company.industry || '',
      size: company.size || 'SMALL',
      website: company.website || '',
      phone: company.phone || '',
      email: company.email || '',
      description: company.description || '',
      tags: company.tags || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      await companiesService.deleteCompany(id);
      toast.success('Empresa excluída com sucesso!');
      loadCompanies();
    } catch (error: any) {
      console.error('Erro ao excluir empresa:', error);
      toast.error(error.message || 'Erro ao excluir empresa');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      industry: '',
      size: 'SMALL',
      website: '',
      phone: '',
      email: '',
      address: '',
      description: '',
      tags: [],
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      maxUsers: 10,
      maxWhatsappSessions: 5,
    });
    setEditingCompany(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getSizeLabel = (size: string) => {
    const sizes: Record<string, string> = {
      SMALL: 'Pequena',
      MEDIUM: 'Média',
      LARGE: 'Grande',
      ENTERPRISE: 'Corporativa',
      STARTUP: 'Startup',
    };
    return sizes[size] || size;
  };

  return (
    <ListPageContainer
      title={isSuperAdmin ? 'Gestão de Tenants/Empresas' : 'Gestão de Empresas'}
      subtitle={isSuperAdmin 
        ? 'Gerencie todos os tenants e empresas do sistema' 
        : 'Gerencie suas empresas e contas'}
      maxWidth="full"
    >

      {/* Filtros e Ações */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar empresas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Empresa
        </button>
        </div>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-100 text-xs">
          <strong>DEBUG:</strong> isSuperAdmin: {isSuperAdmin.toString()}, 
          tenants.length: {tenants.length}, 
          companies.length: {companies.length}, 
          totalItems: {totalItems}
        </div>
      )}

      {/* Lista de Empresas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-2 text-gray-600">Carregando empresas...</p>
          </div>
        ) : (isSuperAdmin ? tenants.length === 0 : companies.length === 0) ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa cadastrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comece criando uma nova empresa para gerenciar suas contas.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Criar Primeira Empresa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* SUPERADMIN: mostrar tenants */}
          {isSuperAdmin && tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Nome e Status */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {tenant.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Slug: <code className="bg-gray-100 px-2 py-0.5 rounded">{tenant.slug}</code>
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  tenant.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {tenant.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Usuários</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {tenant._count?.users || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sessões WhatsApp</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {tenant._count?.whatsappSessions || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contatos</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {tenant._count?.contacts || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Leads</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {tenant._count?.leads || 0}
                  </p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <button
                  onClick={() => superadminService.toggleTenantStatus(tenant.id, !tenant.active).then(() => {
                    toast.success(`Tenant ${tenant.active ? 'desativado' : 'ativado'} com sucesso!`);
                    loadCompanies();
                  })}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
                    tenant.active
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {tenant.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          ))}

          {/* Tenants: mostrar companies */}
          {!isSuperAdmin && companies.map((company) => (
            <div
              key={company.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Nome e Tamanho */}
              <div className="mb-4">
                <Link
                  to={`/empresas/${company.id}`}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {company.name}
                </Link>
                {company.size && (
                  <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                    {getSizeLabel(company.size)}
                  </span>
                )}
              </div>

              {/* Informações */}
              <div className="space-y-2 mb-4">
                {company.industry && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {company.industry}
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {company.phone}
                  </div>
                )}

                {company.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {company.email}
                  </div>
                )}

                {company.website && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Tags */}
              {company.tags && company.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1">
                  {company.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(company)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Paginação */}
      {!loading && totalItems > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingCompany 
                  ? 'Editar Empresa' 
                  : isSuperAdmin 
                    ? 'Criar Novo Tenant/Empresa' 
                    : 'Nova Empresa'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome da Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Minha Empresa LTDA"
                  />
                </div>

                {/* Slug (apenas para SUPERADMIN criando tenant) */}
                {isSuperAdmin && !editingCompany && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (identificador único) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => {
                        // Garantir formato correto: apenas letras minúsculas, números e hífens
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        setFormData({ ...formData, slug });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="minha-empresa"
                      pattern="[a-z0-9-]+"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Apenas letras minúsculas, números e hífens. Ex: minha-empresa
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indústria/Setor
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
                    <select
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="STARTUP">Startup</option>
                      <option value="SMALL">Pequena</option>
                      <option value="MEDIUM">Média</option>
                      <option value="LARGE">Grande</option>
                      <option value="ENTERPRISE">Corporativa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Campos do Administrador (apenas para SUPERADMIN criando tenant) */}
                {isSuperAdmin && !editingCompany && (
                  <>
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Dados do Administrador
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Crie o usuário administrador que gerenciará esta empresa
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Administrador *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.adminName}
                        onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="João Silva"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email do Administrador *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="admin@empresa.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha do Administrador *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Máximo de Usuários
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.maxUsers}
                          onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Máximo de Sessões WhatsApp
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.maxWhatsappSessions}
                          onChange={(e) => setFormData({ ...formData, maxWhatsappSessions: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingCompany 
                      ? 'Salvar Alterações' 
                      : isSuperAdmin 
                        ? 'Criar Tenant/Empresa' 
                        : 'Criar Empresa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </ListPageContainer>
  );
}
