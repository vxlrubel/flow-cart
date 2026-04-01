const API_BASE_URL = 'http://localhost:3001'

const parseResponse = async (response) => {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return response.json()
}

export const fetchCollection = async (resourceKey) => {
  const response = await fetch(`${API_BASE_URL}/${resourceKey}`)
  return parseResponse(response)
}

export const fetchRecord = async (resourceKey, id) => {
  const response = await fetch(`${API_BASE_URL}/${resourceKey}/${id}`)
  return parseResponse(response)
}

export const createRecord = async (resourceKey, payload) => {
  const response = await fetch(`${API_BASE_URL}/${resourceKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export const updateRecord = async (resourceKey, id, payload) => {
  const response = await fetch(`${API_BASE_URL}/${resourceKey}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

export const patchRecord = async (resourceKey, id, payload) => {
  const response = await fetch(`${API_BASE_URL}/${resourceKey}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}
