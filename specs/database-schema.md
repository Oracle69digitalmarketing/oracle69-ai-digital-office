# Database Schema Specification

Version: 2.1

Status: Approved

Owner: Oracle69 AI Digital Office (Operate)

Category: Core Engineering Specification

---

# 1. Executive Overview

The Database Schema defines the persistent data architecture of Oracle69 AI Digital Office.

As the **Operate** component of the Oracle69 Enterprise AI Platform, the schema focuses on high-performance operational records, agent registration, and workflow persistence. Strategic and global provisioning data is mastered by sibling platform products.

---

# 2. Capability Ownership Boundaries

### [Digital Office Only] - Core Ownership

- **Operational Tables:** Users (Operate context), Agents, Projects, Tasks, Workflows.
- **Agent Registry:** Managing local agent capabilities and status.
- **Workflow Execution History:** Detailed step-by-step records of AI execution.
- **Operational Memory:** Task-specific and department-specific memory records.

### [Platform Reserved: Sibling Products]

- **Tenant Master Records:** Global organization and subscription data (Launch/Build).
- **Strategic Blueprint Data:** Discovered business processes and architecture (Discover/Architect).
- **Enterprise-Wide Analytics:** Cross-product performance and ROI data (Executive/Decide).

---

# 3. Platform Integration Models

The following models support the platform-wide `v1/platform/*` integration layer.

### AgentRegistryEntry

- **ID:** UUID
- **AgentRef:** Reference to `Agents` table.
- **PlatformRole:** Standard role identifier from `platform-contracts`.
- **CapabilitySet:** JSONB of standardized platform capabilities.

### WorkflowStepRecord

- **ID:** UUID
- **WorkflowID:** Reference to `Workflow` table.
- **StepIndex:** Integer.
- **ActionTaken:** String.
- **Payload:** JSONB (Input/Output).
- **ExecutionTime:** Float.

### LongTermMemoryRecord

- **ID:** UUID
- **EnterpriseID:** Global platform ID.
- **Content:** Text.
- **VectorRef:** Reference to Vector Store.
- **Provenance:** Reference to the agent or product that generated the memory.

---

# 4. Objectives

The database shall:

• Store structured business data

• Support multi-agent execution

• Maintain audit history

• Enable scalable workflows

• Support organizational memory

• Preserve data integrity

• Optimize query performance

---

# 3. Database Architecture

Frontend

↓

API Layer

↓

PostgreSQL (Supabase)

↓

Vector Store

↓

Storage

↓

Analytics

---

# 4. Core Entities

Users

Organizations

Departments

Agents

Projects

Tasks

Workflows

Clients

Conversations

Messages

Memory

Documents

Templates

Notifications

Audit Logs

Settings

---

# 5. Users Table

Stores:

User ID

Full Name

Email

Role

Organization ID

Status

Avatar

Created At

Updated At

Last Login

---

# 6. Organizations Table

Stores:

Organization ID

Company Name

Industry

Country

Timezone

Subscription

Owner ID

Status

Created At

---

# 7. Departments Table

Stores:

Department ID

Name

Description

Manager Agent

Status

Created At

---

# 8. Agents Table

Stores:

Agent ID

Name

Department

Role

Capabilities

Assigned Model

Status

Version

Health

Created At

Updated At

---

# 9. Projects Table

Stores:

Project ID

Client ID

Title

Description

Status

Priority

Budget

Start Date

End Date

Owner

Created At

Updated At

---

# 10. Tasks Table

Stores:

Task ID

Project ID

Assigned Agent

Title

Description

Priority

Status

Dependencies

Deadline

Estimated Cost

Execution Time

Created At

Updated At

---

# 11. Workflow Table

Stores:

Workflow ID

Project ID

Workflow Name

Execution Type

Current Stage

Status

Created At

Completed At

---

# 12. Clients Table

Stores:

Client ID

Organization

Industry

Contact Person

Email

Phone

