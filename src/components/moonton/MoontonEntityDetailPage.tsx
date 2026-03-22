import { MoontonEntity, MoontonKYBRecord, KYBRecordBase, Channel } from '../../types';
import {
  createMoontonKybRecord,
  updateMoontonKybRecord,
  deleteMoontonKybRecord,
} from '../../lib/moontonService';
import { RegionBadge } from '../shared/RegionBadge';
import { KybRecordsSection } from '../kyb/KybRecordsSection';
import { ArrowLeft, Calendar, Building2 } from 'lucide-react';

interface MoontonEntityDetailPageProps {
  entity: MoontonEntity;
  moontonKybRecords: MoontonKYBRecord[];
  channels: Channel[];
  onRefreshKybRecords: () => Promise<void>;
  onBack: () => void;
}

export function MoontonEntityDetailPage({
  entity,
  moontonKybRecords,
  channels,
  onRefreshKybRecords,
  onBack,
}: MoontonEntityDetailPageProps) {
  const entityRecords: KYBRecordBase[] = moontonKybRecords
    .filter((r) => r.moonton_entity_id === entity.id)
    .map(({ id, channel_id, status, submitted_at, reviewed_at, notes }) => ({
      id,
      channel_id,
      status,
      submitted_at,
      reviewed_at,
      notes,
    }));

  const handleSave = async (data: Omit<KYBRecordBase, 'id'>, existingId?: string) => {
    if (existingId) {
      await updateMoontonKybRecord(existingId, data);
    } else {
      await createMoontonKybRecord(entity.id, data);
    }
    await onRefreshKybRecords();
  };

  const handleDelete = async (id: string) => {
    await deleteMoontonKybRecord(id);
    await onRefreshKybRecords();
  };

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        返回平台主体列表
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{entity.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{entity.full_legal_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-sm text-gray-500 ml-[52px]">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            创建于 {entity.created_at}
          </span>
          <RegionBadge region={entity.region} />
        </div>
      </div>

      <KybRecordsSection
        records={entityRecords}
        channels={channels}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
