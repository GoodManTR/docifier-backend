import { cloneDeep } from 'lodash';
import Fuse from 'fuse.js'
import { Response } from '../../helpers/response'
import { has as hasProperty } from 'dot-prop'
import { modelConfig } from './search-config'
import { ProductSearchSchema, SearchRequest } from './models'
import _ = require('lodash');
import { stockStatus } from '../../types';

const options = {
    threshold: 0.3,
    ignoreLocation: true,
    keys: [
        {
            name: 'attributes.shortName',
            weight: 100,
        },
        {
            name: 'attributes.categories',
            weight: 4000,
        },
        {
            name: 'attributes.searchKeywords',
            weight: 200,
        },
        {
            name: 'attributes.brand',
            weight: 10,
        },
        {
            name: 'attributes.productDescription',
            weight: 2,
        },
        {
            name: 'attributes.badges',
            weight: 10,
        },
    ],
}

export function getAttributePath(fieldName: string): string {
    if (['viewCount', 'salesCount', 'favoriteCount'].includes(fieldName)) {
        return `analytics.${fieldName}`
    }

    if (['normalPrice', 'discountRate', 'normalPriceLabel', 'discountedPriceLabel', 'discountedPrice', 'discountRateLabel'].includes(fieldName)) {
        return `prices.${fieldName}`
    }

    if (['stockStatus', 'id', 'sku', 'createdAt', 'badges', 'variantGroupId', 'images', 'createdAt'].includes(fieldName)) {
      return `${fieldName}`
    }

    return `attributes.${fieldName}`
}

export const searchWithWord = (searchTerm: string, products: ProductSearchSchema[]): ProductSearchSchema[] => {
    const fuse = new Fuse(products, options);
    const searchResult = fuse.search(searchTerm)

    const searchedProducts = searchResult.map((item) => item.item);
    return searchedProducts
}

export const sortBy = (searchRequest: SearchRequest, products: ProductSearchSchema[]): ProductSearchSchema[] => {
    if (searchRequest.sortBy && Array.isArray(searchRequest.sortBy)) {
        for (const sortByValue of searchRequest.sortBy) {
            products = sortByValue.order === 'asc'
            ? products.sort((a, b) => _.get(a, `${getAttributePath(sortByValue.attribute)}`) - _.get(b, `${getAttributePath(sortByValue.attribute)}`))
            : products.sort((a, b) => _.get(b, `${getAttributePath(sortByValue.attribute)}`) - _.get(a, `${getAttributePath(sortByValue.attribute)}`));
        }
    }

    return products
}

export const createAggregation = (products: ProductSearchSchema[], productsWithoutLastFilter: ProductSearchSchema[], searchRequest: SearchRequest) => {
    const newConfig = cloneDeep(modelConfig)

    const counts = {
        categories: {},
        size: {},
        brand: {},
        promotedProducts: {},
        newProducts: {},
    };

    for (const product of products) {
      for (const filter of newConfig.filters) {
        const attributeValue = _.get(product, `${getAttributePath(filter.filterId)}`)

        if (Array.isArray(attributeValue)) {
          const addedValue: string[] = []
          for (const item of attributeValue) {
            if (!addedValue.includes(item as string)) {
              counts[filter.filterId][item] = (counts[filter.filterId][item] || 0) + 1
              addedValue.push(item as string)
            }
          }
        } else {
          counts[filter.filterId][product.attributes[filter.filterId]] = (counts[filter.filterId][product.attributes[filter.filterId]] || 0) + 1
        }
      }
    }

    if (searchRequest.filters && searchRequest.filters.length > 0) {
        const latestFilter = searchRequest.filters[searchRequest.filters.length - 1]

        counts[latestFilter.filterId] = {}
        for (const allProduct of productsWithoutLastFilter) {
            if (Array.isArray(_.get(allProduct, `${getAttributePath(latestFilter.filterId)}`))) {
                const addedValue: string[] = []
                for (const item of _.get(allProduct, `${getAttributePath(latestFilter.filterId)}`)) {
                  if (!addedValue.includes(item as string)) {
                    counts[latestFilter.filterId][item] = (counts[latestFilter.filterId][item] || 0) + 1;
                    addedValue.push(item as string)
                  }
                }
            } else {
                counts[latestFilter.filterId][allProduct.attributes[latestFilter.filterId]] = (counts[latestFilter.filterId][allProduct.attributes[latestFilter.filterId]] || 0) + 1;
            }
        }
    }

    for (const filter of newConfig.filters) {
        const values = Object.entries(counts[filter.filterId] as unknown[]).map(([key, value]) => ({ item: key, count: value as number }));

        const searchFilter = searchRequest.filters?.find((item) => item.filterId === filter.filterId)

        for (const value of values) {
            const isFiltered = (searchFilter && searchFilter.filterValues.map(String).includes(value.item)) || false

            filter.values.push({
                value: value.item,
                label: value.item,
                count: value.count,
                filtered: isFiltered,
            })
        }
    }

    return newConfig
}

