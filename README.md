# Vue Frontend with ASP.NET API Integration

A modern Vue.js frontend application built with Vite and TypeScript, designed to integrate seamlessly with ASP.NET Core Web API backend.

## Features

- ⚡ **Vue 3 + TypeScript** - Built with the latest Vue 3 Composition API and TypeScript for type safety
- 🚀 **Vite Build Tool** - Lightning fast development with Vite's hot module replacement
- 🔗 **ASP.NET Integration** - Seamless integration with ASP.NET Core Web API backend
- 🔐 **Authentication** - Complete authentication system with role-based access control
-[object Object]ponsive Design** - Mobile-friendly responsive user interface
- 🎯 **State Management** - Pinia for efficient state management
- 🛣️ **Vue Router** - Client-side routing with navigation guards

## Project Structure

```
src/
├── components/          # Reusable Vue components
├── composables/         # Vue composables for shared logic
├── router/             # Vue Router configuration
├── services/           # API service layers
├── stores/             # Pinia stores for state management
├── types/              # TypeScript type definitions
├── views/              # Page components
├── App.vue             # Root component
└── main.ts             # Application entry point
```

## Prerequisites

- Node.js (version 20.14.0 or higher)
- npm or yarn package manager
- ASP.NET Core Web API backend running

## Installation

1. Navigate to the project directory:
```bash
cd vue-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your ASP.NET API URL:
```env
VITE_API_BASE_URL=https://localhost:7001/api
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build for Production

Build the application for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## API Integration

The application is configured to work with an ASP.NET Core Web API backend. The API client is configured in `src/services/api.ts` with the following features:

- Automatic JWT token handling
- Request/response interceptors
- Error handling
- CORS support

### Expected API Endpoints

The frontend expects the following API endpoints from your ASP.NET backend:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `GET /api/users` - Get users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/{id}` - Update user (Admin only)
- `DELETE /api/users/{id}` - Delete user (Admin only)

## Authentication

The application includes a complete authentication system:

1. **Login/Logout** - JWT-based authentication
2. **Token Management** - Automatic token refresh
3. **Route Guards** - Protected routes based on authentication status
4. **Role-based Access** - Different access levels for Admin and User roles

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking

## Technologies Used

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next generation frontend tooling
- **Vue Router** - Official router for Vue.js
- **Pinia** - State management library
- **Axios** - HTTP client for API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run type checking and tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
