const now = () => new Date().toISOString()

const slugify = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const adminResources = [
  {
    key: 'users',
    label: 'Users',
    description: 'Manage platform users and their assigned roles.',
    primaryField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'password', label: 'Password', type: 'text', required: true },
      { key: 'role_id', label: 'Role', type: 'relation', relation: 'roles', optionLabel: 'name', required: true },
    ],
    tableFields: ['name', 'email', 'role_id', 'updated_at'],
  },
  {
    key: 'roles',
    label: 'Roles',
    description: 'Control user role definitions.',
    primaryField: 'name',
    fields: [{ key: 'name', label: 'Name', type: 'text', required: true }],
    tableFields: ['name', 'updated_at'],
  },
  {
    key: 'permissions',
    label: 'Permissions',
    description: 'Define named capabilities for admin access control.',
    primaryField: 'name',
    fields: [{ key: 'name', label: 'Name', type: 'text', required: true }],
    tableFields: ['name', 'updated_at'],
  },
  {
    key: 'categories',
    label: 'Categories',
    description: 'Organize catalog categories and parent-child relationships.',
    primaryField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      {
        key: 'parent_id',
        label: 'Parent Category',
        type: 'relation',
        relation: 'categories',
        optionLabel: 'name',
        nullable: true,
      },
    ],
    tableFields: ['name', 'parent_id', 'updated_at'],
  },
  {
    key: 'products',
    label: 'Products',
    description: 'Maintain products, pricing, stock, and category placement.',
    primaryField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      {
        key: 'slug',
        label: 'Slug',
        type: 'text',
        required: true,
        transform: ({ draft, value }) => value || slugify(draft.name),
      },
      { key: 'price', label: 'Price', type: 'number', required: true, step: '0.01' },
      { key: 'stock', label: 'Stock', type: 'number', required: true, step: '1' },
      {
        key: 'category_id',
        label: 'Category',
        type: 'relation',
        relation: 'categories',
        optionLabel: 'name',
        required: true,
      },
    ],
    tableFields: ['name', 'slug', 'price', 'stock', 'category_id', 'updated_at'],
  },
  {
    key: 'orders',
    label: 'Orders',
    description: 'Track order ownership, totals, and fulfillment state.',
    primaryField: 'id',
    fields: [
      { key: 'user_id', label: 'User', type: 'relation', relation: 'users', optionLabel: 'name', required: true },
      { key: 'total', label: 'Total', type: 'number', required: true, step: '0.01' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: ['pending', 'processing', 'completed', 'cancelled'],
      },
    ],
    tableFields: ['id', 'user_id', 'total', 'status', 'updated_at'],
  },
  {
    key: 'order_items',
    label: 'Order Items',
    description: 'Manage line items attached to each order.',
    primaryField: 'id',
    fields: [
      { key: 'order_id', label: 'Order', type: 'relation', relation: 'orders', optionLabel: 'id', required: true },
      {
        key: 'product_id',
        label: 'Product',
        type: 'relation',
        relation: 'products',
        optionLabel: 'name',
        required: true,
      },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true, step: '1' },
      { key: 'price', label: 'Unit Price', type: 'number', required: true, step: '0.01' },
    ],
    tableFields: ['order_id', 'product_id', 'quantity', 'price', 'updated_at'],
  },
  {
    key: 'carts',
    label: 'Carts',
    description: 'Review shopping carts by user.',
    primaryField: 'id',
    fields: [{ key: 'user_id', label: 'User', type: 'relation', relation: 'users', optionLabel: 'name', required: true }],
    tableFields: ['id', 'user_id', 'updated_at'],
  },
  {
    key: 'cart_items',
    label: 'Cart Items',
    description: 'Manage items currently placed in carts.',
    primaryField: 'id',
    fields: [
      { key: 'cart_id', label: 'Cart', type: 'relation', relation: 'carts', optionLabel: 'id', required: true },
      {
        key: 'product_id',
        label: 'Product',
        type: 'relation',
        relation: 'products',
        optionLabel: 'name',
        required: true,
      },
      { key: 'quantity', label: 'Quantity', type: 'number', required: true, step: '1' },
    ],
    tableFields: ['cart_id', 'product_id', 'quantity', 'updated_at'],
  },
  {
    key: 'coupons',
    label: 'Coupons',
    description: 'Configure discount codes and validity windows.',
    primaryField: 'code',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      {
        key: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: ['percentage', 'fixed'],
      },
      { key: 'value', label: 'Value', type: 'number', required: true, step: '0.01' },
      { key: 'max_discount', label: 'Max Discount', type: 'number', required: true, step: '0.01' },
      { key: 'min_cart', label: 'Min Cart', type: 'number', required: true, step: '0.01' },
      { key: 'start_at', label: 'Start Date', type: 'date', required: true },
      { key: 'end_at', label: 'End Date', type: 'date', required: true },
    ],
    tableFields: ['code', 'type', 'value', 'min_cart', 'end_at', 'updated_at'],
  },
  {
    key: 'offers',
    label: 'Offers',
    description: 'Schedule promotional campaigns.',
    primaryField: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      {
        key: 'type',
        label: 'Type',
        type: 'select',
        required: true,
        options: ['flash_sale', 'seasonal', 'bundle'],
      },
      { key: 'start_at', label: 'Start Date', type: 'date', required: true },
      { key: 'end_at', label: 'End Date', type: 'date', required: true },
    ],
    tableFields: ['name', 'type', 'start_at', 'end_at', 'updated_at'],
  },
  {
    key: 'wishlists',
    label: 'Wishlists',
    description: 'See which users saved which products.',
    primaryField: 'id',
    fields: [
      { key: 'user_id', label: 'User', type: 'relation', relation: 'users', optionLabel: 'name', required: true },
      {
        key: 'product_id',
        label: 'Product',
        type: 'relation',
        relation: 'products',
        optionLabel: 'name',
        required: true,
      },
    ],
    tableFields: ['user_id', 'product_id', 'updated_at'],
  },
  {
    key: 'reviews',
    label: 'Reviews',
    description: 'Moderate product ratings and comments.',
    primaryField: 'id',
    fields: [
      { key: 'user_id', label: 'User', type: 'relation', relation: 'users', optionLabel: 'name', required: true },
      {
        key: 'product_id',
        label: 'Product',
        type: 'relation',
        relation: 'products',
        optionLabel: 'name',
        required: true,
      },
      { key: 'rating', label: 'Rating', type: 'number', required: true, step: '1', min: 1, max: 5 },
      { key: 'comment', label: 'Comment', type: 'textarea', required: true },
    ],
    tableFields: ['user_id', 'product_id', 'rating', 'updated_at'],
  },
]

