import { runWorkerTask } from './workerClient'

export const fetchCollection = async (resourceKey) => {
  return runWorkerTask('api', {
    action: 'fetchCollection',
    payload: { resourceKey },
  })
}

export const fetchRecord = async (resourceKey, id) => {
  return runWorkerTask('api', {
    action: 'fetchRecord',
    payload: { resourceKey, id },
  })
}

export const createRecord = async (resourceKey, payload) => {
  return runWorkerTask('api', {
    action: 'createRecord',
    payload: { resourceKey, payload },
  })
}

export const updateRecord = async (resourceKey, id, payload) => {
  return runWorkerTask('api', {
    action: 'updateRecord',
    payload: { resourceKey, id, payload },
  })
}

export const patchRecord = async (resourceKey, id, payload) => {
  return runWorkerTask('api', {
    action: 'patchRecord',
    payload: { resourceKey, id, payload },
  })
}

export const fetchRelationOptions = async (relationKeys) =>
  runWorkerTask('fetchRelationOptions', { relationKeys })

export const fetchDashboardStats = async (resources) =>
  runWorkerTask('fetchDashboardStats', { resources })

export const filterRecordsInWorker = async (payload) => runWorkerTask('filterRecords', payload)
