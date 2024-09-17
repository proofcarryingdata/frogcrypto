# FrogCrypto Backend Technical Design

## User Stories and API Call Sequences

### 1. User Registration and Authentication

**User Story**: As a new user, I want to register and authenticate securely so that I can start collecting frogs.

**API Call Sequence**:

1. **POST `/users/register`**:

   - The user provides a signed POD containing their public key and necessary details.
   - The server verifies the POD and creates a new user entry in the database.
   - **Response**: Confirmation of successful registration.

2. **POST `/users/auth`**:
   - The user sends a signed POD or GPC proof for authentication.
   - The server verifies the POD or GPC proof.
   - **Response**: Authentication token or session initiation.

### 2. Collecting Frogs from Feeds

**User Story**: As a user, I want to collect frogs from different feeds to expand my collection.

**API Call Sequence**:

1. **GET `/feeds`**:

   - The user requests a list of available feeds.
   - **Response**: List of feeds with details like `feedId`, `name`, `description`, `cooldown`.

2. **POST `/feeds/{feedId}/collect`**:
   - The user sends a signed POD containing the `feedId` and user identity.
   - The server verifies the POD and checks if the user is eligible (e.g., cooldown period has passed).
   - If eligible, the server generates a frog and updates the user's feed state.
   - **Response**: The newly collected frog data.

### 3. Social Interaction: Frog Requests and Exchanges

**User Story**: As a user, I want to interact with other players by sending and accepting frog requests to exchange contact frogs.

**API Call Sequence**:

1. **POST `/social/request`**:

   - The user sends a signed POD containing the target user's identifier (e.g., `semaphoreId` or `publicKey`).
   - The server verifies the POD and creates a pending friend request.
   - **Response**: Confirmation that the request has been sent.

2. **GET `/social/requests`**:

   - The user retrieves a list of pending friend requests.
   - **Response**: List of incoming and outgoing requests with statuses.

3. **POST `/social/respond`**:
   - The user responds to a friend request by sending a signed POD with the request ID and acceptance status.
   - The server verifies the POD and updates the request status.
   - If accepted, both users receive each other's contact frogs.
   - **Response**: Confirmation of the response and updated contact frogs if accepted.

### 4. Viewing User State and Frogs

**User Story**: As a user, I want to view my current frogs, feeds, and score to track my progress.

**API Call Sequence**:

1. **GET `/users/me`**:
   - The user sends a request with their authentication token.
   - The server retrieves the user's data, including frogs collected, feed states, and score.
   - **Response**: User's frogs, feeds, and score details.

### 5. Leaderboard Access

**User Story**: As a user, I want to see the leaderboard to compare my score with others.

**API Call Sequence**:

1. **GET `/leaderboard`**:
   - The user requests the leaderboard information.
   - **Response**: A list of top users with their scores and rankings.

## Technical Design

### Overview

The backend will be developed using:

- **Express.js** with **tRPC** for type-safe, end-to-end API communication.
- **Drizzle ORM** for type-safe interactions with the PostgreSQL database.
- **@Pod** for authentication and signing of data, ensuring secure communication.
- **Middleware** for handling authentication, rate limiting, and input validation.

### API Endpoints

#### User Management (`/users/*`)

- **POST `/users/register`**

  - **Description**: Registers a new user in the system.
  - **Request Body**: Signed POD containing user details (e.g., public key).
  - **Response**: Success message or appropriate error.

- **POST `/users/auth`**

  - **Description**: Authenticates an existing user.
  - **Request Body**: Signed POD or GPC proof for authentication.
  - **Response**: Authentication token or error message.

- **GET `/users/me`**
  - **Description**: Retrieves the authenticated user's information.
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: User's frogs, feeds, score, and other relevant data.

#### Feed Operations (`/feeds/*`)

- **GET `/feeds`**

  - **Description**: Retrieves a list of available feeds.
  - **Response**: An array of feed objects containing `feedId`, `name`, `description`, `cooldown`, etc.

- **POST `/feeds/{feedId}/collect`**
  - **Description**: Allows a user to collect a frog from a specified feed.
  - **Request Body**: Signed POD with `feedId` and user identity.
  - **Response**: The collected frog data or an error message if not eligible.

