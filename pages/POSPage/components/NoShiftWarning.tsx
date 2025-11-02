
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../../contexts/I18nContext';
// Fix: Changed named import to default import for GlassCard.
import GlassCard from '../../../components/ui/GlassCard';
// Fix: Changed named import to default import for NeuButton.
import NeuButton from '../../../components/ui/NeuButton';

/**
 * A warning component displayed when no active shift is found for the user.
 */
export const NoShiftWarning: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <GlassCard className="text-center p-8 m-auto">
      <h2 className="text-2xl font-bold mb-4">{t('no_active_shift')}</h2>
      <p className="mb-6">{t('please_start_a_new_shift')}</p>
      <NeuButton variant="primary" onClick={() => navigate('/shift')}>
        {t('go_to_shift_page')}
      </NeuButton>
    </GlassCard>
  );
};
