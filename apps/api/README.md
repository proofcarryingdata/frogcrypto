# `@frogcrypto/api`

The **FrogCrypto API Server** is a core component of the FrogCrypto monorepo, responsible for handling backend operations, user authentication, feed management, and interaction with the PostgreSQL database. Built with Express.js and TypeScript, it leverages Drizzle ORM for database interactions and integrates various PCD (Proof-Carrying Data) packages to ensure secure and verifiable data exchanges.

- **User Authentication**: Authenticate users using GPC (Generic Proof-Carrying Data) and manage user sessions.
- **Feed Management**: Handle user-specific feeds, including fetching and updating feed states.
- **Secure Data Handling**: Utilize POD/GPCs for verifiable and secure data transactions.
- **Database Integration**: Interact with PostgreSQL using Drizzle ORM for robust data management.

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

## Configuration

1. **Environment Variables**

   Create a `.env` file in the `apps/api` directory with the following variables:

   ```env
   POSTGRES_URL=your_postgresql_connection_string
   FROGCRYPTO_ASSETS_URL=your_assets_url
   ISSUER_PRIVATE_KEY=your_issuer_private_key
   ```

2. **Database Setup**

   Ensure PostgreSQL is running and accessible via the `POSTGRES_URL`. Initialize the database by running migrations:

   ```sh
   pnpm run migrate
   ```

## API Endpoints

### Health Check

- **Endpoint**: `/status`
- **Method**: `GET`
- **Description**: Checks if the server is running.
- **Response**:

  ```json
  {
    "ok": true
  }
  ```

### User Authentication

- **Endpoint**: `/users/auth`
- **Method**: `POST`
- **Description**: Authenticates a user using a GPC.
- **Request Body**:

  ```json
  {
    "gpc": {
      "type": "GPCPCD",
      "pcd": "serialized_pcd_data"
    }
  }
  ```

- **Responses**:
  - `200 OK`: Authentication successful.
  - `400 Bad Request`: Missing or invalid GPC.

### User State

- **Endpoint**: `/users/me`
- **Method**: `POST`
- **Description**: Retrieves the authenticated user's state, including feeds and scores.
- **Request Body**: POD (Provable Object Data)

- **Response**:

  ```json
  {
    "feeds": [
      /* user feeds */
    ],
    "possibleFrogs": [
      /* possible frogs */
    ],
    "myScore": {
      "score": 10,
      "semaphore_id_hash": "hash_value",
      "has_telegram_username": false,
      "rank": 1
    }
  }
  ```

### Feed Management

- **List Feeds**

  - **Endpoint**: `/feeds`
  - **Method**: `GET`
  - **Description**: Retrieves a list of publicly available feeds.
  - **Response**:

    ```json
    {
      "providerUrl": "https://api.getfrogs.xyz",
      "providerName": "FrogCrypto",
      "feeds": [
        /* list of feeds */
      ]
    }
    ```

- **Fetch Feed**

  - **Endpoint**: `/feeds/:feedId`
  - **Method**: `POST`
  - **Description**: Fetches data for a specific feed.
  - **Parameters**:

    - `feedId`: ID of the feed to fetch.

  - **Request Body**: POD

  - **Responses**:
    - `200 OK`: Successfully fetched feed.
    - `403 Forbidden`: Feed is not active or rate limited.
    - `404 Not Found`: Feed or user not found.
    - `429 Too Many Requests`: Concurrent fetch limit reached.

## Database Migrations

Managed using Drizzle ORM. Migrations are located in `apps/api/migrations`.

- **Create Migration**

  ```sh
  npx drizzle-kit generate
  ```

- **Run Migrations**

  ```sh
  npx drizzle-kit migrate
  ```
