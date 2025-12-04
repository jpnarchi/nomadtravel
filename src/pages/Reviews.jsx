import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Plus, Search, Filter, Star, MapPin, Building2, 
  Loader2, Eye, Edit2, Trash2, X, BookOpen, GraduationCap
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewDetail from '@/components/reviews/ReviewDetail';
import LearningForm from '@/components/learning/LearningForm';
import LearningCard from '@/components/learning/LearningCard';
import LearningDetail from '@/components/learning/LearningDetail';
import EmptyState from '@/components/ui/EmptyState';

const CONTENT_TYPE_LABELS = {
  fam_trip: 'FAM Trip',
  proveedor: 'Proveedor',
  hotel: 'Hotel',
  destino: 'Destino',
  aerolinea: 'Aerolínea',
  experiencia: 'Experiencia',
  otro: 'Otro'
};

const PROVIDER_TYPE_LABELS = {
  dmc: 'DMC',
  hotel: 'Hotel',
  aerolinea: 'Aerolínea',
  transporte: 'Transporte',
  cruise: 'Cruise',
  experiencia: 'Experiencia',
  otro: 'Otro'
};

const LEARNING_CATEGORIES = {
  guia: 'Guía',
  manual: 'Manual',
  presentacion: 'Presentación',
  video: 'Video',
  link: 'Link',
  pdf: 'PDF',
  notas: 'Notas',
  otro: 'Otro'
};