export const filterProducts = (searchRequest: SearchRequest, products: ProductSearchSchema[]) => {
    const { filters, inStock, priceRange } = searchRequest

    if (inStock !== undefined) {
        products = inStock
          ? products.filter((product) => product.stockStatus !== stockStatus.Enum.NONE)
          : products.filter((product) => product.stockStatus === stockStatus.Enum.NONE);
    }

    if (priceRange) {
        products = products.filter((product) => product.prices.discountedPrice <= priceRange!.max && product.prices.discountedPrice >= priceRange!.min)
    }

    if (!filters) {
        return products
    }

    for (const selectedFilter of filters) {
        if (!selectedFilter.filterValues) continue

        const attributePath = getAttributePath(selectedFilter.filterId)

        // Checking if given field exists in product schema
        const condition = hasProperty(products[0], attributePath)

        if (condition === false) {
          throw new Response({statusCode: 400, message: "bu field bulunamadı."})
        }

        for (const fieldValue of selectedFilter.filterValues) {
            const type = typeof fieldValue

            products = ['boolean', 'number'].includes(type)
                ? products.filter((product) => _.get(product, `${attributePath}`) === fieldValue)
                : products.filter((product) => _.get(product, `${attributePath}`).includes(fieldValue));
        }

        if (Array.isArray(selectedFilter.excludedValues)) {
            for (const fieldValue of selectedFilter.excludedValues) {
                const type = typeof fieldValue
                products = ['boolean', 'number'].includes(type)
                    ? products.filter((product) => _.get(product, `${attributePath}`) !== fieldValue)
                    : products.filter((product) => {
                        const index = _.get(product, `${attributePath}`).indexOf(fieldValue)
                        return (index === -1)
                    });
            }
        }
    }
    return products
}

export const buildSearch = (products: ProductSearchSchema[],searchRequest: SearchRequest) => {
    products = filterProducts(searchRequest, products)

    if (searchRequest.searchTerm && searchRequest.searchTerm !== '') {
        products = searchWithWord(searchRequest.searchTerm, products)
    }

    products = sortBy(searchRequest, products)

    const itemCount = products.length
    const limit: number = searchRequest.from + searchRequest.size
    products = products.slice(searchRequest.from as number, limit)

    return {
        data: products,
        itemCount,
        from: searchRequest.from,
        size: searchRequest.size,
    }
}

export const deleteLastFilter = (searchRequest: SearchRequest) => {
    const clonedSearchRequest = cloneDeep(searchRequest)
    clonedSearchRequest.filters?.pop()
    return clonedSearchRequest
}

export const buildAggs = (products: ProductSearchSchema[], searchRequest: SearchRequest) => {
    const searchRequestWithoutLastFilter = deleteLastFilter(searchRequest)

    if (searchRequest.searchTerm && searchRequest.searchTerm !== '') {
        products = searchWithWord(searchRequest.searchTerm, products)
    }

    const productsWithAllFilters = filterProducts(searchRequest, products)
    const productsWithoutLastFilter = filterProducts(searchRequestWithoutLastFilter, products)

    const aggregation = createAggregation(productsWithAllFilters, productsWithoutLastFilter, searchRequest)

    return aggregation.filters.filter((item) => item.values.length > 0)
}
