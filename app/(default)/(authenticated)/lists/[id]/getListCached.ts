import { cache } from 'react';
import { getList } from 'lib/serverActions/list';

export const getListCached = cache((id: string) => getList(id));