export default function Reviews() {
  const [activeTab, setActiveTab] = useState('reviews');
  
  // Reviews state
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    content_type: 'all',
    provider_type: 'all',
    country: 'all',
    rating: 'all',
    recommended: 'all'
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [viewingReview, setViewingReview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Learning state
  const [learningSearch, setLearningSearch] = useState('');
  const [learningFilters, setLearningFilters] = useState({
    category: 'all',
    provider_type: 'all',
    destination: 'all'
  });
  const [learningFormOpen, setLearningFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [deleteLearningConfirm, setDeleteLearningConfirm] = useState(null);
  const [learningPage, setLearningPage] = useState(1);
  
  const ITEMS_PER_PAGE = 12;
  const queryClient = useQueryClient();

  // Reviews queries
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.list('-created_date')
  });

  // Learning queries
  const { data: learningMaterials = [], isLoading: learningLoading } = useQuery({
    queryKey: ['learningMaterials'],
    queryFn: () => base44.entities.LearningMaterial.list('-created_date')
  });

  // Reviews mutations
  const createReviewMutation = useMutation({
    mutationFn: (data) => base44.entities.Review.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setFormOpen(false);
    }
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Review.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setFormOpen(false);
      setEditingReview(null);
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id) => base44.entities.Review.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setDeleteConfirm(null);
    }
  });

  // Learning mutations
  const createLearningMutation = useMutation({
    mutationFn: (data) => base44.entities.LearningMaterial.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningMaterials'] });
      setLearningFormOpen(false);
    }
  });

  const updateLearningMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LearningMaterial.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningMaterials'] });
      setLearningFormOpen(false);
      setEditingMaterial(null);
    }
  });

  const deleteLearningMutation = useMutation({
    mutationFn: (id) => base44.entities.LearningMaterial.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningMaterials'] });
      setDeleteLearningConfirm(null);
    }
  });

  // Reviews filters
  const uniqueCountries = [...new Set(reviews.map(r => r.country).filter(Boolean))].sort();
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = !search || 
      review.title?.toLowerCase().includes(search.toLowerCase()) ||
      review.provider_name?.toLowerCase().includes(search.toLowerCase()) ||
      review.country?.toLowerCase().includes(search.toLowerCase()) ||
      review.city?.toLowerCase().includes(search.toLowerCase());
    
    const matchesContentType = filters.content_type === 'all' || review.content_type === filters.content_type;
    const matchesProviderType = filters.provider_type === 'all' || review.provider_type === filters.provider_type;
    const matchesCountry = filters.country === 'all' || review.country === filters.country;
    const matchesRating = filters.rating === 'all' || review.rating === parseInt(filters.rating);
    const matchesRecommended = filters.recommended === 'all' || review.recommended === filters.recommended;

    return matchesSearch && matchesContentType && matchesProviderType && matchesCountry && matchesRating && matchesRecommended;
  });

  // Learning filters
  const uniqueDestinations = [...new Set(learningMaterials.map(m => m.destination).filter(Boolean))].sort();
  const filteredLearning = learningMaterials.filter(material => {
    const matchesSearch = !learningSearch || 
      material.title?.toLowerCase().includes(learningSearch.toLowerCase()) ||
      material.description?.toLowerCase().includes(learningSearch.toLowerCase()) ||
      material.tags?.some(t => t.toLowerCase().includes(learningSearch.toLowerCase()));
    
    const matchesCategory = learningFilters.category === 'all' || material.category === learningFilters.category;
    const matchesProviderType = learningFilters.provider_type === 'all' || material.provider_type === learningFilters.provider_type;
    const matchesDestination = learningFilters.destination === 'all' || material.destination === learningFilters.destination;

    return matchesSearch && matchesCategory && matchesProviderType && matchesDestination;
  });

  const clearFilters = () => {
    setFilters({ content_type: 'all', provider_type: 'all', country: 'all', rating: 'all', recommended: 'all' });
    setSearch('');
  };

  const clearLearningFilters = () => {
    setLearningFilters({ category: 'all', provider_type: 'all', destination: 'all' });
    setLearningSearch('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== 'all') || search;
  const hasActiveLearningFilters = Object.values(learningFilters).some(v => v !== 'all') || learningSearch;

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  
  const totalLearningPages = Math.ceil(filteredLearning.length / ITEMS_PER_PAGE);
  const paginatedLearning = filteredLearning.slice((learningPage - 1) * ITEMS_PER_PAGE, learningPage * ITEMS_PER_PAGE);

  React.useEffect(() => { setCurrentPage(1); }, [filters, search]);
  React.useEffect(() => { setLearningPage(1); }, [learningFilters, learningSearch]);

  const isLoading = reviewsLoading || learningLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#2E442A' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-stone-800">Learning & Reviews</h1>
          <p className="text-stone-500 mt-1">
            {learningMaterials.length} materiales · {reviews.length} reviews
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Learning
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Reviews
          </TabsTrigger>
        </TabsList>

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              onClick={() => { setEditingMaterial(null); setLearningFormOpen(true); }}
              className="text-white rounded-xl"
              style={{ backgroundColor: '#2E442A' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Material
            </Button>
          </div>

          {/* Learning Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-medium text-stone-700">Buscar y filtrar</span>
              {hasActiveLearningFilters && (
                <Button variant="ghost" size="sm" onClick={clearLearningFilters} className="ml-auto text-xs">
                  <X className="w-3 h-3 mr-1" /> Limpiar
                </Button>
              )}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Buscar por título, descripción o tags..."
                value={learningSearch}
                onChange={(e) => setLearningSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={learningFilters.category} onValueChange={(v) => setLearningFilters({...learningFilters, category: v})}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Object.entries(LEARNING_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={learningFilters.provider_type} onValueChange={(v) => setLearningFilters({...learningFilters, provider_type: v})}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Tipo proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {Object.entries(PROVIDER_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={learningFilters.destination} onValueChange={(v) => setLearningFilters({...learningFilters, destination: v})}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los destinos</SelectItem>
                  {uniqueDestinations.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Learning Grid */}
          {filteredLearning.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={hasActiveLearningFilters ? "Sin resultados" : "Sin materiales"}
              description={hasActiveLearningFilters ? "No se encontraron materiales con esos filtros" : "Agrega tu primer material de aprendizaje"}
              actionLabel={!hasActiveLearningFilters ? "Crear Material" : undefined}
              onAction={!hasActiveLearningFilters ? () => setLearningFormOpen(true) : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedLearning.map((material) => (
                <LearningCard
                  key={material.id}
                  material={material}
                  onView={setViewingMaterial}
                  onEdit={(m) => { setEditingMaterial(m); setLearningFormOpen(true); }}
                  onDelete={setDeleteLearningConfirm}
                />
              ))}
            </div>
          )}

          {/* Learning Pagination */}
          {totalLearningPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setLearningPage(p => Math.max(1, p - 1))} disabled={learningPage === 1} className="rounded-xl">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-stone-500">Página {learningPage} de {totalLearningPages}</span>
              <Button variant="outline" size="sm" onClick={() => setLearningPage(p => Math.min(totalLearningPages, p + 1))} disabled={learningPage === totalLearningPages} className="rounded-xl">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="flex justify-end">
            <Button 
              onClick={() => { setEditingReview(null); setFormOpen(true); }}
              className="text-white rounded-xl"
              style={{ backgroundColor: '#2E442A' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Review
            </Button>
          </div>

          {/* Reviews Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-medium text-stone-700">Buscar y filtrar</span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs">
                  <X className="w-3 h-3 mr-1" /> Limpiar
                </Button>
              )}
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Buscar por título, proveedor, país o ciudad..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Select value={filters.content_type} onValueChange={(v) => setFilters({...filters, content_type: v})}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Tipo contenido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.provider_type} onValueChange={(v) => setFilters({...filters, provider_type: v})}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Tipo proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proveedores</SelectItem>
                  {Object.entries(PROVIDER_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.country} onValueChange={(v) => setFilters({...filters, country: v})}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los países</SelectItem>
                  {uniqueCountries.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.rating} onValueChange={(v) => setFilters({...filters, rating: v})}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los ratings</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ (5)</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ (4)</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ (3)</SelectItem>
                  <SelectItem value="2">⭐⭐ (2)</SelectItem>
                  <SelectItem value="1">⭐ (1)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.recommended} onValueChange={(v) => setFilters({...filters, recommended: v})}>
                <SelectTrigger className="rounded-xl text-xs">
                  <SelectValue placeholder="Recomendado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="si">Sí recomendado</SelectItem>
                  <SelectItem value="no">No recomendado</SelectItem>
                  <SelectItem value="depende">Depende</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reviews Grid */}
          {filteredReviews.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={hasActiveFilters ? "Sin resultados" : "Sin reviews"}
              description={hasActiveFilters ? "No se encontraron reviews con esos filtros" : "Agrega tu primer review"}
              actionLabel={!hasActiveFilters ? "Crear Review" : undefined}
              onAction={!hasActiveFilters ? () => setFormOpen(true) : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs mb-2"
                        style={{ borderColor: '#2E442A', color: '#2E442A' }}
                      >
                        {CONTENT_TYPE_LABELS[review.content_type] || review.content_type}
                      </Badge>
                      <h3 className="font-semibold text-stone-800 line-clamp-2">{review.title}</h3>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-600" onClick={() => setViewingReview(review)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-600" onClick={() => { setEditingReview(review); setFormOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-red-500" onClick={() => setDeleteConfirm(review)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {review.provider_name && (
                    <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
                      <Building2 className="w-4 h-4 text-stone-400" />
                      <span className="truncate">{review.provider_name}</span>
                    </div>
                  )}

                  {(review.city || review.country) && (
                    <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
                      <MapPin className="w-4 h-4 text-stone-400" />
                      <span className="truncate">{[review.city, review.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}

                  {review.rating && (
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-200'}`} />
                      ))}
                    </div>
                  )}

                  {review.summary && (
                    <p className="text-sm text-stone-500 line-clamp-2 mb-3">{review.summary}</p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {review.tags?.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    {review.tags?.length > 3 && (
                      <Badge variant="secondary" className="text-xs">+{review.tags.length - 3}</Badge>
                    )}
                  </div>

                  {review.recommended && (
                    <div className="mt-3 pt-3 border-t border-stone-100">
                      <Badge 
                        className={`text-xs ${
                          review.recommended === 'si' ? 'bg-green-100 text-green-700' :
                          review.recommended === 'no' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {review.recommended === 'si' ? '✓ Recomendado' : review.recommended === 'no' ? '✗ No recomendado' : '~ Depende'}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reviews Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-xl">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-stone-500">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-xl">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Form Dialog */}
      <ReviewForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingReview(null); }}
        review={editingReview}
        onSave={(data) => {
          if (editingReview) {
            updateReviewMutation.mutate({ id: editingReview.id, data });
          } else {
            createReviewMutation.mutate(data);
          }
        }}
        isLoading={createReviewMutation.isPending || updateReviewMutation.isPending}
      />

      {/* Review Detail Dialog */}
      <ReviewDetail
        review={viewingReview}
        open={!!viewingReview}
        onClose={() => setViewingReview(null)}
      />

      {/* Learning Form Dialog */}
      <LearningForm
        open={learningFormOpen}
        onClose={() => { setLearningFormOpen(false); setEditingMaterial(null); }}
        material={editingMaterial}
        onSave={(data) => {
          if (editingMaterial) {
            updateLearningMutation.mutate({ id: editingMaterial.id, data });
          } else {
            createLearningMutation.mutate(data);
          }
        }}
        isLoading={createLearningMutation.isPending || updateLearningMutation.isPending}
      />

      {/* Learning Detail Dialog */}
      <LearningDetail
        material={viewingMaterial}
        open={!!viewingMaterial}
        onClose={() => setViewingMaterial(null)}
      />

      {/* Delete Review Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar review?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente "{deleteConfirm?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteReviewMutation.mutate(deleteConfirm.id)} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Learning Confirmation */}
      <AlertDialog open={!!deleteLearningConfirm} onOpenChange={() => setDeleteLearningConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar material?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente "{deleteLearningConfirm?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLearningMutation.mutate(deleteLearningConfirm.id)} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}