# ShopyKit

ShopyKit is a modern, comprehensive commerce platform monorepo.

## Project Structure

This monorepo contains the following applications:

- **Admin Store (`apps/admin-store`)**: The administrative dashboard for managing the store, products, and orders.
- **Storefront (`apps/store`)**: The customer-facing e-commerce storefront.
- **API (`apps/api`)**: The backend API service powering the platform.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.2.0 or later)
- Node.js (v20.0.0 or later recommended)

### Installation

Install the dependencies:

```bash
bun install
```

### Running the Applications

You can act as a specific user (admin or customer) by running the respective application.

**To run the Admin Dashboard:**

```bash
bun run dev:admin-store
```
*Access at [http://localhost:3000](http://localhost:3000)*

**To run the Storefront:**

```bash
bun turbo dev --filter=@workspace/store
```
*Access at [http://localhost:3002](http://localhost:3002)*

**To run the API only:**

```bash
bun run dev:api
```

**To run everything:**

```bash
bun run dev
```

## Development Commands

- `bun run check`: Run biome check.
- `bun run build`: Build all applications.
- `bun run check-types`: specific type checking.
