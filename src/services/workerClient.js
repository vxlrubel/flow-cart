let worker
let taskId = 0
const pendingTasks = new Map()
const OMIT_VALUE = Symbol('omit-worker-value')

const sanitizeForWorker = (value, seen = new WeakMap()) => {
  if (value === null || value === undefined) {
    return value
  }

  const valueType = typeof value

  if (valueType === 'function' || valueType === 'symbol') {
    return OMIT_VALUE
  }

  if (valueType !== 'object') {
    return value
  }

  if (value instanceof Date) {
    return new Date(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      const sanitizedItem = sanitizeForWorker(item, seen)
      return sanitizedItem === OMIT_VALUE ? null : sanitizedItem
    })
  }

  if (seen.has(value)) {
    return seen.get(value)
  }

  const sanitizedObject = {}
  seen.set(value, sanitizedObject)

  Object.entries(value).forEach(([key, nestedValue]) => {
    const sanitizedValue = sanitizeForWorker(nestedValue, seen)

    if (sanitizedValue !== OMIT_VALUE) {
      sanitizedObject[key] = sanitizedValue
    }
  })

  return sanitizedObject
}

const getWorker = () => {
  if (!worker) {
    worker = new Worker(new URL('../workers/adminWorker.js', import.meta.url), {
      type: 'module',
    })

    worker.onmessage = (event) => {
      const { id, success, result, error } = event.data
      const pendingTask = pendingTasks.get(id)

      if (!pendingTask) {
        return
      }

      pendingTasks.delete(id)

      if (success) {
        pendingTask.resolve(result)
        return
      }

      pendingTask.reject(new Error(error))
    }

    worker.onerror = (event) => {
      const fallbackError = event.message || 'Worker execution failed.'

      pendingTasks.forEach(({ reject }) => reject(new Error(fallbackError)))
      pendingTasks.clear()
    }
  }

  return worker
}

export const runWorkerTask = (type, payload) =>
  new Promise((resolve, reject) => {
    const id = ++taskId
    pendingTasks.set(id, { resolve, reject })

    try {
      getWorker().postMessage({
        id,
        type,
        payload: sanitizeForWorker(payload),
      })
    } catch (error) {
      pendingTasks.delete(id)
      reject(error)
    }
  })
