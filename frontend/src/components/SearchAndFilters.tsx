
interface SearchAndFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
}

export function SearchAndFilters({
  search,
  onSearchChange,
  onClearFilters,
}: SearchAndFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <label htmlFor="search" className="sr-only">
          Buscar contatos
        </label>
        <input
          id="search"
          type="text"
          placeholder="Buscar por nome, telefone ou email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Campo de busca para contatos"
        />
      </div>


      {search && (
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:underline"
          aria-label="Limpar filtros de busca"
        >
          Limpar
        </button>
      )}
    </div>
  );
}