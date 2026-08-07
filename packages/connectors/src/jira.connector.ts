import { AbstractConnector } from './abstract-connector.js';
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from './types.js';
import JiraClient from 'jira-client';

interface ExtendedJiraClient extends JiraClient {
  assignIssue(issueKey: string, accountId: string): Promise<any>;
  transitionIssue(issueKey: string, transition: any): Promise<any>;
  addComment(issueKey: string, comment: string): Promise<any>;
}

export class JiraConnector extends AbstractConnector {
  private jiraClient?: ExtendedJiraClient;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'jira-01',
      name: 'Jira Connector',
      type: 'jira',
      version: '1.0.0',
      capabilities: [
        'create_issue',
        'update_issue',
        'search_issues',
        'assign_issue',
        'transition_issue',
        'add_comment',
        'health_check'
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    this.jiraClient = new JiraClient({
      protocol: 'https',
      host: credentials.host,
      username: credentials.username,
      password: credentials.password,
      apiVersion: '2',
      strictSSL: true
    }) as unknown as ExtendedJiraClient;
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.jiraClient) {
      return this.handleError(new Error('Jira client not initialized. Call connect() first.'));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case 'create_issue':
          return this.createIssue(request.params);
        case 'update_issue':
          return this.updateIssue(request.params);
        case 'search_issues':
          return this.searchIssues(request.params);
        case 'assign_issue':
          return this.assignIssue(request.params);
        case 'transition_issue':
          return this.transitionIssue(request.params);
        case 'add_comment':
          return this.addComment(request.params);
        case 'health_check':
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch(err => this.handleError(err));
  }

  private async createIssue(params: any): Promise<ConnectorResult> {
    const response = await this.jiraClient!.addNewIssue(params);
    return { success: true, data: response };
  }

  private async updateIssue(params: any): Promise<ConnectorResult> {
    const { issueKey, issueUpdate } = params;
    const response = await this.jiraClient!.updateIssue(issueKey, issueUpdate);
    return { success: true, data: response };
  }

  private async searchIssues(params: any): Promise<ConnectorResult> {
    const { jql, startAt, maxResults } = params;
    const response = await this.jiraClient!.searchJira(jql, { startAt, maxResults });
    return { success: true, data: response.issues };
  }

  private async assignIssue(params: any): Promise<ConnectorResult> {
    const { issueKey, accountId } = params;
    await this.jiraClient!.assignIssue(issueKey, accountId);
    return { success: true, data: { issueKey, status: 'assigned' } };
  }

  private async transitionIssue(params: any): Promise<ConnectorResult> {
    const { issueKey, transitionId } = params;
    await this.jiraClient!.transitionIssue(issueKey, { transition: { id: transitionId } });
    return { success: true, data: { issueKey, status: 'transitioned' } };
  }

  private async addComment(params: any): Promise<ConnectorResult> {
    const { issueKey, comment } = params;
    const response = await this.jiraClient!.addComment(issueKey, comment);
    return { success: true, data: response };
  }

  async health(): Promise<any> {
    try {
      if (!this.jiraClient) return { status: 'disconnected' };
      await this.jiraClient.getServerInfo();
      return { status: 'connected', lastCheck: new Date() };
    } catch (error: any) {
      return { status: 'error', lastCheck: new Date(), error: error.message };
    }
  }
}