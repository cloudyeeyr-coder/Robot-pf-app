import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../app/components/ui/button';
import { Skeleton } from '../app/components/ui/skeleton';
import { SiPartnerCard } from '../app/components/search/SiPartnerCard';
import { FilterPanel } from '../app/components/search/FilterPanel';
import { CustomPagination } from '../app/components/ui/custom-pagination';
import { Filter, X } from 'lucide-react';
import { MOCK_SI_PARTNERS, filterSiPartners, paginateSiPartners } from '../lib/mockData';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse filters from URL
  const filters = {
    regions: searchParams.get('region')?.split(',').filter(Boolean) || [],
    brands: searchParams.get('brand')?.split(',').filter(Boolean) || [],
    tags: searchParams.get('tag')?.split(',').filter(Boolean) || [],
    has_badge: searchParams.get('badge') === 'true',
    tiers: searchParams.get('tier')?.split(',').filter(Boolean) || [],
  };

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Filter and paginate partners
  const filteredPartners = filterSiPartners(MOCK_SI_PARTNERS, filters);
  const { data: partners, total, totalPages } = paginateSiPartners(filteredPartners, currentPage);

  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const updateFilters = (newFilters: typeof filters) => {
    const params = new URLSearchParams();

    if (newFilters.regions.length > 0) {
      params.set('region', newFilters.regions.join(','));
    }
    if (newFilters.brands.length > 0) {
      params.set('brand', newFilters.brands.join(','));
    }
    if (newFilters.tags.length > 0) {
      params.set('tag', newFilters.tags.join(','));
    }
    if (newFilters.has_badge) {
      params.set('badge', 'true');
    }
    if (newFilters.tiers.length > 0) {
      params.set('tier', newFilters.tiers.join(','));
    }
    params.set('page', '1'); // Reset to first page on filter change

    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters =
    filters.regions.length > 0 ||
    filters.brands.length > 0 ||
    filters.tags.length > 0 ||
    filters.has_badge ||
    filters.tiers.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <h1 className="text-2xl font-bold mb-2">SI 파트너 검색</h1>
          <p className="text-gray-600">
            {total}개의 검증된 SI 파트너를 찾았습니다
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              <FilterPanel
                filters={filters}
                onFilterChange={updateFilters}
                onReset={resetFilters}
              />
            </div>
          </aside>

          {/* Mobile Filter Panel */}
          {showMobileFilters && (
            <div className="lg:hidden">
              <FilterPanel
                filters={filters}
                onFilterChange={updateFilters}
                onReset={resetFilters}
                isMobile
                onClose={() => setShowMobileFilters(false)}
              />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowMobileFilters(true)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                필터
                {hasActiveFilters && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    활성
                  </span>
                )}
              </Button>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-1" />
                  초기화
                </Button>
              )}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : partners.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16">
                <div className="mb-4">
                  <Filter className="h-16 w-16 mx-auto text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  조건에 맞는 SI 파트너가 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  필터를 조정하거나 초기화하여 다시 검색해보세요
                </p>
                <Button onClick={resetFilters}>필터 초기화</Button>
              </div>
            ) : (
              /* Results */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                  {partners.map((partner) => (
                    <SiPartnerCard key={partner.id} partner={partner} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <CustomPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
