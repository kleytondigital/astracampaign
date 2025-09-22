import { useState } from 'react';
import { useContacts } from '../hooks/useContacts';
import { ContactList } from '../components/ContactList';
import { ContactForm } from '../components/ContactForm';
import { CategoryModal } from '../components/CategoryModal';
import { CSVImportModal } from '../components/CSVImportModal';
import { SearchAndFilters } from '../components/SearchAndFilters';
import { Pagination } from '../components/Pagination';
import { Header } from '../components/Header';
import { Contact } from '../types';

export function ContactsPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);

  const pageSize = 30;

  const { contacts, total, totalPages, loading, error, refresh, deleteContact } = useContacts({
    search: search || undefined,
    page: currentPage,
    pageSize,
  });

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingContact(undefined);
    refresh();
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setEditingContact(undefined);
  };

  const handleNewContact = () => {
    setEditingContact(undefined);
    setIsFormOpen(true);
  };

  const handleOpenCategoryModal = () => {
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
  };

  const handleOpenCSVImportModal = () => {
    setIsCSVImportModalOpen(true);
  };

  const handleCloseCSVImportModal = () => {
    setIsCSVImportModalOpen(false);
  };

  const handleCSVImportSuccess = () => {
    refresh();
    setIsCSVImportModalOpen(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Contatos"
        subtitle={`${total} contatos cadastrados`}
        actions={
          <div className="flex gap-3">
            <button
              onClick={handleOpenCategoryModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium transition-colors"
              aria-label="Gerenciar categorias"
            >
              Categorias
            </button>
            <button
              onClick={handleOpenCSVImportModal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium transition-colors"
              aria-label="Importar contatos via CSV"
            >
              Importar CSV
            </button>
            <button
              onClick={handleNewContact}
              className="btn-primary"
              aria-label="Criar novo contato"
            >
              + Novo Contato
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">

        <SearchAndFilters
          search={search}
          onSearchChange={handleSearchChange}
          onClearFilters={handleClearFilters}
        />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <ContactList
            contacts={contacts}
            loading={loading}
            onEdit={handleEdit}
            onDelete={deleteContact}
          />
        </div>

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          Mostrando {contacts.length} de {total} contatos
        </div>
      </div>

      {isFormOpen && (
        <ContactForm
          contact={editingContact}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
      />

      <CSVImportModal
        isOpen={isCSVImportModalOpen}
        onClose={handleCloseCSVImportModal}
        onSuccess={handleCSVImportSuccess}
      />
    </>
  );
}