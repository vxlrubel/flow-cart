# 🛒 Flow Cart

**Flow Cart** is a modern, API-based eCommerce Admin Dashboard built using **Vue.js ecosystem tools**. It is designed to be scalable, modular, and easy to integrate with any backend (Laravel, Node.js, Go, etc.).

---

## 🚀 Tech Stack

- ⚡ **Vue.js 3** – Progressive frontend framework
- 🧭 **Vue Router** – Client-side routing
- 📦 **Pinia** – State management
- 🔗 **Axios** – API communication
- 🗄️ **JSON Server** – Mock backend API
- 🎨 **Tailwind CSS** – Utility-first styling (optional)

---

## 📌 Features

### 🛍️ Product Management

- Add / Edit / Delete products
- Product variations (size, color, etc.)
- Stock management
- SKU support

### 🎟️ Coupon & Offers System

- Percentage & fixed discount coupons
- Category-based coupons
- Expiry date & usage limit
- Advanced promotional rules

### 📦 Order Management

- Order listing & filtering
- Status update (pending, shipped, delivered)
- Order details view

### 👥 User Management

- Customer list
- Role-based access (future-ready)
- Permissions system (extendable)

### 📊 Dashboard Analytics

- Sales overview
- Revenue stats
- Order trends

### 🧩 Additional Features

- Soft delete (`deleted_at`)
- Timestamps (`created_at`, `updated_at`)
- Modular folder structure
- API-ready architecture

---

## 📁 Project Structure

```
flow-cart/
│
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── router/
│   ├── stores/        # Pinia stores
│   ├── services/      # Axios API calls
│   ├── utils/
│   └── App.vue
│
├── db.json            # JSON Server database
├── package.json
└── vite.config.js
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/flow-cart.git
cd flow-cart
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Run JSON Server (Mock API)

```bash
npx json-server --watch db.json --port 3000
```

### 4️⃣ Run Vue Development Server

```bash
npm run dev
```

---

## 🌐 API Base URL

```
http://localhost:3000
```

Example endpoints:

- `/products`
- `/orders`
- `/users`
- `/coupons`

---

## 🔄 Future Improvements

- 🔐 Authentication (JWT / Laravel Sanctum)
- 🧾 Invoice system
- 📧 Email notifications
- 📈 Advanced analytics (charts)
- 🧠 AI-based recommendations
- 🌍 Multi-language support

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is open-source and available under the **MIT License**.

---

## 👨‍💻 Author

Developed by **Rubel Mahmud**

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