#### Social Interactions (`/social/*`)

- **POST `/social/request`**

  - **Description**: Sends a friend (frog) request to another user.
  - **Request Body**: Signed POD containing the target user's identifier.
  - **Response**: Confirmation of request sent or an error message.

- **GET `/social/requests`**

  - **Description**: Retrieves pending friend requests for the user.
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: List of incoming and outgoing friend requests with statuses.

- **POST `/social/respond`**
  - **Description**: Responds to a received friend request.
  - **Request Body**: Signed POD with the request ID and acceptance status (`accepted` or `rejected`).
  - **Response**: Confirmation of the response and contact frogs if accepted.

#### Leaderboard

- **GET `/leaderboard`**
  - **Description**: Retrieves the game's leaderboard.
  - **Response**: List of top players with their scores and rankings.

### Authentication and Security

- **POD Verification**: All requests requiring user identity include a signed POD, which is verified using `@Pod`. This ensures that data originates from authenticated users.

- **Session Management**: Upon successful authentication, the server issues an authentication token (e.g., JWT), which the client includes in the `Authorization` header for subsequent requests.

- **Rate Limiting**: Implement middleware to limit the number of requests per user/IP to prevent abuse, especially on endpoints like `/feeds/{feedId}/collect`.

- **Input Validation**: Validate all incoming data to prevent SQL injection, XSS, and other common attacks.

### Database Schema (Using Drizzle ORM)

- **Users Table (`users`)**

  - `id`: Primary Key.
  - `semaphore_id`: Unique identifier for the user.
  - `public_key`: Public key for verifying signatures.
  - `created_at`: Timestamp.
  - `updated_at`: Timestamp.

- **Feeds Table (`feeds`)**

  - `id`: Primary Key.
  - `feed_id`: Unique identifier for the feed.
  - `name`: Name of the feed.
  - `description`: Description of the feed.
  - `cooldown`: Cooldown period in seconds.
  - `active_until`: Unix timestamp indicating feed expiration.
  - `created_at`: Timestamp.

- **User Feeds Table (`user_feeds`)**

  - `id`: Primary Key.
  - `user_id`: Foreign Key referencing `users.id`.
  - `feed_id`: Foreign Key referencing `feeds.id`.
  - `last_fetched_at`: Timestamp of the last frog collected from this feed.
  - `created_at`: Timestamp.
  - `updated_at`: Timestamp.

- **Frogs Table (`frogs`)**

  - `id`: Primary Key.
  - `user_id`: Foreign Key referencing `users.id`.
  - `frog_id`: Unique identifier for the frog.
  - `data`: JSONB column containing frog attributes.
  - `collected_at`: Timestamp when the frog was collected.
  - `created_at`: Timestamp.
  - `updated_at`: Timestamp.

- **Social Requests Table (`social_requests`)**

  - `id`: Primary Key.
  - `from_user_id`: Foreign Key referencing `users.id` (sender).
  - `to_user_id`: Foreign Key referencing `users.id` (receiver).
  - `status`: Enum (`pending`, `accepted`, `rejected`).
  - `created_at`: Timestamp.
  - `updated_at`: Timestamp.

- **Scores Table (`user_scores`)**
  - `id`: Primary Key.
  - `user_id`: Foreign Key referencing `users.id`.
  - `score`: Integer representing the user's score.
  - `updated_at`: Timestamp.

### Business Logic

#### Collecting Frogs from Feeds

- **Eligibility Check**:

  - The server checks if the user has already collected from this feed within the cooldown period by comparing `last_fetched_at` with the current time.
  - If the cooldown has not expired, the server responds with an error indicating when the user can collect again.

- **Frog Generation**:

  - If eligible, the server generates a new frog with attributes based on predefined probabilities or feed configurations.
  - The frog data is stored in the `frogs` table linked to the user.

- **Updating User Feed State**:

  - The `last_fetched_at` in the `user_feeds` table is updated to the current timestamp.

- **Score Increment**:
  - The user's score in the `user_scores` table is incremented accordingly.

#### Social Interactions

- **Sending Requests**:

  - Users can send friend requests to others by providing their identifiers.
  - Duplicate requests (pending or already accepted) are not allowed.

