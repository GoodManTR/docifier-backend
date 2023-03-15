import { ModelConfig } from './models'

export const modelConfig: ModelConfig = {
  filters: [
    {
      fieldName: 'categories',
      filterId: 'categories',
      filterType: 'string',
      label: 'Kategori',
      order: 0,
      values: [],
      visibility: true,
    },
    {
      fieldName: 'brand',
      filterId: 'brand',
      filterType: 'string',
      label: 'Marka',
      order: 1,
      values: [],
      visibility: true,
    },
    {
      fieldName: 'size',
      filterId: 'size',
      filterType: 'string',
      label: 'Boyut',
      order: 2,
      values: [],
      visibility: true,
    },
    {
      fieldName: 'newProducts',
      filterId: 'newProducts',
      filterType: 'boolean',
      label: 'Yeni Ürünler',
      order: 3,
      values: [],
      visibility: true,
    },
    {
      fieldName: 'promotedProducts',
      filterId: 'promotedProducts',
      filterType: 'boolean',
      label: 'Fırsat Ürünleri',
      order: 4,
      values: [],
      visibility: true,
    },
  ],
}