export const adminResourceMap = Object.fromEntries(adminResources.map((resource) => [resource.key, resource]))

export const getResourceConfig = (resourceKey) => adminResourceMap[resourceKey]

export const buildEmptyRecord = (resource) =>
  resource.fields.reduce((record, field) => {
    record[field.key] = field.defaultValue ?? ''
    return record
  }, {})

export const preparePayload = (resource, draft, existingRecord = null) => {
  const payload = {}

  resource.fields.forEach((field) => {
    let value = draft[field.key]

    if (field.transform) {
      value = field.transform({ draft, value, existingRecord })
    }

    if (field.type === 'number') {
      payload[field.key] = value === '' ? null : Number(value)
      return
    }

    if (field.type === 'relation') {
      payload[field.key] = value === '' ? null : Number(value)
      return
    }

    payload[field.key] = value
  })

  const timestamp = now()

  if (existingRecord) {
    return {
      ...existingRecord,
      ...payload,
      updated_at: timestamp,
    }
  }

  return {
    ...payload,
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null,
  }
}

export const formatPrimaryValue = (resource, record) => {
  const primaryValue = record?.[resource.primaryField]
  return primaryValue ?? `#${record?.id ?? ''}`
}

export const singularizeLabel = (label) => {
  if (label.endsWith('ies')) {
    return `${label.slice(0, -3)}y`
  }

  if (label.endsWith('s')) {
    return label.slice(0, -1)
  }

  return label
}