- **Responding to Requests**:
  - Users can accept or reject incoming friend requests.
  - Upon acceptance, both users receive a contact frog representing each other.
  - The `status` in the `social_requests` table is updated.

#### Leaderboard

- The leaderboard displays users sorted by their scores in descending order.
- Consider implementing pagination for scalability.

### Error Handling

- **Standardized Response Format**:

  - Success responses include a `data` object.
  - Error responses include an `error` object with `code` and `message`.

- **HTTP Status Codes**:
  - `200 OK`: Successful requests.
  - `400 Bad Request`: Invalid input data.
  - `401 Unauthorized`: Missing or invalid authentication.
  - `403 Forbidden`: Action not allowed (e.g., cooldown not expired).
  - `404 Not Found`: Resource not found.
  - `429 Too Many Requests`: Rate limit exceeded.
  - `500 Internal Server Error`: Unexpected server errors.

### Security Considerations

- **Adversarial Protection**:

  - Ensure server-side checks for cooldowns and eligibility to prevent clients from bypassing restrictions.
  - Use secure random number generation for frog attributes to prevent predictability.

- **Data Integrity**:

  - Use transactions where multiple database operations need atomicity (e.g., generating a frog and updating user state).

- **Sensitive Data Handling**:
  - Do not store or log private keys.
  - Store only necessary user data, adhering to privacy principles.

### Open Questions and Trade-offs

1. **Authentication Tokens vs. POD-only Authentication**:

   - **Option 1**: Use short-lived JWTs issued after authentication for session management.
   - **Option 2**: Require a signed POD for every request.
   - **Decision**: Using JWTs can improve performance by reducing the need to verify signatures for every request, at the expense of introducing token management complexity.

2. **Scaling Social Features**:

   - **Question**: How to handle a large number of social interactions and requests efficiently?
   - **Consideration**: Index database fields used in queries, paginate results, and potentially use caching mechanisms.

3. **Preventing Abuse in Social Interactions**:

   - **Question**: How to prevent spam or abuse in friend requests?
   - **Solution**: Limit the number of pending requests per user, implement rate limiting, and consider user blocking mechanisms.

4. **GPC Proofs Integration**:

   - **Question**: When and how to integrate GPC proofs into the authentication process?
   - **Action**: Coordinate with the team developing GPC proofs and plan for future integration without blocking current development.

5. **Adversarial Scenario Handling**:
   - **Question**: How to handle users attempting to manipulate PODs or send unauthorized requests?
   - **Solution**: Implement rigorous server-side validation, use cryptographic verification for all signed data, and monitor for suspicious activities.

### Best Practices

- **Type Safety**: Utilize TypeScript's full capabilities by defining interfaces and types for all data structures and API responses.

- **Modular Code Structure**: Organize code into controllers, services, and repositories to separate concerns and improve maintainability.

- **Middleware Usage**: Centralize common functionalities like authentication, error handling, and logging using Express middleware.

- **API Documentation**: Maintain up-to-date API documentation (e.g., using OpenAPI/Swagger) for frontend developers and external consumers.

- **Testing**: Write comprehensive unit and integration tests for all endpoints and business logic.

### Next Steps

1. **Set Up Project Structure**:

   - Initialize the Express.js application with tRPC integration.
   - Configure Drizzle ORM and connect to the PostgreSQL database.

2. **Implement Middleware**:

   - Develop authentication middleware to verify tokens or POD signatures.
   - Implement rate limiting and input validation middleware.

3. **Define Database Schema**:

   - Create migration scripts using Drizzle ORM to set up database tables as per the schema.

4. **Develop API Endpoints**:

   - Start with user registration and authentication endpoints.
   - Progress to feed operations, social interactions, and leaderboard.

5. **Testing and Validation**:

   - Write tests for each endpoint and business logic component.
   - Validate the system against various adversarial scenarios.

6. **Documentation**:

   - Document the API endpoints, request/response formats, and authentication mechanisms.
   - Provide clear guidelines for frontend integration.

7. **Security Review**:

   - Perform a security assessment to identify any potential vulnerabilities.
   - Ensure compliance with best security practices.

8. **Monitor and Logging Setup**:
   - Implement logging for important events and errors.
   - Set up monitoring tools to observe application performance and user activities.
