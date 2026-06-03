# Database Schema

The application follows a **microservices** architecture with **three independent
PostgreSQL databases** — one per service. There are **no foreign keys across service
boundaries**: fields like `created_by`, `scheduled_by`, and `inspector_id` hold a user
`id` issued by the auth service (via JWT), but they are deliberately *not* enforced at
the database level because users live in a different service's database.

| Service        | Database                   | Tables                                                       |
| -------------- | -------------------------- | ------------------------------------------------------------ |
| Auth           | `fire_auth_service`        | `users`, `email_verification_codes`, `password_reset_codes`  |
| Management     | `fire_management_service`  | `extinguishers`, `inspections`, `maintenance_logs`           |
| Notification   | `fire_notification_service`| `notifications`                                              |

> The diagram below renders on GitHub, GitLab, Notion, Obsidian, VS Code (with a Mermaid
> extension), and at <https://mermaid.live>. Copy the code block to reuse it elsewhere.
> For dbdiagram.io, use the DBML source in [`db-schema.dbml`](./db-schema.dbml).

## ER Diagram

```mermaid
erDiagram
    %% ─────────────────────────────────────────────
    %% AUTH SERVICE  (db: fire_auth_service)
    %% ─────────────────────────────────────────────
    users {
        text id PK
        text username UK
        text first_name
        text last_name
        text display_name
        text email UK
        text password
        user_role role "user|inspector|admin, default user"
        timestamp email_verified "nullable"
        integer refresh_token_version "default 1"
        timestamp created_at
        timestamp updated_at
    }

    email_verification_codes {
        text id PK
        text user_id FK
        text code_hash
        integer attempts "default 0"
        timestamp expires_at
        timestamp created_at
    }

    password_reset_codes {
        text id PK
        text user_id FK
        text code_hash
        integer attempts "default 0"
        timestamp expires_at
        timestamp created_at
    }

    %% ─────────────────────────────────────────────
    %% MANAGEMENT SERVICE  (db: fire_management_service)
    %% ─────────────────────────────────────────────
    extinguishers {
        text id PK
        text serial_number UK
        text location
        extinguisher_type type "water|co2|foam|dry_chemical"
        extinguisher_size size "2.5lb|5lb|9lb|12lb"
        date installation_date
        date expiry_date
        extinguisher_status status "active|maintenance|expired|decommissioned"
        text created_by "logical user ref"
        timestamp created_at
        timestamp updated_at
    }

    inspections {
        text id PK
        text extinguisher_id FK
        date scheduled_date
        text scheduled_time "nullable"
        inspection_status status "scheduled|completed|cancelled"
        inspection_result result "pass|fail|needs_maintenance, nullable"
        text notes "nullable"
        text scheduled_by "logical user ref"
        text inspector_id "logical user ref"
        timestamp completed_at "nullable"
        timestamp created_at
        timestamp updated_at
    }

    maintenance_logs {
        text id PK
        text extinguisher_id FK
        text inspection_id FK "nullable, on delete set null"
        text action_taken
        date maintenance_date
        text issues_identified "nullable"
        text notes "nullable"
        text inspector_id "logical user ref"
        timestamp created_at
    }

    %% ─────────────────────────────────────────────
    %% NOTIFICATION SERVICE  (db: fire_notification_service)
    %% ─────────────────────────────────────────────
    notifications {
        text id PK
        text type "otp|password_reset|inspection_scheduled|..."
        text channel "default email"
        text recipient
        text subject
        notification_status status "sent|skipped|failed"
        text error "nullable"
        jsonb metadata "nullable"
        timestamp created_at
    }

    %% ── Enforced FKs (within a service / database) ──
    users ||--o{ email_verification_codes : "has (cascade)"
    users ||--o{ password_reset_codes : "has (cascade)"
    extinguishers ||--o{ inspections : "has (cascade)"
    extinguishers ||--o{ maintenance_logs : "has (cascade)"
    inspections |o--o{ maintenance_logs : "triggers (set null)"

    %% ── Logical refs (cross-service, NOT enforced) ──
    users ||..o{ extinguishers : "created_by"
    users ||..o{ inspections : "scheduled_by / inspector_id"
    users ||..o{ maintenance_logs : "inspector_id"
```

## Legend

- **Solid lines (`--`)** — real foreign keys enforced inside a single service's database
  (the `onDelete` behavior is noted on each relationship).
- **Dashed lines (`..`)** — *logical* references that cross a service boundary. These are
  not real foreign keys; they store a user `id` from the auth service.
- `inspections |o--o{ maintenance_logs` — `maintenance_logs.inspection_id` is nullable, so
  a maintenance log may exist without an inspection; deleting an inspection sets it `null`.
- Enum domains are listed inline in each column's comment.
