import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const toErrorMessage = (error) => {
  if (axios.isAxiosError(error)) {
    const responseMessage =
      typeof error.response?.data === 'string'
        ? error.response.data
        : error.response?.data?.message

    return responseMessage || error.message || 'Request failed.'
  }

  return error instanceof Error ? error.message : 'Unexpected worker error.'
}

const apiHandlers = {
  async fetchCollection({ resourceKey }) {
    const { data } = await api.get(`/${resourceKey}`)
    return data
  },
  async fetchRecord({ resourceKey, id }) {
    const { data } = await api.get(`/${resourceKey}/${id}`)
    return data
  },
  async createRecord({ resourceKey, payload }) {
    const { data } = await api.post(`/${resourceKey}`, payload)
    return data
  },
  async updateRecord({ resourceKey, id, payload }) {
    const { data } = await api.put(`/${resourceKey}/${id}`, payload)
    return data
  },
  async patchRecord({ resourceKey, id, payload }) {
    const { data } = await api.patch(`/${resourceKey}/${id}`, payload)
    return data
  },
}

const taskHandlers = {
  async api({ action, payload }) {
    const handler = apiHandlers[action]

    if (!handler) {
      throw new Error(`Unsupported API worker action: ${action}`)
    }

    return handler(payload)
  },

  async fetchRelationOptions({ relationKeys }) {
    const uniqueKeys = [...new Set(relationKeys.filter(Boolean))]
    const entries = await Promise.all(
      uniqueKeys.map(async (resourceKey) => {
        const records = await apiHandlers.fetchCollection({ resourceKey })
        return [resourceKey, records.filter((record) => !record.deleted_at)]
      }),
    )

    return Object.fromEntries(entries)
  },

  async fetchDashboardStats({ resources }) {
    return Promise.all(
      resources.map(async (resource) => {
        const records = await apiHandlers.fetchCollection({ resourceKey: resource.key })
        const activeCount = records.filter((record) => !record.deleted_at).length
        const archivedCount = records.length - activeCount

        return {
          ...resource,
          activeCount,
          archivedCount,
          latestUpdatedAt: records
            .map((record) => record.updated_at)
            .filter(Boolean)
            .sort()
            .at(-1),
        }
      }),
    )
  },

  async filterRecords({
    records,
    tableFields,
    showArchived,
    searchTerm,
    isProductListing,
    productCategoryFilter,
    productDateFilter,
    productSort,
    nowIso,
  }) {
    const baseRows = records.filter((record) => showArchived || !record.deleted_at)
    const normalizedTerm = searchTerm.trim().toLowerCase()
    let nextRows = !normalizedTerm
      ? [...baseRows]
      : baseRows.filter((record) =>
          tableFields.some((fieldKey) =>
            String(record[fieldKey] ?? '')
              .toLowerCase()
              .includes(normalizedTerm),
          ),
        )

    if (!isProductListing) {
      return nextRows
    }

    if (productCategoryFilter) {
      nextRows = nextRows.filter(
        (record) => String(record.category_id) === String(productCategoryFilter),
      )
    }

    if (productDateFilter) {
      const now = new Date(nowIso)

      nextRows = nextRows.filter((record) => {
        if (!record.created_at) {
          return false
        }

        const createdAt = new Date(record.created_at)

        if (productDateFilter === 'today') {
          return createdAt.toDateString() === now.toDateString()
        }

        const diffInDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

        if (productDateFilter === 'last7') {
          return diffInDays <= 7
        }

        if (productDateFilter === 'last30') {
          return diffInDays <= 30
        }

        return true
      })
    }

    if (productSort === 'name_asc') {
      nextRows.sort((left, right) => String(left.name ?? '').localeCompare(String(right.name ?? '')))
    } else if (productSort === 'name_desc') {
      nextRows.sort((left, right) => String(right.name ?? '').localeCompare(String(left.name ?? '')))
    } else if (productSort === 'price_desc') {
      nextRows.sort((left, right) => Number(right.price ?? 0) - Number(left.price ?? 0))
    } else if (productSort === 'price_asc') {
      nextRows.sort((left, right) => Number(right.price ?? 0) - Number(left.price ?? 0))
    }

    return nextRows
  },
}

self.onmessage = async (event) => {
  const { id, type, payload } = event.data
  const handler = taskHandlers[type]

  if (!handler) {
    self.postMessage({
      id,
      success: false,
      error: `Unsupported worker task: ${type}`,
    })
    return
  }

  try {
    const result = await handler(payload)
    self.postMessage({ id, success: true, result })
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: toErrorMessage(error),
    })
  }
}
