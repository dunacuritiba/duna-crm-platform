import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '../../types/user';
import type { MedicalClinic } from '../../types/clinic';
import { Modal } from '../common/Modal';
import { saveAttendantPortfolio } from '../../services/portfolioService';
import { isClinicContractActive } from '../../utils/contract';
import {
  Briefcase,
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Check,
  MapPin,
} from 'lucide-react';

interface PortfolioDistributionModalProps {
  attendant: User | null;
  allClinics: MedicalClinic[];
  allUsers: User[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PortfolioDistributionModal: React.FC<PortfolioDistributionModalProps> = ({
  attendant,
  allClinics,
  allUsers,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter strictly for clinics with an active/valid contract (CONTRATO VIGENTE)
  const eligibleClinics = useMemo(() => {
    return allClinics.filter((c) =>
      isClinicContractActive(c.status, c.contractStatus, c.contractEndDate)
    );
  }, [allClinics]);

  const nonEligibleCount = allClinics.length - eligibleClinics.length;

  // Initialize selected clinics from attendant's current assigned clinics (only active contracts)
  useEffect(() => {
    if (attendant && isOpen) {
      const eligibleIds = new Set(eligibleClinics.map((c) => c.id));
      const assigned = eligibleClinics
        .filter((c) => c.assignedAttendantId === attendant.id)
        .map((c) => c.id);

      // Merge with any IDs in attendant.assignedClinicIds, keeping strictly eligible ones
      const combined = Array.from(
        new Set([
          ...assigned,
          ...(attendant.assignedClinicIds || []).filter((id) => eligibleIds.has(id)),
        ])
      );
      setSelectedClinicIds(combined);
      setSearch('');
      setFilterMode('ALL');
      setErrorMessage(null);
    }
  }, [attendant, eligibleClinics, isOpen]);

  if (!attendant) return null;

  // Map of clinicId to assigned attendant's name if not the current attendant
  const usersMap = new Map(allUsers.map((u) => [u.id, u.name]));

  // Filtered clinics (only among eligible active contract clinics)
  const filteredClinics = useMemo(() => {
    return eligibleClinics.filter((c) => {
      const matchSearch =
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        (c.tradeName && c.tradeName.toLowerCase().includes(search.toLowerCase())) ||
        c.cnpj.includes(search) ||
        (c.city && c.city.toLowerCase().includes(search.toLowerCase()));

      const isSelected = selectedClinicIds.includes(c.id);

      let matchFilter = true;
      if (filterMode === 'ASSIGNED') {
        matchFilter = isSelected;
      } else if (filterMode === 'UNASSIGNED') {
        matchFilter = !c.assignedAttendantId || isSelected;
      }

      return matchSearch && matchFilter;
    });
  }, [eligibleClinics, search, filterMode, selectedClinicIds]);

  const toggleClinic = (clinicId: string) => {
    // Only toggle if clinic has an active contract
    const target = eligibleClinics.find((c) => c.id === clinicId);
    if (!target) {
      setErrorMessage('Esta clínica não possui contrato vigente e não pode ser adicionada à carteira.');
      return;
    }
    setSelectedClinicIds((prev) =>
      prev.includes(clinicId) ? prev.filter((id) => id !== clinicId) : [...prev, clinicId]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredClinics.map((c) => c.id);
    setSelectedClinicIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleClearAll = () => {
    setSelectedClinicIds([]);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      // Final business rule validation before saving
      const hasInvalidClinic = selectedClinicIds.some((id) => {
        const c = allClinics.find((item) => item.id === id);
        return !c || !isClinicContractActive(c.status, c.contractStatus, c.contractEndDate);
      });

      if (hasInvalidClinic) {
        setErrorMessage(
          'Regra de Negócio: Apenas clínicas com contrato vigente podem ser distribuídas para a carteira de atendentes.'
        );
        setIsSaving(false);
        return;
      }

      await saveAttendantPortfolio(attendant.id, selectedClinicIds);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao atualizar carteira do atendente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Distribuição da Carteira de Clientes"
      subtitle="Definir quais clínicas médicas estarão sob a gestão e agenda deste atendente"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Attendant Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl">
          <div className="flex items-center gap-3.5">
            <img
              src={attendant.avatar}
              alt={attendant.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm">{attendant.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  <Headphones className="w-3 h-3 text-amber-600" />
                  Equipe de Atendimento
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {attendant.email} {attendant.department && `• ${attendant.department}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-amber-200 text-xs font-semibold text-slate-700 shadow-xs">
            <Briefcase className="w-4 h-4 text-amber-600" />
            <span>
              Carteira atual:{' '}
              <strong className="text-amber-700 text-sm font-bold">
                {selectedClinicIds.length}
              </strong>{' '}
              {selectedClinicIds.length === 1 ? 'cliente' : 'clientes'}
            </span>
          </div>
        </div>

        {/* Contract Rule Notice */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Regra de Carteira:</strong> Apenas clínicas com <strong>contrato vigente</strong> (clientes ativos) podem ser distribuídas.
            </span>
          </div>
          {nonEligibleCount > 0 && (
            <span className="text-[11px] font-semibold text-slate-500 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 self-start sm:self-auto">
              {nonEligibleCount} sem contrato vigente (ocultas)
            </span>
          )}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar clínica por nome, CNPJ ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                filterMode === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({allClinics.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('ASSIGNED')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                filterMode === 'ASSIGNED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Na Carteira ({selectedClinicIds.length})
            </button>
          </div>
        </div>

        {/* Bulk Selection Actions */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Mostrando <strong>{filteredClinics.length}</strong> clínicas disponíveis
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-amber-700 hover:text-amber-800 font-semibold underline underline-offset-2"
            >
              Selecionar todas visíveis
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-500 hover:text-rose-600 font-semibold"
            >
              Limpar seleção
            </button>
          </div>
        </div>

        {/* Clinics Multi-select List */}
        <div className="max-h-[340px] overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
          {filteredClinics.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma clínica encontrada para os critérios de busca.
            </div>
          ) : (
            filteredClinics.map((clinic) => {
              const isSelected = selectedClinicIds.includes(clinic.id);
              const otherAttendantId =
                clinic.assignedAttendantId && clinic.assignedAttendantId !== attendant.id
                  ? clinic.assignedAttendantId
                  : null;
              const otherAttendantName = otherAttendantId ? usersMap.get(otherAttendantId) : null;

              return (
                <div
                  key={clinic.id}
                  onClick={() => toggleClinic(clinic.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs ring-1 ring-amber-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox Icon */}
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition ${
                        isSelected
                          ? 'bg-amber-600 text-white'
                          : 'border border-slate-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>

                    {/* Clinic Logo or Icon */}
                    {clinic.logo ? (
                      <img
                        src={clinic.logo}
                        alt={clinic.companyName}
                        className="w-9 h-9 rounded-lg object-contain bg-white border border-slate-200 shrink-0 p-0.5"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                    )}

                    {/* Clinic Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-xs truncate">
                          {clinic.tradeName || clinic.companyName}
                        </h4>
                        {otherAttendantName && !isSelected && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0 whitespace-nowrap">
                            Com: {otherAttendantName}
                          </span>
                        )}
                        {otherAttendantName && isSelected && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900 shrink-0 whitespace-nowrap">
                            Transferindo de: {otherAttendantName}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono text-slate-500 whitespace-nowrap">{clinic.cnpj}</span>
                        {clinic.city && clinic.state && (
                          <span className="flex items-center gap-0.5 whitespace-nowrap">
                            <MapPin className="w-2.5 h-2.5" />
                            {clinic.city}/{clinic.state}
                          </span>
                        )}
                        {clinic.units && clinic.units.length > 0 && (
                          <span className="whitespace-nowrap">
                            {clinic.units.length}{' '}
                            {clinic.units.length === 1 ? 'unidade' : 'unidades'}
                          </span>
                        )}
                        {clinic.membersCount?.medicos ? (
                          <span className="whitespace-nowrap">{clinic.membersCount.medicos} médicos</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        isSelected
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {isSelected ? 'Na Carteira' : 'Disponível'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            Total selecionado: <strong>{selectedClinicIds.length} clínicas</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {isSaving ? (
                <>Salvando carteira...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Distribuição
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
