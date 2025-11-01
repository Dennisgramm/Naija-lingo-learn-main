import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onSort: (sortBy: string) => void;
  onFilter: (filters: { language?: string; level?: string; price?: string }) => void;
  searchQuery: string;
  sortBy: string;
  filters: { language?: string; level?: string; price?: string };
}

export const SearchAndFilter = ({ 
  onSearch, 
  onSort, 
  onFilter, 
  searchQuery, 
  sortBy, 
  filters 
}: SearchAndFilterProps) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
  };

  const clearFilters = () => {
    onFilter({});
    setShowFilters(false);
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== 'all');

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search courses..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" className="bg-gradient-primary">
          Search
        </Button>
      </form>

      {/* Filter Toggle and Sort */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? 'border-primary text-primary' : ''}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {Object.values(filters).filter(v => v && v !== 'all').length}
              </span>
            )}
          </Button>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <Select value={sortBy} onValueChange={onSort}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="title_asc">Title A-Z</SelectItem>
            <SelectItem value="title_desc">Title Z-A</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg animate-fade-in">
          <div>
            <label className="text-sm font-medium mb-2 block">Language</label>
            <Select
              value={filters.language || 'all'}
              onValueChange={(value) => onFilter({ ...filters, language: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Languages</SelectItem>
                <SelectItem value="Yoruba">Yoruba</SelectItem>
                <SelectItem value="Igbo">Igbo</SelectItem>
                <SelectItem value="Hausa">Hausa</SelectItem>
                <SelectItem value="Pidgin English">Pidgin English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Level</label>
            <Select
              value={filters.level || 'all'}
              onValueChange={(value) => onFilter({ ...filters, level: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Price</label>
            <Select
              value={filters.price || 'all'}
              onValueChange={(value) => onFilter({ ...filters, price: value === 'all' ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};