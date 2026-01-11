# General Purpose E-commerce Website

This is a **general-purpose e-commerce website** designed to demonstrate a modern web application architecture with a full-stack setup. The project includes both a **frontend** and a **backend**, allowing users to browse products, manage their cart, and perform typical e-commerce operations.

## Project Structure

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/)  
- **Backend:** [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) + [Prisma ORM](https://www.prisma.io/)  
- **Database:** PostgreSQL 

## Key Features

### Core E-commerce
- Product listing with search functionality
- Product variants support (e.g., size, color, weight)
- Product categories
- Category-wise product filtering
- Shopping cart management

### User & Admin
- User authentication
- Admin dashboard for managing products and categories

### Forms & Validation
- Form handling using React Hook Form
- Schema-based validation with Zod

### State Management
- Global state management using Redux Toolkit

### Architecture & Deployment
- API-driven architecture with separate frontend and backend
- Secure authentication using JWT and HTTP-only cookies
- Centralized backend error handling
- Ready for deployment on modern platforms