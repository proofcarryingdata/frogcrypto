# FrogCrypto

FrogCrypto is a monorepo managed with Turborepo, designed to create an interactive and engaging experience for Devcon attendees through the collection of virtual and physical frogs. The project integrates multiple frameworks and packages to deliver a seamless experience across web and mobile platforms, leveraging technologies like Express, Next.js, and Vite.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. **Clone the Repository**

   ```sh
   git clone https://github.com/yourusername/frogcrypto.git
   cd frogcrypto
   ```

2. **Install Dependencies**

   Ensure you have [Node.js](https://nodejs.org/) installed (version >= 18).

   ```sh
   pnpm install
   ```

## Usage

### Development

Run all services in development mode:

```sh
pnpm dev
```

This command starts the API server, admin panel, and client app simultaneously with hot-reloading enabled.

### Building for Production

Build all packages and applications:

```sh
pnpm build
```

### Cleaning Build Artifacts

Remove all `dist` directories:

```sh
pnpm clean
```

### Linting

Check the code for linting errors:

```sh
pnpm lint
```

### Testing

Run all tests:

```sh
pnpm test
```

## Project Structure

- **apps/**: Contains all the applications (API server, admin panel, client app, etc.).
- **packages/**: Houses shared packages and utilities used across different applications.
- **docs/**: Documentation and planning materials.
