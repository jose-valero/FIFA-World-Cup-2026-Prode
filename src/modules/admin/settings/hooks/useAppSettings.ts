import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../../lib/react-query/queryKeys';
import { getAppSettings } from '../api/appSettings.api';

export function useAppSettings() {
  return useQuery({
    queryKey: queryKeys.appSettings,
    queryFn: getAppSettings
  });
}
