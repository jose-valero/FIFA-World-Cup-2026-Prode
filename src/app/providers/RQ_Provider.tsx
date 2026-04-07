import { QueryClientProvider as RQP } from '@tanstack/react-query';
import { queryClient } from '../../lib/react-query/queryClient';
import type { ReactNode } from 'react';

export const RQ_Provider = ({ children }: { children: ReactNode }) => <RQP client={queryClient}>{children}</RQP>;