Country

Preferences

Status

Created At

---

# 13. Conversations Table

Stores:

Conversation ID

User ID

Project ID

Started At

Closed At

Status

Summary

---

# 14. Messages Table

Stores:

Message ID

Conversation ID

Sender

Receiver

Content

Timestamp

Model Used

Token Count

---

# 15. Memory Table

Stores:

Memory ID

Category

Department

Project

Client

Summary

Embedding Reference

Confidence

Access Level

Created At

Updated At

---

# 16. Documents Table

Stores:

Document ID

Title

Category

Owner

Project

Version

Storage URL

Status

Created At

Updated At

---

# 17. Templates Table

Stores:

Template ID

Name

Department

Description

Version

Created At

---

# 18. Notifications Table

Stores:

Notification ID

Recipient

Message

Priority

Status

Created At

Read At

---

# 19. Audit Logs

Stores:

Log ID

User

Agent

Action

Resource

Timestamp

IPAddress

Status

---

# 20. Settings Table

Stores:

Setting ID

User

Organization

Key

Value

Updated At

---

# 21. Relationships

Organization

↓

Users

↓

Projects

↓

Tasks

↓

Workflow

↓

Documents

↓

Memory

Clients

↓

Projects

↓

Conversations

↓

Messages

---

# 22. Indexes

Create indexes for:

- **Email:** `unique_user_email`
- **Project Status:** `idx_project_status`
- **Task Status:** `idx_task_status_agent` (Composite: Status, Assigned Agent)
- **Client Name:** `idx_client_org`
- **Agent ID:** `idx_agent_registry` (Foreign key to AgentRegistryEntry)
- **Workflow Status:** `idx_workflow_active`
- **Workflow Steps:** `idx_workflow_steps_order` (Composite: WorkflowID, StepIndex)
- **Conversation ID:** `idx_conversation_ref`
- **Memory:** `idx_memory_enterprise_id`, `idx_memory_category`
- **Vector Search:** HNSW/IVFFlat on `embeddings`

---

# 23. Foreign Keys

Users → Organizations

Projects → Clients

Projects → Users

Tasks → Projects

Tasks → Agents

Messages → Conversations

Memory → Projects

Documents → Projects

Audit Logs → Users

---

# 24. Soft Deletes

Support:

Deleted At

Deleted By

Recovery Window

Archive Status

---

# 25. Version Control

Documents

Templates

Memory Records

Specifications

Policies

Prompt Files

Support full version history.

---

# 26. Security

Enable:

Row Level Security (RLS)

Encrypted Connections

Role-Based Access

Audit Logging

Secure Storage

Least Privilege Access

---

# 27. Backup Strategy

Automatic Daily Backup

Weekly Snapshot

Monthly Archive

Point-in-Time Recovery

Integrity Verification

---

# 28. Performance Optimization

Use:

Indexes

Pagination

Connection Pooling

Query Optimization

Caching

Materialized Views

Partitioning (future)

---

# 29. Scalability

Support:

100,000+ Users

1M+ Tasks

Millions of Messages

Large Document Libraries

Unlimited Projects

Multiple Organizations

---

# 30. Future Tables

AI Models

Prompt Library

Plugin Registry

Workflow Templates

Agent Marketplace

Billing

Invoices

Payments

Usage Analytics

Feature Flags

---

# 31. Implementation Rules

All tables must include:

Primary Key

Created At

Updated At

Status

Audit Support

Every relationship must enforce referential integrity.

Database changes must be managed through versioned migrations.

No production schema changes without migration scripts.

---

# 32. Success Metrics

Fast Queries

Reliable Transactions

High Availability

Zero Data Corruption

Full Audit Trail

Scalable Growth

Secure Access

---

# System Rule

The PostgreSQL database is the single source of truth for structured operational data within Oracle69 AI Digital Office.

All persistent application state must be stored in the database, while semantic knowledge retrieval is supported through the vector memory system.
