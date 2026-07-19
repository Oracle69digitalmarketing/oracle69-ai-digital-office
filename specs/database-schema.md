# Database Schema Specification

Version: 2.0

Status: Approved

Owner: Oracle69 AI Digital Office

Category: Core Engineering Specification

---

# 1. Executive Overview

The Database Schema defines the persistent data architecture of Oracle69 AI Digital Office.

The system uses PostgreSQL (Supabase) as the primary relational database while integrating vector storage for semantic search and Retrieval-Augmented Generation (RAG).

The schema is designed to support enterprise-scale multi-agent workflows, organizational memory, client management, project delivery, and operational analytics.

---

# 2. Objectives

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

Email

Project Status

Task Status

Client Name

Agent ID

Workflow Status

Conversation ID

Created Date

Memory Category

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
