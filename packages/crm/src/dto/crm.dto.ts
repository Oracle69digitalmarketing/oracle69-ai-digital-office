export interface CreateCrmOrganizationDto {
  name: string;
  industry?: string;
  employees?: number;
  revenue?: number;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  organizationId: string;
}

export interface UpdateCrmOrganizationDto {
  name?: string;
  industry?: string;
  employees?: number;
  revenue?: number;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  status?: string;
}

export interface CreateCrmContactDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  source?: string;
  tags?: string[];
  crmOrganizationId?: string;
  ownerId?: string;
  organizationId: string;
}

export interface UpdateCrmContactDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  source?: string;
  tags?: string[];
  crmOrganizationId?: string;
  ownerId?: string;
  status?: string;
}

export interface CreateCrmLeadDto {
  title?: string;
  source?: string;
  crmOrganizationId?: string;
  ownerId?: string;
  organizationId: string;
}

export interface UpdateCrmLeadDto {
  title?: string;
  source?: string;
  status?: string;
  score?: number;
  crmOrganizationId?: string;
  ownerId?: string;
}

export interface CreateCrmOpportunityDto {
  name: string;
  value: number;
  stage: string;
  probability?: number;
  expectedCloseDate?: Date;
  crmOrganizationId?: string;
  ownerId?: string;
  pipelineId: string;
  organizationId: string;
}

export interface UpdateCrmOpportunityDto {
  name?: string;
  value?: number;
  stage?: string;
  probability?: number;
  expectedCloseDate?: Date;
  crmOrganizationId?: string;
  ownerId?: string;
  pipelineId?: string;
}

export interface CreateCrmPipelineDto {
  name: string;
  organizationId: string;
}

export interface UpdateCrmPipelineDto {
  name?: string;
}

export interface CreateCrmPipelineStageDto {
  name: string;
  order: number;
  probability?: number;
  pipelineId: string;
}

export interface UpdateCrmPipelineStageDto {
  name?: string;
  order?: number;
  probability?: number;
}

export interface CreateCrmActivityDto {
  type: string;
  subject: string;
  description?: string;
  dueDate?: Date;
  crmContactId?: string;
  crmLeadId?: string;
  crmOpportunityId?: string;
  assignedToId?: string;
  organizationId: string;
}

export interface UpdateCrmActivityDto {
  type?: string;
  subject?: string;
  description?: string;
  status?: string;
  dueDate?: Date;
  crmContactId?: string;
  crmLeadId?: string;
  crmOpportunityId?: string;
  assignedToId?: string;
}

export interface CreateCrmNoteDto {
  content: string;
  crmOrganizationId?: string;
  crmContactId?: string;
  crmLeadId?: string;
  crmOpportunityId?: string;
  crmActivityId?: string;
}

export interface UpdateCrmNoteDto {
  content?: string;
}
