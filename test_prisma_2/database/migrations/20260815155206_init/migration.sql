-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "subscription" TEXT NOT NULL DEFAULT 'starter',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementSupplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "contactEmail" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcurementPurchaseOrder" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementPurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'employee',
    "status" TEXT NOT NULL DEFAULT 'active',
    "avatar" TEXT,
    "lastLogin" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "employees" INTEGER,
    "revenue" DOUBLE PRECISION,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "healthScore" DOUBLE PRECISION,
    "lastHealthUpdate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsSuccessPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "crmOrganizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CsSuccessPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsSuccessPlanMilestone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "successPlanId" TEXT NOT NULL,

    CONSTRAINT "CsSuccessPlanMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsHealthScore" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "crmOrganizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CsHealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsChurnRisk" (
    "id" TEXT NOT NULL,
    "riskType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "crmOrganizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CsChurnRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CsInteraction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "crmOrganizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CsInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmContact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT,
    "source" TEXT,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "crmOrganizationId" TEXT,
    "ownerId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmLead" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "score" DOUBLE PRECISION DEFAULT 0,
    "crmOrganizationId" TEXT,
    "ownerId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmOpportunity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "stage" TEXT NOT NULL,
    "probability" DOUBLE PRECISION,
    "expectedCloseDate" TIMESTAMP(3),
    "crmOrganizationId" TEXT,
    "ownerId" TEXT,
    "pipelineId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmPipeline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmPipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmPipelineStage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "probability" DOUBLE PRECISION,
    "pipelineId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmPipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "dueDate" TIMESTAMP(3),
    "crmContactId" TEXT,
    "crmLeadId" TEXT,
    "crmOpportunityId" TEXT,
    "assignedToId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "crmOrganizationId" TEXT,
    "crmContactId" TEXT,
    "crmLeadId" TEXT,
    "crmOpportunityId" TEXT,
    "crmActivityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EiKpiSnapshot" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EiKpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EiBusinessHealthSnapshot" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "factors" TEXT[],
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EiBusinessHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EiForecast" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "expectedRevenue" DOUBLE PRECISION NOT NULL,
    "weightedPipeline" DOUBLE PRECISION NOT NULL,
    "committedRevenue" DOUBLE PRECISION NOT NULL,
    "conservative" DOUBLE PRECISION NOT NULL,
    "bestCase" DOUBLE PRECISION NOT NULL,
    "retentionRevenue" DOUBLE PRECISION NOT NULL,
    "assumptions" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EiForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EiScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "projections" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EiScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EiInsight" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'deterministic',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EiRecommendation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "expectedImpact" TEXT,
    "source" TEXT NOT NULL DEFAULT 'deterministic',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EiRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EiEnterpriseReport" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "healthScore" DOUBLE PRECISION,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EiEnterpriseReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "objective" TEXT,
    "budget" DOUBLE PRECISION,
    "spent" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiCampaignMetric" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "leads" INTEGER NOT NULL DEFAULT 0,
    "qualifiedLeads" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueAttributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cac" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPerLead" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metrics" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiCampaignMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiSeoSnapshot" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "organicLeads" INTEGER NOT NULL DEFAULT 0,
    "organicShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgPosition" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "keywordsTracked" INTEGER NOT NULL DEFAULT 0,
    "metrics" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiSeoSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiConversionSnapshot" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "qualifiedLeads" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestSource" TEXT,
    "weakestSource" TEXT,
    "metrics" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiConversionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiLeadScore" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "leadTitle" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "channel" TEXT,
    "reasoning" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiLeadScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiGrowthInsight" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'deterministic',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiGrowthInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiPricingSuggestion" (
    "id" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION,
    "suggestedPrice" DOUBLE PRECISION,
    "rationale" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'deterministic',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiPricingSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiGrowthReport" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "growthScore" DOUBLE PRECISION NOT NULL,
    "summary" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiGrowthReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OiOperationsSnapshot" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "tasksTotal" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cycleTimeAvg" DOUBLE PRECISION,
    "throughput" INTEGER NOT NULL DEFAULT 0,
    "backlog" INTEGER NOT NULL DEFAULT 0,
    "avgExecutionTime" DOUBLE PRECISION,
    "metrics" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OiOperationsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OiWorkflowSnapshot" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "workflowsTotal" INTEGER NOT NULL DEFAULT 0,
    "workflowsCompleted" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgStages" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stalledWorkflows" INTEGER NOT NULL DEFAULT 0,
    "metrics" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OiWorkflowSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OiAgentUtilization" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentName" TEXT,
    "tasksAssigned" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "utilizationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgExecutionTime" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "metrics" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OiAgentUtilization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OiOpsInsight" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'deterministic',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OiOpsInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OiOpsRecommendation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "action" TEXT NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'deterministic',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OiOpsRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OiOperationsReport" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "opsScore" DOUBLE PRECISION NOT NULL,
    "summary" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OiOperationsReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "capabilities" TEXT[],
    "assignedModel" TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    "status" TEXT NOT NULL DEFAULT 'idle',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "health" TEXT NOT NULL DEFAULT 'healthy',
    "departmentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "budget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dependencies" TEXT[],
    "deadline" TIMESTAMP(3),
    "estimatedCost" DOUBLE PRECISION,
    "executionTime" INTEGER,
    "projectId" TEXT NOT NULL,
    "assignedAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "executionType" TEXT NOT NULL DEFAULT 'sequential',
    "currentStage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "preferences" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "summary" TEXT,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "receiver" TEXT,
    "content" TEXT NOT NULL,
    "modelUsed" TEXT,
    "tokenCount" INTEGER,
    "conversationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "embeddingReference" TEXT,
    "confidence" DOUBLE PRECISION,
    "accessLevel" TEXT NOT NULL DEFAULT 'internal',
    "projectId" TEXT,
    "department" TEXT,
    "client" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "storageUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'unread',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userId" TEXT,
    "agentId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRegistryEntry" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "healthStatus" TEXT NOT NULL,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRegistryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStepRecord" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStepRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LongTermMemoryRecord" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "embedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LongTermMemoryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCredential" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "apiKey" TEXT,
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "deadline" TIMESTAMP(3),
    "owner" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "missionKey" TEXT NOT NULL,
    "workflowId" TEXT,
    "planId" TEXT,
    "executionId" TEXT,
    "correlationId" TEXT,
    "error" TEXT,
    "state" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionCheckpoint" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "state" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuntimeEventLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "correlationId" TEXT,
    "causationId" TEXT,
    "tenantId" TEXT,
    "missionId" TEXT,
    "executionId" TEXT,
    "workflowId" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuntimeEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "config" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinBudget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinInvoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "clientId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinTransaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "budgetId" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrEmployee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'onboarding',
    "hireDate" TIMESTAMP(3) NOT NULL,
    "terminationDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrPosition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL DEFAULT 'full_time',
    "status" TEXT NOT NULL DEFAULT 'open',
    "location" TEXT,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrCandidate" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'applied',
    "appliedAt" TIMESTAMP(3) NOT NULL,
    "offeredAt" TIMESTAMP(3),
    "hiredAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticleVersion" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "changeNote" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeArticleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeIndexEntry" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeIndexEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeReport" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "knowledgeScore" DOUBLE PRECISION NOT NULL,
    "summary" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OpportunityContacts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "ProcurementSupplier_organizationId_status_idx" ON "ProcurementSupplier"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ProcurementPurchaseOrder_organizationId_status_idx" ON "ProcurementPurchaseOrder"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EiKpiSnapshot_organizationId_period_idx" ON "EiKpiSnapshot"("organizationId", "period");

-- CreateIndex
CREATE INDEX "EiBusinessHealthSnapshot_organizationId_createdAt_idx" ON "EiBusinessHealthSnapshot"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "EiForecast_organizationId_period_idx" ON "EiForecast"("organizationId", "period");

-- CreateIndex
CREATE INDEX "EiScenario_organizationId_createdAt_idx" ON "EiScenario"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "EiInsight_organizationId_createdAt_idx" ON "EiInsight"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "EiRecommendation_organizationId_createdAt_idx" ON "EiRecommendation"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "EiEnterpriseReport_organizationId_createdAt_idx" ON "EiEnterpriseReport"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "MiCampaign_organizationId_createdAt_idx" ON "MiCampaign"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "MiCampaignMetric_organizationId_period_idx" ON "MiCampaignMetric"("organizationId", "period");

-- CreateIndex
CREATE INDEX "MiSeoSnapshot_organizationId_period_idx" ON "MiSeoSnapshot"("organizationId", "period");

-- CreateIndex
CREATE INDEX "MiConversionSnapshot_organizationId_period_idx" ON "MiConversionSnapshot"("organizationId", "period");

-- CreateIndex
CREATE INDEX "MiLeadScore_organizationId_createdAt_idx" ON "MiLeadScore"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "MiGrowthInsight_organizationId_createdAt_idx" ON "MiGrowthInsight"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "MiPricingSuggestion_organizationId_createdAt_idx" ON "MiPricingSuggestion"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "MiGrowthReport_organizationId_createdAt_idx" ON "MiGrowthReport"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OiOperationsSnapshot_organizationId_period_idx" ON "OiOperationsSnapshot"("organizationId", "period");

-- CreateIndex
CREATE INDEX "OiWorkflowSnapshot_organizationId_period_idx" ON "OiWorkflowSnapshot"("organizationId", "period");

-- CreateIndex
CREATE INDEX "OiAgentUtilization_organizationId_period_agentId_idx" ON "OiAgentUtilization"("organizationId", "period", "agentId");

-- CreateIndex
CREATE INDEX "OiOpsInsight_organizationId_createdAt_idx" ON "OiOpsInsight"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OiOpsRecommendation_organizationId_createdAt_idx" ON "OiOpsRecommendation"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OiOperationsReport_organizationId_createdAt_idx" ON "OiOperationsReport"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_organizationId_updatedAt_idx" ON "Conversation"("organizationId", "updatedAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_userId_organizationId_key" ON "Setting"("key", "userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCredential_provider_organizationId_key" ON "IntegrationCredential"("provider", "organizationId");

-- CreateIndex
CREATE INDEX "Mission_organizationId_status_updatedAt_idx" ON "Mission"("organizationId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_missionKey_organizationId_key" ON "Mission"("missionKey", "organizationId");

-- CreateIndex
CREATE INDEX "MissionCheckpoint_missionId_createdAt_idx" ON "MissionCheckpoint"("missionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MissionCheckpoint_missionId_version_key" ON "MissionCheckpoint"("missionId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "RuntimeEventLog_eventId_key" ON "RuntimeEventLog"("eventId");

-- CreateIndex
CREATE INDEX "RuntimeEventLog_tenantId_createdAt_idx" ON "RuntimeEventLog"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RuntimeEventLog_idempotencyKey_key" ON "RuntimeEventLog"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Deployment_organizationId_status_idx" ON "Deployment"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_name_environment_organizationId_key" ON "Deployment"("name", "environment", "organizationId");

-- CreateIndex
CREATE INDEX "FinBudget_organizationId_status_idx" ON "FinBudget"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FinInvoice_organizationId_status_idx" ON "FinInvoice"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FinInvoice_number_organizationId_key" ON "FinInvoice"("number", "organizationId");

-- CreateIndex
CREATE INDEX "FinTransaction_organizationId_type_date_idx" ON "FinTransaction"("organizationId", "type", "date");

-- CreateIndex
CREATE INDEX "HrEmployee_organizationId_status_idx" ON "HrEmployee"("organizationId", "status");

-- CreateIndex
CREATE INDEX "HrPosition_organizationId_status_idx" ON "HrPosition"("organizationId", "status");

-- CreateIndex
CREATE INDEX "HrCandidate_positionId_stage_idx" ON "HrCandidate"("positionId", "stage");

-- CreateIndex
CREATE INDEX "HrCandidate_organizationId_stage_idx" ON "HrCandidate"("organizationId", "stage");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_organizationId_status_idx" ON "KnowledgeArticle"("organizationId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_organizationId_category_idx" ON "KnowledgeArticle"("organizationId", "category");

-- CreateIndex
CREATE INDEX "KnowledgeArticleVersion_organizationId_createdAt_idx" ON "KnowledgeArticleVersion"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticleVersion_articleId_version_key" ON "KnowledgeArticleVersion"("articleId", "version");

-- CreateIndex
CREATE INDEX "KnowledgeIndexEntry_organizationId_token_idx" ON "KnowledgeIndexEntry"("organizationId", "token");

-- CreateIndex
CREATE INDEX "KnowledgeIndexEntry_articleId_idx" ON "KnowledgeIndexEntry"("articleId");

-- CreateIndex
CREATE INDEX "KnowledgeReport_organizationId_createdAt_idx" ON "KnowledgeReport"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_OpportunityContacts_AB_unique" ON "_OpportunityContacts"("A", "B");

-- CreateIndex
CREATE INDEX "_OpportunityContacts_B_index" ON "_OpportunityContacts"("B");

-- AddForeignKey
ALTER TABLE "ProcurementSupplier" ADD CONSTRAINT "ProcurementSupplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementPurchaseOrder" ADD CONSTRAINT "ProcurementPurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "ProcurementSupplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementPurchaseOrder" ADD CONSTRAINT "ProcurementPurchaseOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmOrganization" ADD CONSTRAINT "CrmOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsSuccessPlan" ADD CONSTRAINT "CsSuccessPlan_crmOrganizationId_fkey" FOREIGN KEY ("crmOrganizationId") REFERENCES "CrmOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsSuccessPlanMilestone" ADD CONSTRAINT "CsSuccessPlanMilestone_successPlanId_fkey" FOREIGN KEY ("successPlanId") REFERENCES "CsSuccessPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsHealthScore" ADD CONSTRAINT "CsHealthScore_crmOrganizationId_fkey" FOREIGN KEY ("crmOrganizationId") REFERENCES "CrmOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsChurnRisk" ADD CONSTRAINT "CsChurnRisk_crmOrganizationId_fkey" FOREIGN KEY ("crmOrganizationId") REFERENCES "CrmOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CsInteraction" ADD CONSTRAINT "CsInteraction_crmOrganizationId_fkey" FOREIGN KEY ("crmOrganizationId") REFERENCES "CrmOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_crmOrganizationId_fkey" FOREIGN KEY ("crmOrganizationId") REFERENCES "CrmOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_crmOrganizationId_fkey" FOREIGN KEY ("crmOrganizationId") REFERENCES "CrmOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmOpportunity" ADD CONSTRAINT "CrmOpportunity_crmOrganizationId_fkey" FOREIGN KEY ("crmOrganizationId") REFERENCES "CrmOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmOpportunity" ADD CONSTRAINT "CrmOpportunity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmOpportunity" ADD CONSTRAINT "CrmOpportunity_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "CrmPipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmOpportunity" ADD CONSTRAINT "CrmOpportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmPipeline" ADD CONSTRAINT "CrmPipeline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmPipelineStage" ADD CONSTRAINT "CrmPipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "CrmPipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_crmLeadId_fkey" FOREIGN KEY ("crmLeadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_crmOpportunityId_fkey" FOREIGN KEY ("crmOpportunityId") REFERENCES "CrmOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_crmOrganizationId_fkey" FOREIGN KEY ("crmOrganizationId") REFERENCES "CrmOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_crmContactId_fkey" FOREIGN KEY ("crmContactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_crmLeadId_fkey" FOREIGN KEY ("crmLeadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_crmOpportunityId_fkey" FOREIGN KEY ("crmOpportunityId") REFERENCES "CrmOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmNote" ADD CONSTRAINT "CrmNote_crmActivityId_fkey" FOREIGN KEY ("crmActivityId") REFERENCES "CrmActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EiKpiSnapshot" ADD CONSTRAINT "EiKpiSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EiBusinessHealthSnapshot" ADD CONSTRAINT "EiBusinessHealthSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EiForecast" ADD CONSTRAINT "EiForecast_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EiScenario" ADD CONSTRAINT "EiScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EiInsight" ADD CONSTRAINT "EiInsight_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EiRecommendation" ADD CONSTRAINT "EiRecommendation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EiEnterpriseReport" ADD CONSTRAINT "EiEnterpriseReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiCampaign" ADD CONSTRAINT "MiCampaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiCampaignMetric" ADD CONSTRAINT "MiCampaignMetric_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiSeoSnapshot" ADD CONSTRAINT "MiSeoSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiConversionSnapshot" ADD CONSTRAINT "MiConversionSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiLeadScore" ADD CONSTRAINT "MiLeadScore_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiGrowthInsight" ADD CONSTRAINT "MiGrowthInsight_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiPricingSuggestion" ADD CONSTRAINT "MiPricingSuggestion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiGrowthReport" ADD CONSTRAINT "MiGrowthReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OiOperationsSnapshot" ADD CONSTRAINT "OiOperationsSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OiWorkflowSnapshot" ADD CONSTRAINT "OiWorkflowSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OiAgentUtilization" ADD CONSTRAINT "OiAgentUtilization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OiOpsInsight" ADD CONSTRAINT "OiOpsInsight_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OiOpsRecommendation" ADD CONSTRAINT "OiOpsRecommendation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OiOperationsReport" ADD CONSTRAINT "OiOperationsReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRegistryEntry" ADD CONSTRAINT "AgentRegistryEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStepRecord" ADD CONSTRAINT "WorkflowStepRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LongTermMemoryRecord" ADD CONSTRAINT "LongTermMemoryRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCredential" ADD CONSTRAINT "IntegrationCredential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionCheckpoint" ADD CONSTRAINT "MissionCheckpoint_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionCheckpoint" ADD CONSTRAINT "MissionCheckpoint_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinBudget" ADD CONSTRAINT "FinBudget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinInvoice" ADD CONSTRAINT "FinInvoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinInvoice" ADD CONSTRAINT "FinInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinTransaction" ADD CONSTRAINT "FinTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinTransaction" ADD CONSTRAINT "FinTransaction_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "FinBudget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinTransaction" ADD CONSTRAINT "FinTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "FinInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrEmployee" ADD CONSTRAINT "HrEmployee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrPosition" ADD CONSTRAINT "HrPosition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrCandidate" ADD CONSTRAINT "HrCandidate_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "HrPosition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrCandidate" ADD CONSTRAINT "HrCandidate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticleVersion" ADD CONSTRAINT "KnowledgeArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticleVersion" ADD CONSTRAINT "KnowledgeArticleVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeIndexEntry" ADD CONSTRAINT "KnowledgeIndexEntry_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeIndexEntry" ADD CONSTRAINT "KnowledgeIndexEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeReport" ADD CONSTRAINT "KnowledgeReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityContacts" ADD CONSTRAINT "_OpportunityContacts_A_fkey" FOREIGN KEY ("A") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityContacts" ADD CONSTRAINT "_OpportunityContacts_B_fkey" FOREIGN KEY ("B") REFERENCES "CrmOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
