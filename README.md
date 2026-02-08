# Selokong Farms E-Commerce Platform

A modern, full-stack e-commerce website for Selokong Farms, specializing in sustainable poultry and horticulture products. Located in Malotwana, Botswana, we provide fresh, locally-grown produce including potatoes, watermelons, and butternut squash.

## 🌱 About Selokong Farms

Selokong Farms is committed to sustainable agriculture and delivering the highest quality produce to our community. We use eco-friendly farming practices including mixed crop rotations, natural compost, and careful water management. Our mission is to provide fresh, healthy food while respecting the land and supporting local farmers.

## ✨ Features

### Customer Features
- **Product Catalog**: Browse our complete range of fresh produce with detailed descriptions, pricing, and availability
- **User Authentication**: Secure registration and login system with JWT tokens
- **Shopping Cart**: Add products to cart, update quantities, and manage items
- **Checkout Process**: Complete orders with delivery address and payment method selection
- **Order History**: View past orders and track order status
- **User Profile**: Manage personal information and delivery addresses
- **Responsive Design**: Optimized for desktop and mobile devices

### Admin Features
- **Dashboard**: Overview of sales, inventory, and user statistics
- **User Management**: Create, update, and manage user accounts and roles
- **Product Management**: Add, edit, and manage product inventory
- **Order Management**: Process and update order status
- **Inventory Control**: Track stock levels and manage low-stock alerts
- **Analytics**: View sales reports and customer insights

## 🛠 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Chart.js** - Data visualization

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server auto-restart

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database server
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd selokong-farms
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies (if separate)
cd src/Application_backend
npm install
cd ../..
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb selokong_farms

# Run database schema
psql -d selokong_farms -f src/sql.txt
```

### 4. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/selokong_farms

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Server Port
PORT=4000
```

### 5. Start the Development Servers

#### Frontend (Next.js)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Backend (Express.js)
```bash
cd src/Application_backend
npm run dev
```
API server runs on [http://localhost:4000](http://localhost:4000).

## 📖 Usage

### For Customers
1. **Browse Products**: Visit the homepage to explore available products
2. **Create Account**: Register for an account to place orders
3. **Add to Cart**: Select products and add them to your shopping cart
4. **Checkout**: Complete your order with delivery details
5. **Track Orders**: View order history and status updates

### For Administrators
1. **Login**: Access the admin panel at `/admin/login`
2. **Dashboard**: Monitor business metrics and recent activity
3. **Manage Products**: Add new products, update inventory, and set pricing
4. **User Management**: View and manage customer accounts
5. **Order Processing**: Update order status and manage fulfillment

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:slug` - Get product details
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Cart & Orders
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove from cart
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:order_number/status` - Update order status

## 🗄 Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `products` - Product catalog and inventory
- `categories` - Product categories
- `cart_items` - Shopping cart items
- `orders` - Customer orders
- `order_items` - Order line items
- `addresses` - Delivery addresses
- `inventory_transactions` - Stock movement tracking

See `src/sql.txt` for the complete database schema.

## 🧪 Testing

```bash
# Run frontend tests
npm run test

# Run backend tests
cd src/Application_backend
npm run test
```

## 📦 Build for Production

```bash
# Build frontend
npm run build

# Build backend
cd src/Application_backend
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Selokong Farms**
- **Location**: A1-Malotwana Road, Gaborone, Botswana
- **Phone**: +267 74 022 980
- **Email**: selokongfarms@gmail.com
- **Website**: [Google Maps Location](https://maps.app.goo.gl/csVqCa7CfWMiYnEF6)

## 🌾 Acknowledgments

- Built with care for sustainable agriculture
- Supporting local farmers and communities
- Committed to environmental stewardship

---

*© 2025 Selokong Farms. All rights reserved.*
